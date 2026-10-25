/**
 * Min-Max Feature Normalization Utilities
 * Scales numeric feature columns to [0.0, 1.0].
 * Formula: x_norm = (x - min) / (max - min)
 * Includes zero-variance protection (returns 0.0 when max === min).
 */

export interface MinMaxBounds {
  min: number;
  max: number;
}

export function computeColumnStats(values: number[]): MinMaxBounds {
  if (!values || values.length === 0) {
    return { min: 0, max: 0 };
  }
  let min = Infinity;
  let max = -Infinity;
  let count = 0;

  for (const v of values) {
    if (typeof v === "number" && !Number.isNaN(v)) {
      if (v < min) min = v;
      if (v > max) max = v;
      count++;
    }
  }

  if (count === 0) {
    return { min: 0, max: 0 };
  }

  return { min, max };
}

export function computeMinMaxBounds(
  rows: Record<string, any>[],
  featureKeys: string[]
): Record<string, MinMaxBounds> {
  const bounds: Record<string, MinMaxBounds> = {};
  for (const key of featureKeys) {
    bounds[key] = { min: Infinity, max: -Infinity };
  }

  if (!rows || !Array.isArray(rows) || rows.length === 0) {
    for (const key of featureKeys) {
      bounds[key] = { min: 0, max: 0 };
    }
    return bounds;
  }

  for (const row of rows) {
    if (!row) continue;
    for (const key of featureKeys) {
      const raw = row[key];
      if (raw === null || raw === undefined) {
        continue;
      }
      if (typeof raw === "string" && raw.trim() === "") {
        continue;
      }

      const val = typeof raw === "number" ? raw : Number(raw);
      if (typeof val === "number" && Number.isFinite(val)) {
        if (val < bounds[key].min) bounds[key].min = val;
        if (val > bounds[key].max) bounds[key].max = val;
      }
    }
  }

  for (const key of featureKeys) {
    if (
      !Number.isFinite(bounds[key].min) ||
      !Number.isFinite(bounds[key].max) ||
      bounds[key].max < bounds[key].min
    ) {
      bounds[key] = { min: 0, max: 0 };
    }
  }

  return bounds;
}

export function normalizeMinMax(value: number, min: number, max: number): number {
  if (typeof value !== "number" || Number.isNaN(value) || !Number.isFinite(value)) {
    return 0.0;
  }
  if (Number.isNaN(min) || Number.isNaN(max)) {
    return NaN;
  }
  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) {
    return 0.0;
  }
  if (value <= min) {
    return 0.0;
  }
  if (value >= max) {
    return 1.0;
  }
  const range = max - min;
  const scaled = Number.isFinite(range)
    ? (value - min) / range
    : (value / 2 - min / 2) / (max / 2 - min / 2);

  const result = Math.max(0.0, Math.min(1.0, scaled));
  return Number.isFinite(result) ? result : 0.0;
}

export function normalizeValues(values: number[]): number[] {
  const { min, max } = computeColumnStats(values);
  return values.map((v) => normalizeMinMax(v, min, max));
}

export function minMaxNormalize(
  rows: Record<string, any>[],
  featureKeys: string[],
  bounds?: Record<string, MinMaxBounds> | null
): Record<string, any>[] {
  if (!rows || !Array.isArray(rows) || rows.length === 0) return [];
  if (!featureKeys || featureKeys.length === 0) return rows.map((r) => ({ ...r }));
  const effectiveBounds = bounds || computeMinMaxBounds(rows, featureKeys);

  return rows.map((row) => {
    if (!row) return {};
    const normalized = { ...row };
    for (const key of featureKeys) {
      const rawVal = row[key];
      if (
        rawVal === null ||
        rawVal === undefined ||
        (typeof rawVal === "string" && rawVal.trim() === "")
      ) {
        normalized[key] = 0.0;
        continue;
      }

      const raw = typeof rawVal === "number" ? rawVal : Number(rawVal);
      if (!Number.isFinite(raw) || Number.isNaN(raw)) {
        normalized[key] = 0.0;
        continue;
      }

      const b = effectiveBounds[key];
      if (!b || !Number.isFinite(b.min) || !Number.isFinite(b.max) || b.max <= b.min) {
        normalized[key] = 0.0;
      } else {
        normalized[key] = normalizeMinMax(raw, b.min, b.max);
      }
    }
    return normalized;
  });
}
