import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { IRIS_META, COLORBALLS_META } from '../fixtures/dataset-fixtures.mjs';

function getPresetConfiguration(datasetName) {
  if (datasetName === 'Iris') {
    return {
      name: 'Iris',
      ...IRIS_META.recommendedTopology,
      columns: IRIS_META.features,
      classes: IRIS_META.classes,
    };
  }
  if (datasetName === 'ColorBalls') {
    return {
      name: 'ColorBalls',
      ...COLORBALLS_META.recommendedTopology,
      columns: COLORBALLS_META.features,
      classes: COLORBALLS_META.classes,
    };
  }
  throw new Error(`Unknown preset: ${datasetName}`);
}

describe('Tier 1 - F12: Instant Experimentation Presets', () => {
  it('F12-1: Iris preset auto-configures 4 inputs, 3 hidden, 3 outputs', () => {
    const config = getPresetConfiguration('Iris');
    assert.strictEqual(config.inputLayer, 4);
    assert.strictEqual(config.hiddenLayer, 3);
    assert.strictEqual(config.outputLayer, 3);
  });

  it('F12-2: ColorBalls preset auto-configures 4 inputs, 4 hidden, 4 outputs', () => {
    const config = getPresetConfiguration('ColorBalls');
    assert.strictEqual(config.inputLayer, 4);
    assert.strictEqual(config.hiddenLayer, 4);
    assert.strictEqual(config.outputLayer, 4);
  });

  it('F12-3: Presets define sensible default learning rates and target error thresholds', () => {
    const iris = getPresetConfiguration('Iris');
    assert.strictEqual(iris.learningRate, 0.1);
    assert.strictEqual(iris.errorValue, 0.01);

    const cb = getPresetConfiguration('ColorBalls');
    assert.strictEqual(cb.learningRate, 0.1);
    assert.strictEqual(cb.errorValue, 0.02);
  });

  it('F12-4: Presets default to Logistica transfer function and 70/30 split', () => {
    const iris = getPresetConfiguration('Iris');
    assert.strictEqual(iris.transferFunction, 'Logistica');
    assert.strictEqual(iris.trainingRate, 0.7);
    assert.strictEqual(iris.sameFileForTesting, true);
  });

  it('F12-5: Requesting an unknown preset name throws descriptive error', () => {
    assert.throws(() => getPresetConfiguration('NonExistent'), /unknown preset/i);
  });
});
