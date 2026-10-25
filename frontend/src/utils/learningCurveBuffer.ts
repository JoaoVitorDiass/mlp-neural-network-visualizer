/**
 * Utility: Learning Curve Data Buffer
 *
 * High-performance mutable buffer for streaming learning curve coordinates.
 * Features:
 * - Monotonic point accumulation by epoch.
 * - Non-negative error value assertion.
 * - Dynamic min/max error bounds calculation for canvas chart axes.
 * - Automatic downsampling with stride 2 when exceeding maxPoints * 2 to guarantee 60 FPS.
 * - Reset support for subsequent training executions.
 */

export interface CurvePoint {
  epoch: number;
  error: number;
}

export interface ChartBounds {
  minError: number;
  maxError: number;
}

export class LearningCurveDataBuffer {
  public points: CurvePoint[];
  private maxPoints: number;

  constructor(maxPoints = 500) {
    this.maxPoints = maxPoints;
    this.points = [];
  }

  /**
   * Adds an epoch loss coordinate to the buffer.
   * Throws an error if the error value is negative.
   * Automatically triggers downsampling if buffer exceeds maxPoints * 2.
   */
  public addPoint(epoch: number, error: number): void {
    if (error < 0) {
      throw new Error("Error value must be non-negative");
    }
    this.points.push({ epoch, error });

    if (this.points.length > this.maxPoints * 2) {
      this.downsample();
    }
  }

  /**
   * Downsamples accumulated points by factor of 2.
   */
  public downsample(): void {
    const downsampled: CurvePoint[] = [];
    for (let i = 0; i < this.points.length; i += 2) {
      downsampled.push(this.points[i]);
    }
    this.points = downsampled;
  }

  /**
   * Resets all accumulated points for a fresh session.
   */
  public reset(): void {
    this.points = [];
  }

  /**
   * Calculates minimum and maximum error values currently in buffer.
   */
  public getBounds(): ChartBounds {
    if (this.points.length === 0) {
      return { minError: 0, maxError: 1 };
    }
    let minError = Infinity;
    let maxError = -Infinity;
    for (const p of this.points) {
      if (p.error < minError) minError = p.error;
      if (p.error > maxError) maxError = p.error;
    }
    return { minError, maxError };
  }

  /**
   * Returns copy or reference to the buffered curve points.
   */
  public getPoints(): CurvePoint[] {
    return this.points;
  }
}
