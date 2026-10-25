/**
 * Target Class One-Hot Encoding and Decoding Utilities
 * Maps categorical labels to binary indicator vectors and vice-versa.
 */

export function extractUniqueClasses(values: (string | number | null | undefined)[]): string[] {
  const classSet = new Set<string>();
  for (const v of values) {
    if (v !== undefined && v !== null) {
      const trimmed = String(v).trim();
      if (trimmed.length > 0) {
        classSet.add(trimmed);
      }
    }
  }
  return Array.from(classSet).sort();
}

export function getUniqueClasses(
  rows: Record<string, any>[],
  targetColumn: string
): string[] {
  return extractUniqueClasses(rows.map((r) => r[targetColumn]));
}

export function encodeOneHot(
  classValue: string,
  uniqueClasses: string[],
  prefix: string = ""
): Record<string, number> {
  const result: Record<string, number> = {};
  const normalizedClass = (classValue ?? "").trim();

  for (const c of uniqueClasses) {
    const key = prefix ? `${prefix}_${c}` : c;
    result[key] = normalizedClass === c ? 1.0 : 0.0;
  }

  return result;
}

export function oneHotEncodeRows(
  rows: Record<string, any>[],
  targetColumn: string,
  classList?: string[] | null
): Record<string, any>[] {
  const classes = classList || getUniqueClasses(rows, targetColumn);

  return rows.map((row) => {
    const output = { ...row };
    const label = String(row[targetColumn] ?? "").trim();
    for (const c of classes) {
      output[c] = label === c ? 1.0 : 0.0;
    }
    return output;
  });
}

export function argMax(vector: number[]): number {
  if (!vector || vector.length === 0) return 0;
  let maxIdx = 0;
  let maxVal = -Infinity;
  for (let i = 0; i < vector.length; i++) {
    if (vector[i] > maxVal) {
      maxVal = vector[i];
      maxIdx = i;
    }
  }
  return maxIdx;
}

export function decodeOneHot(vector: number[], uniqueClasses: string[]): string {
  if (!uniqueClasses || uniqueClasses.length === 0) return "";
  const idx = argMax(vector);
  return uniqueClasses[idx] ?? "";
}
