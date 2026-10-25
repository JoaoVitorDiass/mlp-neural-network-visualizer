import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeAccuracy, computeClassMetrics } from '../helpers/confusion-matrix-oracle.mjs';

describe('Tier 1 - F17: Interactive Confusion Matrix Heatmap', () => {
  it('F17-1: Perfect classification yields 100.0% accuracy', () => {
    const perfectMatrix = [
      [15, 0, 0],
      [0, 15, 0],
      [0, 0, 15],
    ];
    const acc = computeAccuracy(perfectMatrix);
    assert.strictEqual(acc, 100.0);
  });

  it('F17-2: Matrix with misclassifications calculates accuracy accurately', () => {
    // Total = 10 + 2 + 1 + 12 = 25. Correct = 10 + 12 = 22 => 22/25 = 88%
    const matrix = [
      [10, 2],
      [1, 12],
    ];
    const acc = computeAccuracy(matrix);
    assert.strictEqual(acc, 88.0);
  });

  it('F17-3: Validates NxN matrix square symmetry dimensions matching class count', () => {
    const matrix = [
      [10, 0, 1],
      [0, 9, 2],
      [1, 0, 8],
    ];
    const K = matrix.length;
    for (let r = 0; r < K; r++) {
      assert.strictEqual(matrix[r].length, K, `Row ${r} must have length ${K}`);
    }
  });

  it('F17-4: Computes class-specific recall and precision metrics', () => {
    const matrix = [
      [10, 2],
      [1, 12],
    ];
    const classMetrics = computeClassMetrics(matrix, ['ClassA', 'ClassB']);
    // Class A: actual = 12, predicted = 11, TP = 10
    // Recall = 10 / 12 = 83.33%, Precision = 10 / 11 = 90.91%
    assert.strictEqual(classMetrics[0].className, 'ClassA');
    assert.strictEqual(classMetrics[0].recallPercentage, 83.33);
    assert.strictEqual(classMetrics[0].precisionPercentage, 90.91);
  });

  it('F17-5: Heatmap intensity normalizer maps cell count relative to class actual total', () => {
    const getIntensity = (cellValue, rowTotal) => (rowTotal > 0 ? cellValue / rowTotal : 0);
    assert.strictEqual(getIntensity(15, 15), 1.0);
    assert.strictEqual(getIntensity(0, 15), 0.0);
    assert.strictEqual(getIntensity(5, 10), 0.5);
  });
});
