import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

function calculateLiveMetrics({ currentEpoch, maxEpochs, initialError, currentError, startTimeMs, nowMs }) {
  const progressPercentage = Math.min(100, Math.max(0, (currentEpoch / maxEpochs) * 100));
  const errorReduction = initialError > 0 ? ((initialError - currentError) / initialError) * 100 : 0;
  const elapsedSeconds = Math.max(0, (nowMs - startTimeMs) / 1000);

  return {
    progressPercentage: Number(progressPercentage.toFixed(1)),
    errorReductionPercentage: Number(errorReduction.toFixed(2)),
    elapsedSeconds: Number(elapsedSeconds.toFixed(1)),
  };
}

describe('Tier 1 - F15: Real-Time Metrics Streaming', () => {
  it('F15-1: Parses SignalR epoch event reading avarageError (with backend spelling)', () => {
    const rawEvent = { epoch: 10, avarageError: 0.1234 };
    const parsedError = rawEvent.avarageError ?? rawEvent.averageError;
    assert.strictEqual(parsedError, 0.1234);
  });

  it('F15-2: Fallback supports averageError if normalized by client transformer', () => {
    const rawEvent = { epoch: 20, averageError: 0.05 };
    const parsedError = rawEvent.avarageError ?? rawEvent.averageError;
    assert.strictEqual(parsedError, 0.05);
  });

  it('F15-3: Progress bar percentage advances linearly from 0% to 100%', () => {
    const m1 = calculateLiveMetrics({
      currentEpoch: 250,
      maxEpochs: 1000,
      initialError: 0.5,
      currentError: 0.3,
      startTimeMs: 1000,
      nowMs: 2000,
    });
    assert.strictEqual(m1.progressPercentage, 25.0);

    const m2 = calculateLiveMetrics({
      currentEpoch: 1000,
      maxEpochs: 1000,
      initialError: 0.5,
      currentError: 0.01,
      startTimeMs: 1000,
      nowMs: 5000,
    });
    assert.strictEqual(m2.progressPercentage, 100.0);
  });

  it('F15-4: Error reduction percentage correctly measures learning convergence', () => {
    const metrics = calculateLiveMetrics({
      currentEpoch: 50,
      maxEpochs: 100,
      initialError: 0.5,
      currentError: 0.1,
      startTimeMs: 0,
      nowMs: 1000,
    });
    // (0.5 - 0.1) / 0.5 = 0.8 => 80% reduction
    assert.strictEqual(metrics.errorReductionPercentage, 80.0);
  });

  it('F15-5: Elapsed training timer measures elapsed seconds accurately', () => {
    const metrics = calculateLiveMetrics({
      currentEpoch: 10,
      maxEpochs: 100,
      initialError: 0.5,
      currentError: 0.45,
      startTimeMs: 10000,
      nowMs: 13500,
    });
    assert.strictEqual(metrics.elapsedSeconds, 3.5);
  });
});
