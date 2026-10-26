import { useState, useEffect, useCallback } from "react";
import { ColumnMeta, ColumnRole, ProcessedDataset } from "../types/dataset";
import { parseCsvString, detectColumnMetadata, processDataset } from "../utils/csvParser";
import { getPresetById, irisPreset } from "../data/presets";

export interface UseDatasetReturn {
  currentPresetId: string | null;
  fileName: string;
  rawRows: Record<string, any>[];
  columns: ColumnMeta[];
  processedDataset: ProcessedDataset | null;
  isLoading: boolean;
  error: string | null;
  loadPreset: (presetId: string) => void;
  loadCsvString: (csvText: string, fileName?: string) => void;
  loadCsvFile: (file: File) => Promise<void>;
  setColumnRole: (columnName: string, newRole: ColumnRole) => void;
  reset: () => void;
}

export function useDataset(): UseDatasetReturn {
  const [currentPresetId, setCurrentPresetId] = useState<string | null>("iris");
  const [fileName, setFileName] = useState<string>("Iris.csv");
  const [rawRows, setRawRows] = useState<Record<string, any>[]>([]);
  const [columns, setColumns] = useState<ColumnMeta[]>([]);
  const [processedDataset, setProcessedDataset] = useState<ProcessedDataset | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadCsvStringInternal = useCallback((csvText: string, customFileName?: string, presetId?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const parsed = parseCsvString(csvText);
      if (parsed.error) {
        setError(parsed.error);
        setIsLoading(false);
        return;
      }

      let detectedCols = detectColumnMetadata(parsed.data, parsed.columnNames);

      // Fine-tune preset roles for canonical benchmarks
      if (presetId === "iris") {
        detectedCols = detectedCols.map((c) => {
          if (c.name.toLowerCase() === "id") return { ...c, role: "ignore" as ColumnRole };
          if (c.name.toLowerCase() === "species") return { ...c, role: "target" as ColumnRole, type: "categorical" as const };
          return { ...c, role: "input" as ColumnRole, type: "numeric" as const };
        });
      } else if (presetId === "colorballs" || presetId === "color-balls") {
        detectedCols = detectedCols.map((c) => {
          if (c.name.toLowerCase() === "color") return { ...c, role: "target" as ColumnRole, type: "categorical" as const };
          return { ...c, role: "input" as ColumnRole, type: "numeric" as const };
        });
      }

      const processed = processDataset(parsed.data, detectedCols);

      setRawRows(parsed.data);
      setColumns(detectedCols);
      setProcessedDataset(processed);
      setFileName(customFileName || (presetId ? `${presetId}.csv` : "custom.csv"));
      setCurrentPresetId(presetId ?? null);
    } catch (err: any) {
      setError(err?.message || "Falha ao processar o dataset CSV");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadPreset = useCallback((presetId: string) => {
    const preset = getPresetById(presetId);
    if (!preset) {
      setError(`Preset '${presetId}' não encontrado`);
      return;
    }
    loadCsvStringInternal(preset.csvContent, `${preset.name}.csv`, preset.id);
  }, [loadCsvStringInternal]);

  const loadCsvString = useCallback((csvText: string, customFileName?: string) => {
    loadCsvStringInternal(csvText, customFileName || "uploaded.csv", undefined);
  }, [loadCsvStringInternal]);

  const loadCsvFile = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);

    try {
      if (!file.name.toLowerCase().endsWith(".csv")) {
        throw new Error("O arquivo deve ser um formato .csv válido");
      }
      const text = await file.text();
      loadCsvStringInternal(text, file.name, undefined);
    } catch (err: any) {
      setError(err?.message || "Falha ao ler o arquivo CSV");
      setIsLoading(false);
    }
  }, [loadCsvStringInternal]);

  const setColumnRole = useCallback((columnName: string, newRole: ColumnRole) => {
    setColumns((prevCols) => {
      const updated = prevCols.map((col) => {
        if (col.name === columnName) {
          return { ...col, role: newRole };
        }
        // If this column becomes target, downgrade any existing target to input/ignore
        if (newRole === "target" && col.role === "target") {
          return { ...col, role: (col.type === "numeric" ? "input" : "ignore") as ColumnRole };
        }
        return col;
      });

      // Re-run dataset processing with new column configurations
      if (rawRows.length > 0) {
        const reprocessed = processDataset(rawRows, updated);
        setProcessedDataset(reprocessed);
      }

      return updated;
    });
  }, [rawRows]);

  const reset = useCallback(() => {
    loadPreset("iris");
  }, [loadPreset]);

  // Initial mount: load Iris preset by default
  useEffect(() => {
    loadCsvStringInternal(irisPreset.csvContent, "Iris.csv", "iris");
  }, [loadCsvStringInternal]);

  return {
    currentPresetId,
    fileName,
    rawRows,
    columns,
    processedDataset,
    isLoading,
    error,
    loadPreset,
    loadCsvString,
    loadCsvFile,
    setColumnRole,
    reset,
  };
}
