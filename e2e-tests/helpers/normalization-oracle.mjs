/**
 * Normalization Oracle: Authoritative mathematical reference for Min-Max feature scaling.
 * Formula: norm(x) = (x - min) / (max - min)
 * When max === min, the feature has zero variance, resulting in 0.0 to prevent division by zero.
 */

export function computeMinMaxBounds(rows, featureKeys) {
  const bounds = {};
  for (const key of featureKeys) {
    bounds[key] = { min: Infinity, max: -Infinity };
  }

  for (const row of rows) {
    for (const key of featureKeys) {
      const val = Number(row[key]);
      if (!Number.isNaN(val)) {
        if (val < bounds[key].min) bounds[key].min = val;
        if (val > bounds[key].max) bounds[key].max = val;
      }
    }
  }

  return bounds;
}

export function minMaxNormalize(rows, featureKeys, bounds = null) {
  if (!rows || rows.length === 0) return [];
  const effectiveBounds = bounds || computeMinMaxBounds(rows, featureKeys);

  return rows.map((row) => {
    const normalized = { ...row };
    for (const key of featureKeys) {
      const raw = Number(row[key]);
      if (Number.isNaN(raw)) {
        normalized[key] = 0.0;
        continue;
      }
      const { min, max } = effectiveBounds[key];
      if (max === min) {
        normalized[key] = 0.0;
      } else {
        const scaled = (raw - min) / (max - min);
        // Clamp to [0, 1] to guard against numerical precision issues
        normalized[key] = Math.max(0.0, Math.min(1.0, scaled));
      }
    }
    return normalized;
  });
}
