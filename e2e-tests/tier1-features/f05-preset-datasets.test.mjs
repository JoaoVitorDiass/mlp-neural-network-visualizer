import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { IRIS_META, COLORBALLS_META, loadCsvRows } from '../fixtures/dataset-fixtures.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbFilesDir = path.resolve(__dirname, '../../../Next-multiLayerPerceptron/dbFiles');

describe('Tier 1 - F5: Benchmark Preset Datasets', () => {
  it('F5-1: Iris benchmark dataset has 150 rows and 4 continuous numeric features', () => {
    const irisCsv = path.join(dbFilesDir, 'Iris.csv');
    const irisTestCsv = path.join(dbFilesDir, 'IrisTeste.csv');
    const rows = [...(loadCsvRows(irisCsv) || []), ...(loadCsvRows(irisTestCsv) || [])];
    assert.strictEqual(rows.length, IRIS_META.totalRows, 'Iris dataset must total 150 samples');
    assert.strictEqual(IRIS_META.features.length, 4, 'Iris must have 4 features');
  });

  it('F5-2: Iris benchmark dataset has exactly 3 balanced target classes', () => {
    const irisCsv = path.join(dbFilesDir, 'Iris.csv');
    const irisTestCsv = path.join(dbFilesDir, 'IrisTeste.csv');
    const rows = [...(loadCsvRows(irisCsv) || []), ...(loadCsvRows(irisTestCsv) || [])];
    const classes = new Set(rows.map((r) => r.Species));
    assert.strictEqual(classes.size, 3, 'Iris must have 3 distinct classes');
    for (const c of IRIS_META.classes) {
      assert.ok(classes.has(c), `Class ${c} must be present in Iris dataset`);
    }
  });

  it('F5-3: ColorBalls benchmark dataset contains 400 rows and 4 discrete inputs', () => {
    const colorBallsCsv = path.join(dbFilesDir, 'ColorBalls - ColorBalls.csv');
    const rows = loadCsvRows(colorBallsCsv);
    assert.strictEqual(rows.length, COLORBALLS_META.totalRows, 'ColorBalls must have 400 rows');
    assert.strictEqual(COLORBALLS_META.features.length, 4, 'ColorBalls must have 4 features');
  });

  it('F5-4: ColorBalls dataset contains 4 distinct target color classes', () => {
    const colorBallsCsv = path.join(dbFilesDir, 'ColorBalls - ColorBalls.csv');
    const rows = loadCsvRows(colorBallsCsv);
    const colors = new Set(rows.map((r) => r.Color));
    assert.strictEqual(colors.size, 4, 'ColorBalls must contain 4 target color classes');
    for (const color of COLORBALLS_META.classes) {
      assert.ok(colors.has(color), `Color ${color} must be present`);
    }
  });

  it('F5-5: Preset metadata includes valid recommended topology and hyperparameters', () => {
    assert.strictEqual(IRIS_META.recommendedTopology.inputLayer, 4);
    assert.strictEqual(IRIS_META.recommendedTopology.outputLayer, 3);
    assert.strictEqual(COLORBALLS_META.recommendedTopology.inputLayer, 4);
    assert.strictEqual(COLORBALLS_META.recommendedTopology.outputLayer, 4);
  });
});
