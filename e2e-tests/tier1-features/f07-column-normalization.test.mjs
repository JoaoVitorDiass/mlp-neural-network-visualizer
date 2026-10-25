import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { minMaxNormalize, computeMinMaxBounds } from '../helpers/normalization-oracle.mjs';
import { oneHotEncodeRows, getUniqueClasses } from '../helpers/one-hot-oracle.mjs';

describe('Tier 1 - F7: Column Role Detection & Normalization Helper', () => {
  it('F7-1: Min-Max normalizes numeric features strictly to [0.0, 1.0]', () => {
    const rows = [
      { feat: 10 },
      { feat: 20 },
      { feat: 30 },
    ];
    const normalized = minMaxNormalize(rows, ['feat']);
    assert.strictEqual(normalized[0].feat, 0.0);
    assert.strictEqual(normalized[1].feat, 0.5);
    assert.strictEqual(normalized[2].feat, 1.0);
  });

  it('F7-2: Zero variance feature (min === max) produces 0.0 without division by zero', () => {
    const rows = [
      { constFeat: 42 },
      { constFeat: 42 },
    ];
    const normalized = minMaxNormalize(rows, ['constFeat']);
    assert.strictEqual(normalized[0].constFeat, 0.0);
    assert.strictEqual(normalized[1].constFeat, 0.0);
  });

  it('F7-3: One-Hot encodes categorical target classes into binary columns', () => {
    const rows = [
      { label: 'Red' },
      { label: 'Blue' },
      { label: 'Red' },
    ];
    const encoded = oneHotEncodeRows(rows, 'label');
    assert.strictEqual(encoded[0].Red, 1.0);
    assert.strictEqual(encoded[0].Blue, 0.0);
    assert.strictEqual(encoded[1].Red, 0.0);
    assert.strictEqual(encoded[1].Blue, 1.0);
  });

  it('F7-4: Column role selector can ignore ID columns like "Id"', () => {
    const columns = [
      { name: 'Id', role: 'ignore' },
      { name: 'SepalLength', role: 'input' },
      { name: 'Species', role: 'target' },
    ];
    const activeInputs = columns.filter((c) => c.role === 'input').map((c) => c.name);
    assert.ok(!activeInputs.includes('Id'), 'Ignored ID column must not be in active inputs');
    assert.deepStrictEqual(activeInputs, ['SepalLength']);
  });

  it('F7-5: Distinct target class extraction is sorted and deterministic', () => {
    const rows = [{ tag: 'Z' }, { tag: 'A' }, { tag: 'M' }];
    const classes = getUniqueClasses(rows, 'tag');
    assert.deepStrictEqual(classes, ['A', 'M', 'Z']);
  });
});
