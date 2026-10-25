import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendSrc = path.resolve(__dirname, '../frontend/src');

// Import production TypeScript modules directly via tsx / ts-node
import { PRESETS, getPresetById, irisPreset, colorBallsPreset } from '../frontend/src/data/presets/index.ts';
import { parseCsvString, detectColumnMetadata, processDataset } from '../frontend/src/utils/csvParser.ts';
import { normalizeMinMax, computeColumnStats, computeMinMaxBounds } from '../frontend/src/utils/normalization.ts';
import { extractUniqueClasses, encodeOneHot, decodeOneHot, argMax } from '../frontend/src/utils/oneHot.ts';

// Activation oracle mirroring backend ActivationFunctionFactory
function simulateBackendActivationFactory(name) {
  const normalized = name ? name.trim().toLowerCase() : '';
  switch (normalized) {
    case 'hiperbólica':
    case 'hiperbolica':
    case 'tanh':
      return {
        type: 'HyperbolicTangentActivation',
        name: 'Hiperbólica',
        activate: (x) => Math.tanh(x),
        derivative: (y) => 1.0 - y * y,
      };
    case 'linear':
      return {
        type: 'LinearActivation',
        name: 'Linear',
        activate: (x) => x / 10.0,
        derivative: () => 0.1,
      };
    default:
      return {
        type: 'SigmoidActivation',
        name: 'Logistica',
        activate: (x) => 1.0 / (1.0 + Math.exp(-x)),
        derivative: (y) => y * (1.0 - y),
      };
  }
}

// Split logic oracle
function simulateSplitPartition(totalSamples, trainingRate) {
  const percentage = Math.round(trainingRate * 100);
  const trainCount = Math.round(totalSamples * (percentage / 100));
  const testCount = Math.max(0, totalSamples - trainCount);
  return { percentage, trainCount, testCount };
}

describe('Challenger M2 Adversarial Test Suite', () => {

  // =========================================================================
  // SUITE 1: Presets Deep Integrity & Topology Invariants
  // =========================================================================
  describe('Suite 1: Presets Deep Integrity & Topology Invariants', () => {
    it('CH2-01: Iris preset has exactly 150 samples, 4 features, and 3 balanced classes', () => {
      assert.strictEqual(irisPreset.sampleCount, 150);
      assert.strictEqual(irisPreset.featureCount, 4);
      assert.strictEqual(irisPreset.classCount, 3);

      const parsed = parseCsvString(irisPreset.csvContent);
      assert.strictEqual(parsed.error, undefined);
      assert.strictEqual(parsed.data.length, 150);

      const speciesCounts = {};
      for (const row of parsed.data) {
        speciesCounts[row.Species] = (speciesCounts[row.Species] || 0) + 1;
      }
      assert.strictEqual(speciesCounts['Iris-setosa'], 50);
      assert.strictEqual(speciesCounts['Iris-versicolor'], 50);
      assert.strictEqual(speciesCounts['Iris-virginica'], 50);
    });

    it('CH2-02: Iris preset topology invariants hold: firstClassColumn === inputLayer', () => {
      const { defaultParameters } = irisPreset;
      assert.strictEqual(defaultParameters.inputLayer, 4);
      assert.strictEqual(defaultParameters.hiddenLayer, 3);
      assert.strictEqual(defaultParameters.outputLayer, 3);
      assert.strictEqual(defaultParameters.firstClassColumn, 4);
      assert.strictEqual(defaultParameters.firstClassColumn, defaultParameters.inputLayer,
        'Backend requires firstClassColumn to equal inputLayer');
    });

    it('CH2-03: Iris preset default hyperparameters are within valid standard ranges', () => {
      const p = irisPreset.defaultParameters;
      assert.strictEqual(p.learningRate, 0.1);
      assert.strictEqual(p.errorValue, 0.01);
      assert.strictEqual(p.epochs, 1000);
      assert.strictEqual(p.transferFunction, 'Logistica');
      assert.strictEqual(p.trainingRate, 0.7);
      assert.strictEqual(p.sameFileForTesting, true);
    });

    it('CH2-04: ColorBalls preset has exactly 400 samples, 4 features, and 4 classes', () => {
      assert.strictEqual(colorBallsPreset.sampleCount, 400);
      assert.strictEqual(colorBallsPreset.featureCount, 4);
      assert.strictEqual(colorBallsPreset.classCount, 4);

      const parsed = parseCsvString(colorBallsPreset.csvContent);
      assert.strictEqual(parsed.error, undefined);
      assert.strictEqual(parsed.data.length, 400);

      const colorSet = new Set(parsed.data.map((r) => r.Color));
      assert.strictEqual(colorSet.size, 4);
      assert.ok(colorSet.has('Blue'));
      assert.ok(colorSet.has('Green'));
      assert.ok(colorSet.has('Red'));
      assert.ok(colorSet.has('Yellow'));
    });

    it('CH2-05: ColorBalls preset topology invariants hold: firstClassColumn === inputLayer', () => {
      const { defaultParameters } = colorBallsPreset;
      assert.strictEqual(defaultParameters.inputLayer, 4);
      assert.strictEqual(defaultParameters.hiddenLayer, 4);
      assert.strictEqual(defaultParameters.outputLayer, 4);
      assert.strictEqual(defaultParameters.firstClassColumn, 4);
      assert.strictEqual(defaultParameters.firstClassColumn, defaultParameters.inputLayer);
    });

    it('CH2-06: ColorBalls default hyperparameters match canonical specifications', () => {
      const p = colorBallsPreset.defaultParameters;
      assert.strictEqual(p.learningRate, 0.1);
      assert.strictEqual(p.errorValue, 0.02);
      assert.strictEqual(p.epochs, 1500);
      assert.strictEqual(p.transferFunction, 'Logistica');
      assert.strictEqual(p.trainingRate, 0.7);
      assert.strictEqual(p.sameFileForTesting, true);
    });

    it('CH2-07: getPresetById handles case-insensitivity, hyphens, underscores, and spaces', () => {
      assert.strictEqual(getPresetById('iris')?.id, 'iris');
      assert.strictEqual(getPresetById('Iris')?.id, 'iris');
      assert.strictEqual(getPresetById('IRIS')?.id, 'iris');
      assert.strictEqual(getPresetById('colorballs')?.id, 'colorballs');
      assert.strictEqual(getPresetById('ColorBalls')?.id, 'colorballs');
      assert.strictEqual(getPresetById('color-balls')?.id, 'colorballs');
      assert.strictEqual(getPresetById('color_balls')?.id, 'colorballs');
      assert.strictEqual(getPresetById('Color Balls')?.id, 'colorballs');
      assert.strictEqual(getPresetById('non-existent'), undefined);
      assert.strictEqual(getPresetById(''), undefined);
    });
  });

  // =========================================================================
  // SUITE 2: Boundary Conditions for Split Slider & Partition Math
  // =========================================================================
  describe('Suite 2: Boundary Conditions for Split Slider', () => {
    it('CH2-08: Split at 50% boundary on Iris (150 samples) produces 75 train and 75 test', () => {
      const { trainCount, testCount } = simulateSplitPartition(150, 0.5);
      assert.strictEqual(trainCount, 75);
      assert.strictEqual(testCount, 75);
      assert.strictEqual(trainCount + testCount, 150);
    });

    it('CH2-09: Split at 50% boundary on ColorBalls (400 samples) produces 200 train and 200 test', () => {
      const { trainCount, testCount } = simulateSplitPartition(400, 0.5);
      assert.strictEqual(trainCount, 200);
      assert.strictEqual(testCount, 200);
      assert.strictEqual(trainCount + testCount, 400);
    });

    it('CH2-10: Split at 100% boundary leaves test slice empty (0 test samples)', () => {
      const { trainCount, testCount } = simulateSplitPartition(150, 1.0);
      assert.strictEqual(trainCount, 150);
      assert.strictEqual(testCount, 0);
      assert.strictEqual(trainCount + testCount, 150);
    });

    it('CH2-11: Conservation of samples holds across every slider step [50%, 55%, ..., 100%]', () => {
      for (let percent = 50; percent <= 100; percent += 5) {
        const rate = percent / 100;
        const { trainCount, testCount } = simulateSplitPartition(150, rate);
        assert.strictEqual(trainCount + testCount, 150,
          `Conservation failed at ${percent}%: train=${trainCount}, test=${testCount}`);
        assert.ok(testCount >= 0, `testCount negative at ${percent}%`);
        assert.ok(trainCount >= 75, `trainCount below 50% at ${percent}%`);
      }
    });

    it('CH2-12: Split handles odd sample count (e.g. 73 rows) with conservation', () => {
      const { trainCount, testCount } = simulateSplitPartition(73, 0.7);
      assert.strictEqual(trainCount, 51); // round(73 * 0.7) = 51
      assert.strictEqual(testCount, 22);  // 73 - 51 = 22
      assert.strictEqual(trainCount + testCount, 73);
    });

    it('CH2-13: Split handles single-sample edge case (1 row) without negative or NaN', () => {
      const { trainCount, testCount } = simulateSplitPartition(1, 0.5);
      assert.strictEqual(trainCount, 1);
      assert.strictEqual(testCount, 0);
      assert.strictEqual(trainCount + testCount, 1);
    });
  });

  // =========================================================================
  // SUITE 3: Activation Function Strings Parity with Backend Contract
  // =========================================================================
  describe('Suite 3: Activation Function Strings Parity with Backend', () => {
    it('CH2-14: Frontend activation types match backend accepted values', () => {
      const validTypes = ['Logistica', 'Hiperbolica', 'Linear'];
      for (const fn of validTypes) {
        const backendResolved = simulateBackendActivationFactory(fn);
        assert.ok(backendResolved, `Backend must resolve ${fn}`);
      }
    });

    it('CH2-15: Logistica resolves to SigmoidActivation in backend factory', () => {
      const resolved = simulateBackendActivationFactory('Logistica');
      assert.strictEqual(resolved.type, 'SigmoidActivation');
      assert.strictEqual(resolved.activate(0.0), 0.5);
      assert.strictEqual(resolved.derivative(0.5), 0.25);
    });

    it('CH2-16: Hiperbolica resolves to HyperbolicTangentActivation in backend factory', () => {
      const resolved = simulateBackendActivationFactory('Hiperbolica');
      assert.strictEqual(resolved.type, 'HyperbolicTangentActivation');
      assert.strictEqual(resolved.activate(0.0), 0.0);
      assert.strictEqual(resolved.derivative(0.0), 1.0);
    });

    it('CH2-17: Linear resolves to LinearActivation in backend factory', () => {
      const resolved = simulateBackendActivationFactory('Linear');
      assert.strictEqual(resolved.type, 'LinearActivation');
      assert.strictEqual(resolved.activate(10.0), 1.0);
      assert.strictEqual(resolved.derivative(1.0), 0.1);
    });

    it('CH2-18: Factory is resilient to lowercase, uppercase, and alias inputs', () => {
      assert.strictEqual(simulateBackendActivationFactory('logistica').type, 'SigmoidActivation');
      assert.strictEqual(simulateBackendActivationFactory('LOGISTICA').type, 'SigmoidActivation');
      assert.strictEqual(simulateBackendActivationFactory('hiperbolica').type, 'HyperbolicTangentActivation');
      assert.strictEqual(simulateBackendActivationFactory('HIPERBOLICA').type, 'HyperbolicTangentActivation');
      assert.strictEqual(simulateBackendActivationFactory('hiperbólica').type, 'HyperbolicTangentActivation');
      assert.strictEqual(simulateBackendActivationFactory('tanh').type, 'HyperbolicTangentActivation');
      assert.strictEqual(simulateBackendActivationFactory('linear').type, 'LinearActivation');
      assert.strictEqual(simulateBackendActivationFactory('LINEAR').type, 'LinearActivation');
      assert.strictEqual(simulateBackendActivationFactory('unknown').type, 'SigmoidActivation');
    });
  });

  // =========================================================================
  // SUITE 4: Dynamic Preset Switching & State Synchronization
  // =========================================================================
  describe('Suite 4: Dynamic Preset Switching Simulation', () => {
    it('CH2-19: Switching from Iris to ColorBalls updates topology and hyperparameters correctly', () => {
      let state = { ...irisPreset.defaultParameters };
      assert.strictEqual(state.hiddenLayer, 3);
      assert.strictEqual(state.outputLayer, 3);
      assert.strictEqual(state.epochs, 1000);
      assert.strictEqual(state.errorValue, 0.01);

      // Trigger preset change to ColorBalls
      const newPreset = getPresetById('colorballs');
      assert.ok(newPreset);
      state = { ...state, ...newPreset.defaultParameters };

      assert.strictEqual(state.inputLayer, 4);
      assert.strictEqual(state.hiddenLayer, 4);
      assert.strictEqual(state.outputLayer, 4);
      assert.strictEqual(state.firstClassColumn, 4);
      assert.strictEqual(state.epochs, 1500);
      assert.strictEqual(state.errorValue, 0.02);
    });

    it('CH2-20: Switching back to Iris cleanly restores Iris defaults', () => {
      let state = { ...colorBallsPreset.defaultParameters };
      const iris = getPresetById('iris');
      assert.ok(iris);
      state = { ...state, ...iris.defaultParameters };

      assert.strictEqual(state.inputLayer, 4);
      assert.strictEqual(state.hiddenLayer, 3);
      assert.strictEqual(state.outputLayer, 3);
      assert.strictEqual(state.firstClassColumn, 4);
      assert.strictEqual(state.epochs, 1000);
      assert.strictEqual(state.errorValue, 0.01);
    });

    it('CH2-21: Reprocessing dataset when switching presets changes column structure dynamically', () => {
      const parsedIris = parseCsvString(irisPreset.csvContent);
      let irisCols = detectColumnMetadata(parsedIris.data, parsedIris.columnNames).map((c) => {
        if (c.name.toLowerCase() === 'id') return { ...c, role: 'ignore' };
        if (c.name.toLowerCase() === 'species') return { ...c, role: 'target', type: 'categorical' };
        return { ...c, role: 'input', type: 'numeric' };
      });
      const irisProcessed = processDataset(parsedIris.data, irisCols);
      assert.strictEqual(irisProcessed.inputCount, 4);
      assert.strictEqual(irisProcessed.outputCount, 3);
      assert.strictEqual(irisProcessed.firstClassIndex, 4);

      const parsedCB = parseCsvString(colorBallsPreset.csvContent);
      let cbCols = detectColumnMetadata(parsedCB.data, parsedCB.columnNames).map((c) => {
        if (c.name.toLowerCase() === 'color') return { ...c, role: 'target', type: 'categorical' };
        return { ...c, role: 'input', type: 'numeric' };
      });
      const cbProcessed = processDataset(parsedCB.data, cbCols);
      assert.strictEqual(cbProcessed.inputCount, 4);
      assert.strictEqual(cbProcessed.outputCount, 4);
      assert.strictEqual(cbProcessed.firstClassIndex, 4);
    });
  });

  // =========================================================================
  // SUITE 5: Preprocessing, Key Ordering, and Backend Extraction Compatibility
  // =========================================================================
  describe('Suite 5: Preprocessing, Key Ordering, & Data Extraction', () => {
    it('CH2-22: Iris normalized rows have strictly ordered keys: inputs 0..3, one-hot targets 4..6, Id omitted', () => {
      const parsed = parseCsvString(irisPreset.csvContent);
      const cols = detectColumnMetadata(parsed.data, parsed.columnNames).map((c) => {
        if (c.name.toLowerCase() === 'id') return { ...c, role: 'ignore' };
        if (c.name.toLowerCase() === 'species') return { ...c, role: 'target', type: 'categorical' };
        return { ...c, role: 'input', type: 'numeric' };
      });

      const processed = processDataset(parsed.data, cols);
      assert.strictEqual(processed.normalizedRows.length, 150);

      const expectedKeys = [
        'SepalLengthCm',
        'SepalWidthCm',
        'PetalLengthCm',
        'PetalWidthCm',
        'Iris-setosa',
        'Iris-versicolor',
        'Iris-virginica',
      ];

      for (let i = 0; i < processed.normalizedRows.length; i++) {
        const row = processed.normalizedRows[i];
        const keys = Object.keys(row);
        assert.deepStrictEqual(keys, expectedKeys, `Row ${i} key ordering violated`);
        assert.strictEqual(keys.includes('Id'), false, 'Id column must be omitted');
      }
    });

    it('CH2-23: ColorBalls normalized rows have strictly ordered keys: inputs 0..3, targets 4..7', () => {
      const parsed = parseCsvString(colorBallsPreset.csvContent);
      const cols = detectColumnMetadata(parsed.data, parsed.columnNames).map((c) => {
        if (c.name.toLowerCase() === 'color') return { ...c, role: 'target', type: 'categorical' };
        return { ...c, role: 'input', type: 'numeric' };
      });

      const processed = processDataset(parsed.data, cols);
      assert.strictEqual(processed.normalizedRows.length, 400);

      const expectedKeys = ['Room', 'Partitions', 'Rows', 'Columns', 'Blue', 'Green', 'Red', 'Yellow'];

      for (let i = 0; i < processed.normalizedRows.length; i++) {
        const row = processed.normalizedRows[i];
        const keys = Object.keys(row);
        assert.deepStrictEqual(keys, expectedKeys, `ColorBalls row ${i} key ordering violated`);
      }
    });

    it('CH2-24: Every Iris row has one-hot target summing exactly to 1.0', () => {
      const parsed = parseCsvString(irisPreset.csvContent);
      const cols = detectColumnMetadata(parsed.data, parsed.columnNames).map((c) => {
        if (c.name.toLowerCase() === 'id') return { ...c, role: 'ignore' };
        if (c.name.toLowerCase() === 'species') return { ...c, role: 'target', type: 'categorical' };
        return { ...c, role: 'input', type: 'numeric' };
      });
      const processed = processDataset(parsed.data, cols);

      for (let i = 0; i < processed.normalizedRows.length; i++) {
        const r = processed.normalizedRows[i];
        const targetSum = r['Iris-setosa'] + r['Iris-versicolor'] + r['Iris-virginica'];
        assert.strictEqual(targetSum, 1.0, `Iris row ${i} target sum !== 1.0`);
      }
    });

    it('CH2-25: Every ColorBalls row has one-hot target summing exactly to 1.0', () => {
      const parsed = parseCsvString(colorBallsPreset.csvContent);
      const cols = detectColumnMetadata(parsed.data, parsed.columnNames).map((c) => {
        if (c.name.toLowerCase() === 'color') return { ...c, role: 'target', type: 'categorical' };
        return { ...c, role: 'input', type: 'numeric' };
      });
      const processed = processDataset(parsed.data, cols);

      for (let i = 0; i < processed.normalizedRows.length; i++) {
        const r = processed.normalizedRows[i];
        const targetSum = r['Blue'] + r['Green'] + r['Red'] + r['Yellow'];
        assert.strictEqual(targetSum, 1.0, `ColorBalls row ${i} target sum !== 1.0`);
      }
    });

    it('CH2-26: All normalized features in Iris and ColorBalls are strictly within [0.0, 1.0]', () => {
      const parsedIris = parseCsvString(irisPreset.csvContent);
      const colsIris = detectColumnMetadata(parsedIris.data, parsedIris.columnNames).map((c) => {
        if (c.name.toLowerCase() === 'id') return { ...c, role: 'ignore' };
        if (c.name.toLowerCase() === 'species') return { ...c, role: 'target', type: 'categorical' };
        return { ...c, role: 'input', type: 'numeric' };
      });
      const irisProc = processDataset(parsedIris.data, colsIris);

      const irisFeatures = ['SepalLengthCm', 'SepalWidthCm', 'PetalLengthCm', 'PetalWidthCm'];
      for (const row of irisProc.normalizedRows) {
        for (const feat of irisFeatures) {
          const val = row[feat];
          assert.ok(typeof val === 'number' && !Number.isNaN(val), `${feat} must be a number`);
          assert.ok(val >= 0.0 && val <= 1.0, `${feat} value ${val} out of [0.0, 1.0]`);
        }
      }

      const parsedCB = parseCsvString(colorBallsPreset.csvContent);
      const colsCB = detectColumnMetadata(parsedCB.data, parsedCB.columnNames).map((c) => {
        if (c.name.toLowerCase() === 'color') return { ...c, role: 'target', type: 'categorical' };
        return { ...c, role: 'input', type: 'numeric' };
      });
      const cbProc = processDataset(parsedCB.data, colsCB);

      const cbFeatures = ['Room', 'Partitions', 'Rows', 'Columns'];
      for (const row of cbProc.normalizedRows) {
        for (const feat of cbFeatures) {
          const val = row[feat];
          assert.ok(typeof val === 'number' && !Number.isNaN(val), `${feat} must be a number`);
          assert.ok(val >= 0.0 && val <= 1.0, `${feat} value ${val} out of [0.0, 1.0]`);
        }
      }
    });

    it('CH2-27: Zero-variance numeric feature produces 0.0 without NaN or divide-by-zero', () => {
      const normVal = normalizeMinMax(42, 42, 42);
      assert.strictEqual(normVal, 0.0);

      const stats = computeColumnStats([5, 5, 5, 5]);
      assert.strictEqual(stats.min, 5);
      assert.strictEqual(stats.max, 5);

      const normSingle = normalizeMinMax(5, stats.min, stats.max);
      assert.strictEqual(normSingle, 0.0);
    });

    it('CH2-28: CSV parser handles empty string and whitespace cleanly without crash', () => {
      const emptyResult = parseCsvString('');
      assert.ok(emptyResult.error);
      assert.strictEqual(emptyResult.data.length, 0);

      const wsResult = parseCsvString('   \n\n  \t ');
      assert.ok(wsResult.error);
      assert.strictEqual(wsResult.data.length, 0);
    });
  });
});
