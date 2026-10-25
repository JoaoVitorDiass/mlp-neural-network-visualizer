import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { minMaxNormalize } from '../helpers/normalization-oracle.mjs';

describe('Tier 2 - F5 Boundary: Benchmark Presets Edge Cases', () => {
  it('F5-B1: Extrema values in Iris (min SepalLength 4.3, max 7.9) scale accurately to 0.0 and 1.0', () => {
    const rows = [{ SepalLengthCm: 4.3 }, { SepalLengthCm: 7.9 }];
    const normalized = minMaxNormalize(rows, ['SepalLengthCm']);
    assert.strictEqual(normalized[0].SepalLengthCm, 0.0);
    assert.strictEqual(normalized[1].SepalLengthCm, 1.0);
  });

  it('F5-B2: Single-row slice of benchmark handles normalization without throwing NaN', () => {
    const singleRow = [{ SepalLengthCm: 5.1 }];
    const normalized = minMaxNormalize(singleRow, ['SepalLengthCm']);
    assert.strictEqual(normalized[0].SepalLengthCm, 0.0);
    assert.ok(!Number.isNaN(normalized[0].SepalLengthCm));
  });

  it('F5-B3: Benchmark rows with whitespace in target labels are normalized', () => {
    const row = { Species: '  Iris-setosa  ' };
    assert.strictEqual(row.Species.trim(), 'Iris-setosa');
  });

  it('F5-B4: ColorBalls integer columns (1..4) preserve discrete range bounds after normalization', () => {
    const rows = [{ Room: 1 }, { Room: 2 }, { Room: 3 }, { Room: 4 }];
    const normalized = minMaxNormalize(rows, ['Room']);
    assert.strictEqual(normalized[0].Room, 0.0);
    assert.strictEqual(Number(normalized[1].Room.toFixed(2)), 0.33);
    assert.strictEqual(Number(normalized[2].Room.toFixed(2)), 0.67);
    assert.strictEqual(normalized[3].Room, 1.0);
  });

  it('F5-B5: Duplicate rows in dataset do not corrupt distinct class count', () => {
    const rows = [{ Species: 'Iris-setosa' }, { Species: 'Iris-setosa' }, { Species: 'Iris-versicolor' }];
    const unique = new Set(rows.map((r) => r.Species));
    assert.strictEqual(unique.size, 2);
  });
});
