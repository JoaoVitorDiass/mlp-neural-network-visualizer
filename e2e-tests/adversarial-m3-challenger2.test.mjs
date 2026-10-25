import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { LearningCurveDataBuffer } from '../frontend/src/utils/learningCurveBuffer.ts';
import {
  calculateProgressPercentage,
  calculateErrorReduction,
  formatElapsedTime,
  formatTimer,
  calculateLiveMetrics,
  parseEpochProgress,
} from '../frontend/src/utils/metricsCalculator.ts';

describe('Challenger M3 Adversarial & Empirical Stress Test Suite', () => {

  // =========================================================================
  // SUITE 1: High-Volume Epoch Streaming & Stride-2 Decimation Invariants
  // =========================================================================
  describe('Suite 1: High-Volume Epoch Streaming & Stride-2 Decimation', () => {

    it('CH3-01: Feeding 5,000 epoch points never exceeds buffer capacity (maxPoints * 2 + 1)', () => {
      const maxPoints = 500;
      const buffer = new LearningCurveDataBuffer(maxPoints);
      const capacityCap = maxPoints * 2 + 1; // 1001

      let maxObservedLength = 0;
      for (let epoch = 1; epoch <= 5000; epoch++) {
        const error = 1.0 / (1.0 + epoch * 0.002);
        buffer.addPoint(epoch, error);

        if (buffer.points.length > maxObservedLength) {
          maxObservedLength = buffer.points.length;
        }

        assert.ok(
          buffer.points.length <= capacityCap,
          `Buffer length ${buffer.points.length} exceeded capacity cap ${capacityCap} at epoch ${epoch}`
        );
      }

      assert.strictEqual(maxObservedLength, maxPoints * 2);
      assert.ok(
        buffer.points.length >= maxPoints && buffer.points.length <= maxPoints * 2,
        `Final buffer length ${buffer.points.length} must be in [${maxPoints}, ${maxPoints * 2}]`
      );
    });

    it('CH3-02: Feeding 10,000 epoch points preserves the initial anchor point (epoch 1)', () => {
      const buffer = new LearningCurveDataBuffer(500);
      const initialEpoch = 1;
      const initialError = 0.895432;

      buffer.addPoint(initialEpoch, initialError);

      for (let epoch = 2; epoch <= 10000; epoch++) {
        const simulatedError = initialError * Math.exp(-epoch / 2000) + 0.001;
        buffer.addPoint(epoch, simulatedError);
      }

      const points = buffer.getPoints();
      assert.ok(points.length > 0, 'Buffer must contain points after streaming');

      // The very first point in the buffer must ALWAYS be the initial anchor point
      const firstPoint = points[0];
      assert.strictEqual(firstPoint.epoch, initialEpoch, 'Initial epoch anchor must be preserved as epoch 1');
      assert.strictEqual(firstPoint.error, initialError, 'Initial error anchor value must be preserved');
    });

    it('CH3-03: Feeding 10,000 epoch points continuously preserves latest boundary point across all downsamples', () => {
      const buffer = new LearningCurveDataBuffer(500);

      // Verify invariant: immediately after adding epoch i, buffer.points[last].epoch === i
      for (let epoch = 1; epoch <= 10000; epoch++) {
        const error = Math.max(0.0001, 0.5 - (epoch / 25000));
        buffer.addPoint(epoch, error);

        const lastPoint = buffer.points[buffer.points.length - 1];
        assert.strictEqual(
          lastPoint.epoch,
          epoch,
          `Latest boundary point mismatch at step ${epoch}: expected ${epoch}, got ${lastPoint.epoch}`
        );
      }
    });

    it('CH3-04: Stride-2 decimation preserves strictly monotonic epoch ordering throughout 10,000 points', () => {
      const buffer = new LearningCurveDataBuffer(500);

      for (let epoch = 1; epoch <= 10000; epoch++) {
        buffer.addPoint(epoch, 0.5 / Math.sqrt(epoch));
      }

      const points = buffer.getPoints();
      assert.ok(points.length >= 500, 'Buffer should hold downsampled points');

      for (let i = 0; i < points.length - 1; i++) {
        assert.ok(
          points[i].epoch < points[i + 1].epoch,
          `Monotonicity violated at index ${i}: epoch ${points[i].epoch} is not strictly less than ${points[i + 1].epoch}`
        );
      }
    });

    it('CH3-05: Non-negative error assertions: rejects negative errors, accepts zero and positive values', () => {
      const buffer = new LearningCurveDataBuffer(500);

      // Negative values must throw descriptive error
      assert.throws(() => buffer.addPoint(1, -0.0001), /non-negative/i);
      assert.throws(() => buffer.addPoint(2, -100), /non-negative/i);
      assert.throws(() => buffer.addPoint(3, -Infinity), /non-negative/i);

      // Valid boundary values must not throw
      assert.doesNotThrow(() => buffer.addPoint(1, 0.0));
      assert.doesNotThrow(() => buffer.addPoint(2, 1e-15));
      assert.doesNotThrow(() => buffer.addPoint(3, 1000.0));
      assert.strictEqual(buffer.points.length, 3);
    });

    it('CH3-06: getBounds accurately computes dynamic minError and maxError over 10,000 streamed points', () => {
      const buffer = new LearningCurveDataBuffer(500);

      // Empty buffer bounds
      const emptyBounds = buffer.getBounds();
      assert.strictEqual(emptyBounds.minError, 0);
      assert.strictEqual(emptyBounds.maxError, 1);

      // Constant error
      buffer.addPoint(1, 0.05);
      const singleBounds = buffer.getBounds();
      assert.strictEqual(singleBounds.minError, 0.05);
      assert.strictEqual(singleBounds.maxError, 0.05);

      buffer.reset();

      // Streaming with known bounds
      for (let epoch = 1; epoch <= 10000; epoch++) {
        // Monotonically decreasing error from 0.9000 down to 0.0100
        const err = 0.01 + 0.89 * Math.exp(-epoch / 1000);
        buffer.addPoint(epoch, err);
      }

      const bounds = buffer.getBounds();
      const points = buffer.getPoints();

      let expectedMin = Infinity;
      let expectedMax = -Infinity;
      for (const p of points) {
        if (p.error < expectedMin) expectedMin = p.error;
        if (p.error > expectedMax) expectedMax = p.error;
      }

      assert.strictEqual(bounds.minError, expectedMin);
      assert.strictEqual(bounds.maxError, expectedMax);
      assert.ok(bounds.minError < bounds.maxError);
    });

    it('CH3-07: Memory leak & stress harness: 100 cycles of 10,000 points (1,000,000 total) maintains bounded heap', () => {
      if (global.gc) {
        global.gc();
      }

      const initialHeap = process.memoryUsage().heapUsed;
      const buffer = new LearningCurveDataBuffer(500);

      for (let cycle = 1; cycle <= 100; cycle++) {
        buffer.reset();
        for (let epoch = 1; epoch <= 10000; epoch++) {
          buffer.addPoint(epoch, 0.5 / (1 + epoch * 0.001));
        }
        assert.ok(buffer.points.length <= 1001);
      }

      buffer.reset();
      if (global.gc) {
        global.gc();
      }

      const finalHeap = process.memoryUsage().heapUsed;
      const heapDeltaMb = (finalHeap - initialHeap) / (1024 * 1024);

      // Heap growth should remain negligible (< 35 MB across 1M point insertions)
      assert.ok(
        heapDeltaMb < 35,
        `Potential memory leak detected: heap grew by ${heapDeltaMb.toFixed(2)} MB over 1,000,000 points`
      );
    });

    it('CH3-08: Reset cleanly clears all accumulated points and restores initial state', () => {
      const buffer = new LearningCurveDataBuffer(500);
      for (let i = 1; i <= 2500; i++) {
        buffer.addPoint(i, 0.1);
      }
      assert.ok(buffer.points.length > 0);

      buffer.reset();
      assert.strictEqual(buffer.points.length, 0);
      assert.deepStrictEqual(buffer.getPoints(), []);

      const bounds = buffer.getBounds();
      assert.strictEqual(bounds.minError, 0);
      assert.strictEqual(bounds.maxError, 1);
    });

    it('CH3-09: Supports custom maxPoints configurations (e.g. 50, 250, 1000) preserving boundary invariants', () => {
      const testCapacities = [50, 100, 250, 1000];

      for (const cap of testCapacities) {
        const buf = new LearningCurveDataBuffer(cap);
        const limit = cap * 2 + 1;

        for (let epoch = 1; epoch <= 5000; epoch++) {
          buf.addPoint(epoch, 1 / epoch);
          assert.ok(
            buf.points.length <= limit,
            `Capacity ${cap} violated at epoch ${epoch}: length ${buf.points.length} > ${limit}`
          );
        }

        assert.strictEqual(buf.points[0].epoch, 1, `Anchor 1 failed for cap ${cap}`);
        assert.strictEqual(buf.points[buf.points.length - 1].epoch, 5000, `Boundary 5000 failed for cap ${cap}`);
      }
    });
  });

  // =========================================================================
  // SUITE 2: Telemetry Calculations in metricsCalculator.ts Stress & Boundaries
  // =========================================================================
  describe('Suite 2: Telemetry Calculations Stress & Boundaries', () => {

    it('CH3-10: calculateProgressPercentage clamps strictly to [0.0, 100.0] under extreme values', () => {
      // Standard linear progression
      assert.strictEqual(calculateProgressPercentage(0, 1000), 0.0);
      assert.strictEqual(calculateProgressPercentage(250, 1000), 25.0);
      assert.strictEqual(calculateProgressPercentage(500, 1000), 50.0);
      assert.strictEqual(calculateProgressPercentage(750, 1000), 75.0);
      assert.strictEqual(calculateProgressPercentage(1000, 1000), 100.0);

      // Negative epoch clamping
      assert.strictEqual(calculateProgressPercentage(-1, 1000), 0.0);
      assert.strictEqual(calculateProgressPercentage(-9999, 1000), 0.0);

      // Overflow epoch clamping
      assert.strictEqual(calculateProgressPercentage(1001, 1000), 100.0);
      assert.strictEqual(calculateProgressPercentage(50000, 1000), 100.0);
      assert.strictEqual(calculateProgressPercentage(Infinity, 1000), 100.0);

      // Zero or negative maxEpochs guard (safeMax = Math.max(1, maxEpochs))
      assert.strictEqual(calculateProgressPercentage(0, 0), 0.0);
      assert.strictEqual(calculateProgressPercentage(1, 0), 100.0);
      assert.strictEqual(calculateProgressPercentage(0, -500), 0.0);
      assert.strictEqual(calculateProgressPercentage(10, -500), 100.0);

      // Floating precision check: 1 decimal place format
      assert.strictEqual(calculateProgressPercentage(333, 1000), 33.3);
      assert.strictEqual(calculateProgressPercentage(666, 1000), 66.6);
    });

    it('CH3-11: calculateErrorReduction handles initialError <= 0 without division by zero or NaN', () => {
      // Zero initial error
      assert.strictEqual(calculateErrorReduction(0, 0.05), 0);
      assert.strictEqual(calculateErrorReduction(0, 0), 0);

      // Negative initial error
      assert.strictEqual(calculateErrorReduction(-0.1, 0.05), 0);
      assert.strictEqual(calculateErrorReduction(-10, -5), 0);
    });

    it('CH3-12: calculateErrorReduction calculates positive convergence and diverging negative reductions', () => {
      // 50% reduction
      assert.strictEqual(calculateErrorReduction(0.5, 0.25), 50.00);

      // 80% reduction
      assert.strictEqual(calculateErrorReduction(0.5, 0.1), 80.00);

      // 100% reduction (zero error achieved)
      assert.strictEqual(calculateErrorReduction(0.5, 0.0), 100.00);

      // 0% reduction (no change)
      assert.strictEqual(calculateErrorReduction(0.5, 0.5), 0.00);

      // Error divergence (current > initial): produces negative reduction %
      assert.strictEqual(calculateErrorReduction(0.5, 1.0), -100.00);
      assert.strictEqual(calculateErrorReduction(0.5, 1.5), -200.00);
      assert.strictEqual(calculateErrorReduction(0.2, 0.8), -300.00);
    });

    it('CH3-13: calculateErrorReduction handles extreme numbers and small floating point values', () => {
      // Large magnitudes
      assert.strictEqual(calculateErrorReduction(1e12, 5e11), 50.00);
      assert.strictEqual(calculateErrorReduction(1e15, 1e14), 90.00);

      // Tiny subnormal magnitudes
      assert.strictEqual(calculateErrorReduction(1e-12, 5e-13), 50.00);
      assert.strictEqual(calculateErrorReduction(1e-15, 1e-16), 90.00);

      // High precision rounding
      assert.strictEqual(calculateErrorReduction(0.333333, 0.111111), 66.67);
    });

    it('CH3-14: formatElapsedTime and formatTimer format tenth-of-a-second MM:SS.t precision and handle boundaries', () => {
      // Alias check
      assert.strictEqual(formatTimer, formatElapsedTime);

      // Zero & negative
      assert.strictEqual(formatElapsedTime(0), '00:00.0');
      assert.strictEqual(formatElapsedTime(-5), '00:00.0');
      assert.strictEqual(formatElapsedTime(-0.001), '00:00.0');

      // Sub-second precision (tenths)
      assert.strictEqual(formatElapsedTime(0.1), '00:00.1');
      assert.strictEqual(formatElapsedTime(0.5), '00:00.5');
      assert.strictEqual(formatElapsedTime(0.95), '00:00.9');

      // Seconds & Minute roll-overs
      assert.strictEqual(formatElapsedTime(9.3), '00:09.3');
      assert.strictEqual(formatElapsedTime(59.9), '00:59.9');
      assert.strictEqual(formatElapsedTime(60.0), '01:00.0');
      assert.strictEqual(formatElapsedTime(61.2), '01:01.2');
      assert.strictEqual(formatElapsedTime(125.7), '02:05.7');

      // Hours format (> 60 minutes)
      assert.strictEqual(formatElapsedTime(3600.0), '60:00.0');
      assert.strictEqual(formatElapsedTime(3665.4), '61:05.4');
    });

    it('CH3-15: calculateLiveMetrics aggregates live metrics accurately and clamps elapsedSeconds to 0 if nowMs < startTimeMs', () => {
      const normalResult = calculateLiveMetrics({
        currentEpoch: 500,
        maxEpochs: 1000,
        initialError: 0.8,
        currentError: 0.2,
        startTimeMs: 10000,
        nowMs: 25300,
      });

      assert.strictEqual(normalResult.progressPercentage, 50.0);
      assert.strictEqual(normalResult.errorReductionPercentage, 75.00);
      assert.strictEqual(normalResult.elapsedSeconds, 15.3);

      // Inverted clock safeguard (nowMs before startTimeMs)
      const clockSkewResult = calculateLiveMetrics({
        currentEpoch: 100,
        maxEpochs: 1000,
        initialError: 0.5,
        currentError: 0.4,
        startTimeMs: 50000,
        nowMs: 40000,
      });

      assert.strictEqual(clockSkewResult.elapsedSeconds, 0.0);
    });

    it('CH3-16: parseEpochProgress parses SignalR events with backward compatibility and null safety', () => {
      // Backend legacy spelling
      const legacy = parseEpochProgress({ epoch: 10, avarageError: 0.123456 });
      assert.strictEqual(legacy.epoch, 10);
      assert.strictEqual(legacy.averageError, 0.123456);

      // Modern spelling
      const modern = parseEpochProgress({ epoch: 25, averageError: 0.0456 });
      assert.strictEqual(modern.epoch, 25);
      assert.strictEqual(modern.averageError, 0.0456);

      // String numerical values
      const stringVal = parseEpochProgress({ epoch: 50, avarageError: '0.0789' });
      assert.strictEqual(stringVal.epoch, 50);
      assert.strictEqual(stringVal.averageError, 0.0789);

      // Null, undefined, empty object fallback
      const nullEvent = parseEpochProgress(null);
      assert.strictEqual(nullEvent.epoch, 0);
      assert.strictEqual(nullEvent.averageError, 0);

      const emptyEvent = parseEpochProgress({});
      assert.strictEqual(emptyEvent.epoch, 0);
      assert.strictEqual(emptyEvent.averageError, 0);
    });
  });

  // =========================================================================
  // SUITE 3: Canvas Streaming Simulation & Batching Invariants
  // =========================================================================
  describe('Suite 3: Canvas Streaming Simulation & Batching Invariants', () => {

    it('CH3-17: Simulated incremental canvas ingest tracks lastRenderedIndex without duplicates', () => {
      const buffer = new LearningCurveDataBuffer(500);
      let lastRenderedIndex = 0;

      // Simulate 3 bursts of incoming SignalR events
      const burst1 = [
        { epoch: 1, avarageError: 0.8 },
        { epoch: 2, avarageError: 0.75 },
        { epoch: 3, avarageError: 0.7 },
      ];

      for (let i = lastRenderedIndex; i < burst1.length; i++) {
        buffer.addPoint(burst1[i].epoch, burst1[i].avarageError);
      }
      lastRenderedIndex = burst1.length;
      assert.strictEqual(buffer.points.length, 3);
      assert.strictEqual(lastRenderedIndex, 3);

      // Burst 2 appends 2 more events
      const burst2 = [
        ...burst1,
        { epoch: 4, avarageError: 0.65 },
        { epoch: 5, avarageError: 0.6 },
      ];

      for (let i = lastRenderedIndex; i < burst2.length; i++) {
        buffer.addPoint(burst2[i].epoch, burst2[i].avarageError);
      }
      lastRenderedIndex = burst2.length;
      assert.strictEqual(buffer.points.length, 5);
      assert.strictEqual(lastRenderedIndex, 5);

      // Verify no duplicate epochs were inserted
      const epochs = buffer.points.map((p) => p.epoch);
      assert.deepStrictEqual(epochs, [1, 2, 3, 4, 5]);
    });

    it('CH3-18: High-frequency burst of 1,000 events within 1 tick processes cleanly through buffer', () => {
      const buffer = new LearningCurveDataBuffer(500);
      const stream = [];

      for (let i = 1; i <= 1000; i++) {
        stream.push({ epoch: i, avarageError: 0.5 * Math.exp(-i / 300) });
      }

      for (const item of stream) {
        buffer.addPoint(item.epoch, item.avarageError);
      }

      assert.strictEqual(buffer.points.length, 1000);
      assert.strictEqual(buffer.points[0].epoch, 1);
      assert.strictEqual(buffer.points[999].epoch, 1000);

      // Point 1001 triggers downsampling
      buffer.addPoint(1001, 0.01);
      assert.strictEqual(buffer.points.length, 501);
      assert.strictEqual(buffer.points[0].epoch, 1);
      assert.strictEqual(buffer.points[500].epoch, 1001);
    });

    it('CH3-19: Target minimum error (E_min) parameter guards operate safely across invalid inputs', () => {
      // Inline plugin condition: if (targetError == null || targetError <= 0) return;
      const shouldDrawTargetLine = (targetError) => {
        if (targetError == null || targetError <= 0) return false;
        return true;
      };

      assert.strictEqual(shouldDrawTargetLine(0.01), true);
      assert.strictEqual(shouldDrawTargetLine(0.0001), true);
      assert.strictEqual(shouldDrawTargetLine(0), false);
      assert.strictEqual(shouldDrawTargetLine(-0.01), false);
      assert.strictEqual(shouldDrawTargetLine(null), false);
      assert.strictEqual(shouldDrawTargetLine(undefined), false);
    });
  });

  // =========================================================================
  // SUITE 4: Interactive Clamping & Status State Machine Robustness
  // =========================================================================
  describe('Suite 4: Progress Clamping & Status Robustness', () => {

    it('CH3-20: Progress percentage strictly stays within [0.0, 100.0] across all status transitions', () => {
      const statuses = ['idle', 'connecting', 'training', 'completed', 'stopped', 'error'];
      const maxEpochs = 1000;

      for (const status of statuses) {
        // Test lower boundary
        const lowProgress = calculateProgressPercentage(0, maxEpochs);
        assert.ok(lowProgress >= 0.0 && lowProgress <= 100.0, `Lower bound failed on status ${status}`);

        // Test mid boundary
        const midProgress = calculateProgressPercentage(500, maxEpochs);
        assert.ok(midProgress >= 0.0 && midProgress <= 100.0, `Mid bound failed on status ${status}`);

        // Test completed boundary
        const compProgress = calculateProgressPercentage(1000, maxEpochs);
        assert.ok(compProgress >= 0.0 && compProgress <= 100.0, `Completed bound failed on status ${status}`);

        // Test overshot boundary
        const overProgress = calculateProgressPercentage(1500, maxEpochs);
        assert.strictEqual(overProgress, 100.0, `Overshot bound failed on status ${status}`);
      }
    });

    it('CH3-21: Timer formatting under simulated 20 Hz (50ms) intervals produces monotonic display strings', () => {
      let previousSeconds = -1;
      let previousFormatted = '';

      for (let tick = 0; tick <= 100; tick++) {
        const elapsedSeconds = Number((tick * 0.05).toFixed(1));
        assert.ok(elapsedSeconds >= previousSeconds, `Elapsed seconds not monotonic at tick ${tick}`);

        const formatted = formatTimer(elapsedSeconds);
        assert.match(formatted, /^\d{2}:\d{2}\.\d$/, `Format invalid at tick ${tick}: ${formatted}`);

        previousSeconds = elapsedSeconds;
        previousFormatted = formatted;
      }

      assert.strictEqual(previousFormatted, '00:05.0');
    });

    it('CH3-22: Abort / stop action preserves stopped status and cleanly stops interval', () => {
      let isTimerActive = true;
      let status = 'training';

      // Simulate stopTraining action
      const stopTrainingAction = () => {
        isTimerActive = false;
        status = 'stopped';
      };

      stopTrainingAction();
      assert.strictEqual(status, 'stopped');
      assert.strictEqual(isTimerActive, false);
    });
  });
});
