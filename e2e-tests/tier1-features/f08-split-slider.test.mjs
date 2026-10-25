import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

function partitionDataset(rows, trainingRate) {
  if (!rows || rows.length === 0) return { train: [], test: [] };
  const rate = Math.max(0.1, Math.min(1.0, trainingRate));
  const trainCount = Math.round(rows.length * rate);
  const train = rows.slice(0, trainCount);
  const test = rows.slice(trainCount);
  return { train, test };
}

describe('Tier 1 - F8: Train/Test Split Slider', () => {
  it('F8-1: 70/30 split partitions 100 rows into exactly 70 train and 30 test rows', () => {
    const data = Array.from({ length: 100 }, (_, i) => ({ id: i }));
    const { train, test } = partitionDataset(data, 0.7);
    assert.strictEqual(train.length, 70);
    assert.strictEqual(test.length, 30);
  });

  it('F8-2: Partitions have zero overlap (no data leakage)', () => {
    const data = Array.from({ length: 50 }, (_, i) => ({ id: i }));
    const { train, test } = partitionDataset(data, 0.6);
    const trainIds = new Set(train.map((r) => r.id));
    for (const row of test) {
      assert.ok(!trainIds.has(row.id), `Row ${row.id} found in both train and test partitions`);
    }
  });

  it('F8-3: Split ratio 1.0 routes 100% data to training', () => {
    const data = Array.from({ length: 40 }, (_, i) => ({ id: i }));
    const { train, test } = partitionDataset(data, 1.0);
    assert.strictEqual(train.length, 40);
    assert.strictEqual(test.length, 0);
  });

  it('F8-4: Split ratio lower bound clamps to 0.1 (minimum 10% training data)', () => {
    const data = Array.from({ length: 100 }, (_, i) => ({ id: i }));
    const { train } = partitionDataset(data, 0.01);
    assert.strictEqual(train.length, 10);
  });

  it('F8-5: Sum of train and test partition counts equals total dataset rows', () => {
    const data = Array.from({ length: 150 }, (_, i) => ({ id: i }));
    const { train, test } = partitionDataset(data, 0.75);
    assert.strictEqual(train.length + test.length, 150);
  });
});
