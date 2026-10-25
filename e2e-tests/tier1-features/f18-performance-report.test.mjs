import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

function evaluatePerformanceReport(runData, targetError) {
  const { accuracyPercentage, totalEpochs, finalError, converged } = runData;
  const isActuallyConverged = finalError <= targetError;
  const grade =
    accuracyPercentage >= 95
      ? 'Excellent'
      : accuracyPercentage >= 80
      ? 'Good'
      : accuracyPercentage >= 60
      ? 'Moderate'
      : 'Poor';

  return {
    accuracyFormatted: `${accuracyPercentage.toFixed(1)}%`,
    totalEpochs,
    finalError,
    converged: Boolean(converged),
    convergenceVerified: converged === isActuallyConverged,
    grade,
  };
}

describe('Tier 1 - F18: Comprehensive Performance Report', () => {
  it('F18-1: Formats accuracy percentage cleanly with one decimal place', () => {
    const report = evaluatePerformanceReport(
      { accuracyPercentage: 94.6666, totalEpochs: 100, finalError: 0.008, converged: true },
      0.01
    );
    assert.strictEqual(report.accuracyFormatted, '94.7%');
  });

  it('F18-2: Validates convergence status against finalError <= errorValue', () => {
    const convergedReport = evaluatePerformanceReport(
      { accuracyPercentage: 96.0, totalEpochs: 85, finalError: 0.009, converged: true },
      0.01
    );
    assert.strictEqual(convergedReport.converged, true);
    assert.strictEqual(convergedReport.convergenceVerified, true);

    const nonConvergedReport = evaluatePerformanceReport(
      { accuracyPercentage: 70.0, totalEpochs: 1000, finalError: 0.05, converged: false },
      0.01
    );
    assert.strictEqual(nonConvergedReport.converged, false);
    assert.strictEqual(nonConvergedReport.convergenceVerified, true);
  });

  it('F18-3: Reports total epochs executed accurately', () => {
    const report = evaluatePerformanceReport(
      { accuracyPercentage: 90.0, totalEpochs: 432, finalError: 0.0095, converged: true },
      0.01
    );
    assert.strictEqual(report.totalEpochs, 432);
  });

  it('F18-4: Assigns performance grade badge based on overall accuracy tier', () => {
    assert.strictEqual(
      evaluatePerformanceReport({ accuracyPercentage: 98, totalEpochs: 10, finalError: 0.01, converged: true }, 0.01).grade,
      'Excellent'
    );
    assert.strictEqual(
      evaluatePerformanceReport({ accuracyPercentage: 85, totalEpochs: 10, finalError: 0.01, converged: true }, 0.01).grade,
      'Good'
    );
    assert.strictEqual(
      evaluatePerformanceReport({ accuracyPercentage: 65, totalEpochs: 10, finalError: 0.01, converged: true }, 0.01).grade,
      'Moderate'
    );
    assert.strictEqual(
      evaluatePerformanceReport({ accuracyPercentage: 45, totalEpochs: 10, finalError: 0.01, converged: true }, 0.01).grade,
      'Poor'
    );
  });

  it('F18-5: Final error is recorded as a non-negative floating point number', () => {
    const report = evaluatePerformanceReport(
      { accuracyPercentage: 92.0, totalEpochs: 100, finalError: 0.0042, converged: true },
      0.01
    );
    assert.strictEqual(typeof report.finalError, 'number');
    assert.ok(report.finalError >= 0);
  });
});
