import Papa from "papaparse";
import { ColumnMeta, ColumnRole, ProcessedDataset } from "../types/dataset";
import { computeMinMaxBounds, normalizeMinMax } from "./normalization";
import { encodeOneHot, extractUniqueClasses } from "./oneHot";

export interface CsvParseResult {
  data: Record<string, any>[];
  columnNames: string[];
  error?: string;
}

/**
 * Parses raw CSV content with header and dynamic typing.
 */
export function parseCsvString(csvContent: string): CsvParseResult {
  if (!csvContent || csvContent.trim() === "") {
    return { data: [], columnNames: [], error: "CSV content cannot be empty" };
  }

  const result = Papa.parse<Record<string, any>>(csvContent, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: "greedy",
  });

  if (result.errors && result.errors.length > 0 && (!result.data || result.data.length === 0)) {
    return {
      data: [],
      columnNames: [],
      error: result.errors[0]?.message || "Failed to parse CSV",
    };
  }

  const fields = result.meta.fields?.map((f) => f.trim()).filter((f) => f.length > 0) || [];

  // Filter out any trailing or empty rows that Papa might produce
  const cleanData = (result.data || []).filter((row) => {
    if (!row || typeof row !== "object") return false;
    // Check if at least one field has non-null value
    return Object.values(row).some((v) => v !== null && v !== undefined && v !== "");
  });

  if (fields.length === 0 || cleanData.length === 0) {
    return {
      data: [],
      columnNames: [],
      error: "CSV must contain a header row and at least one non-empty data row",
    };
  }

  return {
    data: cleanData,
    columnNames: fields,
  };
}

/**
 * Automatically inspects column names and sample values to detect types,
 * bounds, and assign default roles (input, target, ignore).
 */
export function detectColumnMetadata(
  data: Record<string, any>[],
  columnNames: string[]
): ColumnMeta[] {
  if (!columnNames || columnNames.length === 0) return [];

  const columns: ColumnMeta[] = [];
  const targetCandidates: string[] = [];

  for (let i = 0; i < columnNames.length; i++) {
    const name = columnNames[i];
    const lowerName = name.toLowerCase();
    const values = data.map((row) => row[name]);

    // Check if numeric or categorical
    let numericCount = 0;
    let nonNullCount = 0;
    for (const v of values) {
      if (v !== null && v !== undefined && String(v).trim() !== "") {
        nonNullCount++;
        if (typeof v === "number" && !Number.isNaN(v)) {
          numericCount++;
        } else if (!Number.isNaN(Number(v))) {
          numericCount++;
        }
      }
    }

    const isNumeric = nonNullCount > 0 && numericCount / nonNullCount >= 0.8;
    const type: "numeric" | "categorical" = isNumeric ? "numeric" : "categorical";

    let role: ColumnRole = "input";

    // Detect ID column -> ignore
    if (
      lowerName === "id" ||
      lowerName === "_id" ||
      lowerName === "row_id" ||
      lowerName === "rowid" ||
      lowerName === "index"
    ) {
      role = "ignore";
    } else if (
      lowerName === "species" ||
      lowerName === "class" ||
      lowerName === "color" ||
      lowerName === "target" ||
      lowerName === "label" ||
      lowerName === "output"
    ) {
      role = "target";
      targetCandidates.push(name);
    } else if (type === "categorical") {
      role = "target";
      targetCandidates.push(name);
    } else {
      role = "input";
    }

    let min: number | undefined;
    let max: number | undefined;
    let uniqueValues: string[] | undefined;

    if (type === "numeric") {
      let curMin = Infinity;
      let curMax = -Infinity;
      for (const v of values) {
        const num = Number(v);
        if (!Number.isNaN(num)) {
          if (num < curMin) curMin = num;
          if (num > curMax) curMax = num;
        }
      }
      if (curMin !== Infinity) {
        min = curMin;
        max = curMax;
      }
    } else {
      uniqueValues = extractUniqueClasses(values);
    }

    columns.push({
      name,
      role,
      type,
      min,
      max,
      uniqueValues,
    });
  }

  // Ensure exactly one target column by default
  const targets = columns.filter((c) => c.role === "target");
  if (targets.length === 0) {
    // If no target detected, pick the last non-ignored column
    for (let i = columns.length - 1; i >= 0; i--) {
      if (columns[i].role !== "ignore") {
        columns[i].role = "target";
        break;
      }
    }
  } else if (targets.length > 1) {
    // Keep only the last candidate as target, revert earlier ones to input
    for (let i = 0; i < targets.length - 1; i++) {
      targets[i].role = targets[i].type === "numeric" ? "input" : "ignore";
    }
  }

  return columns;
}

/**
 * Transforms raw CSV rows into normalized rows strictly ordered for backend consumption:
 * 1. All input feature columns in sequential order (keys 0 to inputCount - 1), Min-Max normalized.
 * 2. All target class columns in sequential order (keys inputCount to inputCount + outputCount - 1), One-Hot encoded (1.0 or 0.0).
 * Ignored columns are omitted.
 */
export function processDataset(
  rawRows: Record<string, any>[],
  columns: ColumnMeta[]
): ProcessedDataset {
  const inputCols = columns.filter((c) => c.role === "input");
  const targetCol = columns.find((c) => c.role === "target");

  const inputKeys = inputCols.map((c) => c.name);
  const inputKeySet = new Set(inputKeys);
  const bounds = computeMinMaxBounds(rawRows, inputKeys);

  const targetClasses = targetCol
    ? extractUniqueClasses(rawRows.map((r) => r[targetCol.name]))
    : [];

  const isIntegerIndex = (s: string) => /^(?:0|[1-9]\d*)$/.test(s) && Number(s) < 4294967295;
  const hasIntegerClass = targetClasses.some(isIntegerIndex);
  const hasCollision = targetClasses.some((c) => inputKeySet.has(c));
  const needsPrefix = hasIntegerClass || hasCollision;

  let prefix = "";
  if (needsPrefix) {
    const candidates = ["class", "target", "label", "output"];
    for (const cand of candidates) {
      if (!targetClasses.some((cls) => inputKeySet.has(`${cand}_${cls}`))) {
        prefix = cand;
        break;
      }
    }
    if (!prefix) prefix = "class";
  }

  const normalizedRows: Record<string, number>[] = rawRows.map((row) => {
    const normRow: Record<string, number> = {};

    // 1. Inputs first (guarantees Object.keys() order in V8/JSON)
    for (const col of inputCols) {
      const raw = row[col.name];
      if (raw === null || raw === undefined || (typeof raw === "string" && raw.trim() === "")) {
        normRow[col.name] = 0.0;
        continue;
      }
      const rawVal = typeof raw === "number" ? raw : Number(raw);
      const b = bounds[col.name];
      normRow[col.name] = b ? normalizeMinMax(rawVal, b.min, b.max) : 0.0;
    }

    // 2. Targets second (one-hot encoded via encodeOneHot)
    if (targetCol && targetClasses.length > 0) {
      const rawTarget = String(row[targetCol.name] ?? "").trim();
      const encoded = encodeOneHot(rawTarget, targetClasses, prefix);
      Object.assign(normRow, encoded);
    }

    return normRow;
  });

  return {
    rawRows,
    normalizedRows,
    columns,
    inputCount: inputCols.length,
    outputCount: targetClasses.length,
    firstClassIndex: inputCols.length,
    targetClasses,
  };
}
