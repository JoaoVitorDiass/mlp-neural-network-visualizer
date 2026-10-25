/**
 * Utility: Metrics Calculator
 *
 * Provides real-time calculation and formatting functions for MLP training metrics:
 * - Progress bar percentage [0.0, 100.0]
 * - Error reduction percentage relative to initial loss
 * - Elapsed training time formatted as MM:SS.ms
 * - SignalR epoch progress payload parser with legacy backend spelling fallback
 */

export interface LiveMetricsInput {
  currentEpoch: number;
  maxEpochs: number;
  initialError: number;
  currentError: number;
  startTimeMs: number;
  nowMs: number;
}

export interface LiveMetricsResult {
  progressPercentage: number;
  errorReductionPercentage: number;
  elapsedSeconds: number;
}

/**
 * Calculates progress percentage bounded strictly to [0.0, 100.0].
 */
export function calculateProgressPercentage(epoch: number, maxEpochs: number): number {
  const safeMax = Math.max(1, maxEpochs);
  const percentage = Math.min(100, Math.max(0, (epoch / safeMax) * 100));
  return Number(percentage.toFixed(1));
}

/**
 * Calculates error reduction percentage: ((initial - current) / initial) * 100.
 */
export function calculateErrorReduction(initialError: number, currentError: number): number {
  if (initialError <= 0) return 0;
  const reduction = ((initialError - currentError) / initialError) * 100;
  return Number(reduction.toFixed(2));
}

/**
 * Formats elapsed seconds into standard MM:SS.ms representation.
 */
export function formatElapsedTime(seconds: number): string {
  const safeSeconds = Math.max(0, seconds);
  const totalMs = Math.floor(safeSeconds * 1000);
  const mins = Math.floor(totalMs / 60000);
  const secs = Math.floor((totalMs % 60000) / 1000);
  const tenths = Math.floor((totalMs % 1000) / 100);

  const mm = String(mins).padStart(2, "0");
  const ss = String(secs).padStart(2, "0");
  return `${mm}:${ss}.${tenths}`;
}

/**
 * Alias for formatElapsedTime.
 */
export const formatTimer = formatElapsedTime;

/**
 * Calculates comprehensive real-time training metrics matching E2E suite F15.
 */
export function calculateLiveMetrics({
  currentEpoch,
  maxEpochs,
  initialError,
  currentError,
  startTimeMs,
  nowMs,
}: LiveMetricsInput): LiveMetricsResult {
  const progressPercentage = calculateProgressPercentage(currentEpoch, maxEpochs);
  const errorReductionPercentage = calculateErrorReduction(initialError, currentError);
  const elapsedSeconds = Number(Math.max(0, (nowMs - startTimeMs) / 1000).toFixed(1));

  return {
    progressPercentage,
    errorReductionPercentage,
    elapsedSeconds,
  };
}

/**
 * Parses incoming SignalR epoch payload with backward-compatible spelling.
 * Handles both avarageError (backend legacy) and averageError (normalized).
 */
export function parseEpochProgress(event: any): { epoch: number; averageError: number } {
  const epoch = typeof event?.epoch === "number" ? event.epoch : 0;
  const rawError = event?.avarageError ?? event?.averageError ?? 0;
  return {
    epoch,
    averageError: Number(rawError),
  };
}
