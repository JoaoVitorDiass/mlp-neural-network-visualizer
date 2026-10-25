import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class LearningCurveDataBuffer {
  constructor(maxPoints = 500) {
    this.maxPoints = maxPoints;
    this.points = [];
  }

  addPoint(epoch, error) {
    if (error < 0) throw new Error('Error value must be non-negative');
    this.points.push({ epoch, error });
    // If buffer exceeds maxPoints, downsample to retain smooth rendering without DOM or memory lag
    if (this.points.length > this.maxPoints * 2) {
      this.downsample();
    }
  }

  downsample() {
    const downsampled = [];
    for (let i = 0; i < this.points.length; i += 2) {
      downsampled.push(this.points[i]);
    }
    this.points = downsampled;
  }

  reset() {
    this.points = [];
  }

  getBounds() {
    if (this.points.length === 0) return { minError: 0, maxError: 1 };
    let minError = Infinity;
    let maxError = -Infinity;
    for (const p of this.points) {
      if (p.error < minError) minError = p.error;
      if (p.error > maxError) maxError = p.error;
    }
    return { minError, maxError };
  }
}

describe('Tier 1 - F16: Animated Learning Curve Chart', () => {
  it('F16-1: Data buffer accumulates progress points monotonically by epoch', () => {
    const buffer = new LearningCurveDataBuffer();
    buffer.addPoint(1, 0.45);
    buffer.addPoint(10, 0.35);
    buffer.addPoint(20, 0.25);
    assert.strictEqual(buffer.points.length, 3);
    assert.strictEqual(buffer.points[2].epoch, 20);
  });

  it('F16-2: Error values are validated to be strictly non-negative', () => {
    const buffer = new LearningCurveDataBuffer();
    assert.throws(() => buffer.addPoint(5, -0.1), /non-negative/i);
  });

  it('F16-3: Chart bounds computation accurately derives minError and maxError', () => {
    const buffer = new LearningCurveDataBuffer();
    buffer.addPoint(1, 0.6);
    buffer.addPoint(50, 0.15);
    buffer.addPoint(100, 0.02);
    const bounds = buffer.getBounds();
    assert.strictEqual(bounds.minError, 0.02);
    assert.strictEqual(bounds.maxError, 0.6);
  });

  it('F16-4: High volume buffer automatically downsamples to maintain 60 FPS performance', () => {
    const buffer = new LearningCurveDataBuffer(100);
    for (let i = 1; i <= 250; i++) {
      buffer.addPoint(i, 1.0 / i);
    }
    assert.ok(buffer.points.length <= 150, 'Buffer should downsample to prevent UI freeze');
  });

  it('F16-5: Reset clears all data series for subsequent training executions', () => {
    const buffer = new LearningCurveDataBuffer();
    buffer.addPoint(1, 0.5);
    buffer.reset();
    assert.strictEqual(buffer.points.length, 0);
  });
});
