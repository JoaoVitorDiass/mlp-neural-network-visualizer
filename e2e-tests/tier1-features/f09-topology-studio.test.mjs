import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

function validateTopology(topology) {
  const errors = [];
  if (!topology) return ['Topology configuration is required'];
  if (!Number.isInteger(topology.inputLayer) || topology.inputLayer < 1) {
    errors.push('inputLayer must be an integer >= 1');
  }
  if (!Number.isInteger(topology.hiddenLayer) || topology.hiddenLayer < 1) {
    errors.push('hiddenLayer must be an integer >= 1');
  }
  if (!Number.isInteger(topology.outputLayer) || topology.outputLayer < 1) {
    errors.push('outputLayer must be an integer >= 1');
  }
  if (topology.firstClassColumn !== topology.inputLayer) {
    errors.push(`firstClassColumn must equal inputLayer (${topology.inputLayer}), got ${topology.firstClassColumn}`);
  }
  return errors;
}

describe('Tier 1 - F9: Network Topology Studio', () => {
  it('F9-1: Valid Iris topology passes validation with 0 errors', () => {
    const irisTopology = {
      inputLayer: 4,
      hiddenLayer: 3,
      outputLayer: 3,
      firstClassColumn: 4,
    };
    const errors = validateTopology(irisTopology);
    assert.deepStrictEqual(errors, []);
  });

  it('F9-2: Valid ColorBalls topology passes validation with 0 errors', () => {
    const colorBallsTopology = {
      inputLayer: 4,
      hiddenLayer: 4,
      outputLayer: 4,
      firstClassColumn: 4,
    };
    const errors = validateTopology(colorBallsTopology);
    assert.deepStrictEqual(errors, []);
  });

  it('F9-3: inputLayer < 1 is rejected with validation error', () => {
    const invalid = { inputLayer: 0, hiddenLayer: 3, outputLayer: 2, firstClassColumn: 0 };
    const errors = validateTopology(invalid);
    assert.ok(errors.some((e) => e.includes('inputLayer')));
  });

  it('F9-4: hiddenLayer < 1 is rejected with validation error', () => {
    const invalid = { inputLayer: 4, hiddenLayer: -1, outputLayer: 2, firstClassColumn: 4 };
    const errors = validateTopology(invalid);
    assert.ok(errors.some((e) => e.includes('hiddenLayer')));
  });

  it('F9-5: firstClassColumn mismatch with inputLayer is detected', () => {
    const invalid = { inputLayer: 4, hiddenLayer: 3, outputLayer: 2, firstClassColumn: 5 };
    const errors = validateTopology(invalid);
    assert.ok(errors.some((e) => e.includes('firstClassColumn')));
  });
});
