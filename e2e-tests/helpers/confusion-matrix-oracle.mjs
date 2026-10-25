/**
 * Confusion Matrix Oracle: Authoritative reference for matrix metrics, accuracy calculation,
 * and per-class precision/recall computations.
 * Rows = Actual / Expected class
 * Columns = Predicted class
 */

export function computeAccuracy(matrix) {
  if (!matrix || matrix.length === 0) return 0;
  let correct = 0;
  let total = 0;
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[r].length; c++) {
      const val = matrix[r][c];
      total += val;
      if (r === c) correct += val;
    }
  }
  if (total === 0) return 0;
  return Number(((correct / total) * 100).toFixed(2));
}

export function computeClassMetrics(matrix, classNames = []) {
  const K = matrix.length;
  const metrics = [];

  for (let i = 0; i < K; i++) {
    const className = classNames[i] || `Class ${i}`;
    const truePositives = matrix[i][i] || 0;

    // Row total = all actual instances of class i
    let rowTotal = 0;
    for (let c = 0; c < K; c++) rowTotal += matrix[i][c];

    // Col total = all predictions of class i
    let colTotal = 0;
    for (let r = 0; r < K; r++) colTotal += matrix[r][i];

    const recall = rowTotal > 0 ? (truePositives / rowTotal) * 100 : 0;
    const precision = colTotal > 0 ? (truePositives / colTotal) * 100 : 0;

    metrics.push({
      classIndex: i,
      className,
      truePositives,
      actualCount: rowTotal,
      predictedCount: colTotal,
      recallPercentage: Number(recall.toFixed(2)),
      precisionPercentage: Number(precision.toFixed(2)),
    });
  }

  return metrics;
}
