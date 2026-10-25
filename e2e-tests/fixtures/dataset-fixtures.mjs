/**
 * Dataset Fixtures & Reference Benchmark Constants
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Standard Iris sample excerpt (canonical benchmark)
export const IRIS_META = {
  name: 'Iris',
  totalRows: 150,
  featureCount: 4,
  features: ['SepalLengthCm', 'SepalWidthCm', 'PetalLengthCm', 'PetalWidthCm'],
  targetColumn: 'Species',
  classes: ['Iris-setosa', 'Iris-versicolor', 'Iris-virginica'],
  recommendedTopology: {
    inputLayer: 4,
    hiddenLayer: 3,
    outputLayer: 3,
    firstClassColumn: 4,
    learningRate: 0.1,
    errorValue: 0.01,
    epochs: 1000,
    transferFunction: 'Logistica',
    trainingRate: 0.7,
    sameFileForTesting: true,
  },
};

// Standard ColorBalls sample excerpt (canonical benchmark)
export const COLORBALLS_META = {
  name: 'ColorBalls',
  totalRows: 400,
  featureCount: 4,
  features: ['Room', 'Partitions', 'Rows', 'Columns'],
  targetColumn: 'Color',
  classes: ['Blue', 'Green', 'Red', 'Yellow'],
  recommendedTopology: {
    inputLayer: 4,
    hiddenLayer: 4,
    outputLayer: 4,
    firstClassColumn: 4,
    learningRate: 0.1,
    errorValue: 0.02,
    epochs: 1500,
    transferFunction: 'Logistica',
    trainingRate: 0.7,
    sameFileForTesting: true,
  },
};

export function loadCsvRows(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];
  const headers = lines[0].split(',').map((h) => h.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',').map((p) => p.trim());
    if (parts.length === headers.length) {
      const row = {};
      headers.forEach((h, idx) => {
        const num = Number(parts[idx]);
        row[h] = Number.isNaN(num) ? parts[idx] : num;
      });
      rows.push(row);
    }
  }
  return rows;
}
