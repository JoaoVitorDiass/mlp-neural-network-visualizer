/**
 * Custom Hook: useTrainingSession
 *
 * Orchestrates the full lifecycle of an MLP neural network training session:
 * - Generates unique RFC 4122 UUID v4 session IDs.
 * - Connects to SignalR Hub (/hubs/training) and joins isolated session group.
 * - Streams ReceiveEpochProgress events in real-time.
 * - Computes live training metrics (progress %, error reduction %, elapsed timer).
 * - Dispatches POST /api/mlp/runPerceptron with AbortController cancellation.
 * - Captures final RunPerceptronDataResponse and evaluation metrics.
 * - Cleans up listeners, timers, and leaves session group on finish or stop.
 */

import { useState, useRef, useCallback, useEffect } from "react";
import {
  MlpParameters,
  EpochProgress,
  RunPerceptronDataResponse,
  TrainingStatus,
} from "../types/mlp";
import { ProcessedDataset } from "../types/dataset";
import {
  generateSessionId,
  startConnection,
  joinSession,
  leaveSession,
  onReceiveEpochProgress,
  onConnectionStateChange,
  getConnectionState,
} from "../services/signalr";
import {
  runPerceptron,
  buildRunPerceptronPayload,
  parseApiError,
} from "../services/api";
import { HubConnectionState } from "@microsoft/signalr";

export interface TrainingMetrics {
  currentEpoch: number;
  maxEpochs: number;
  currentError: number;
  initialError: number;
  errorReduction: number; // percentage [0.00, 100.00]
  errorReductionPercentage: number; // alias for errorReduction
  progressPercentage: number; // percentage [0.0, 100.0]
  elapsedSeconds: number; // seconds with 1 decimal
}

export interface UseTrainingSessionReturn {
  sessionId: string | null;
  status: TrainingStatus;
  connectionState: HubConnectionState;
  epochProgress: EpochProgress[];
  metrics: TrainingMetrics;
  trainingResult: RunPerceptronDataResponse | null;
  error: string | null;
  startTraining: (
    parameters: MlpParameters,
    dataset: ProcessedDataset,
    testDataset?: ProcessedDataset | null
  ) => Promise<void>;
  stopTraining: () => void;
  resetTraining: () => void;
}

const INITIAL_METRICS: TrainingMetrics = {
  currentEpoch: 0,
  maxEpochs: 1000,
  currentError: 0,
  initialError: 0,
  errorReduction: 0,
  errorReductionPercentage: 0,
  progressPercentage: 0,
  elapsedSeconds: 0,
};

export const useTrainingSession = (): UseTrainingSessionReturn => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState<TrainingStatus>("idle");
  const [connectionState, setConnectionState] = useState<HubConnectionState>(
    getConnectionState()
  );
  const [epochProgress, setEpochProgress] = useState<EpochProgress[]>([]);
  const [metrics, setMetrics] = useState<TrainingMetrics>(INITIAL_METRICS);
  const [trainingResult, setTrainingResult] = useState<RunPerceptronDataResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // References for live ticker, cancellation, and callbacks
  const abortControllerRef = useRef<AbortController | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const initialErrorRef = useRef<number | null>(null);
  const activeSessionIdRef = useRef<string | null>(null);
  const unsubscribeProgressRef = useRef<(() => void) | null>(null);

  // Synchronize SignalR connection state changes
  useEffect(() => {
    const unsubState = onConnectionStateChange((state) => {
      setConnectionState(state);
    });
    return () => {
      unsubState();
    };
  }, []);

  // Helper to stop high-resolution timer
  const stopTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  // Action: Stop Training
  const stopTraining = useCallback(() => {
    if (status !== "training" && status !== "connecting") return;

    // Abort HTTP request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Stop timer
    stopTimer();

    // Clean up SignalR listener & leave session
    if (unsubscribeProgressRef.current) {
      unsubscribeProgressRef.current();
      unsubscribeProgressRef.current = null;
    }

    if (activeSessionIdRef.current) {
      leaveSession(activeSessionIdRef.current).catch(() => {});
    }

    setStatus("stopped");
  }, [status, stopTimer]);

  // Action: Reset Training State
  const resetTraining = useCallback(() => {
    stopTraining();
    setSessionId(null);
    activeSessionIdRef.current = null;
    setStatus("idle");
    setEpochProgress([]);
    setMetrics(INITIAL_METRICS);
    setTrainingResult(null);
    setError(null);
    startTimeRef.current = null;
    initialErrorRef.current = null;
  }, [stopTraining]);

  // Action: Start Training
  const startTraining = useCallback(
    async (
      parameters: MlpParameters,
      dataset: ProcessedDataset,
      testDataset?: ProcessedDataset | null
    ) => {
      if (status === "training" || status === "connecting") return;

      // Validation 1: Dataset presence and non-empty rows
      if (!dataset || !dataset.normalizedRows || dataset.normalizedRows.length === 0) {
        setError("Nenhum dado válido selecionado. Configure um dataset primeiro.");
        setStatus("error");
        return;
      }

      // Validation 2: Topology boundaries
      if (
        parameters.inputLayer < 1 ||
        parameters.hiddenLayer < 1 ||
        parameters.outputLayer < 1 ||
        parameters.epochs < 1
      ) {
        setError("Camadas e épocas devem ser números inteiros maiores que zero.");
        setStatus("error");
        return;
      }

      if (parameters.firstClassColumn !== parameters.inputLayer) {
        setError(
          `firstClassColumn (${parameters.firstClassColumn}) deve ser igual a inputLayer (${parameters.inputLayer}).`
        );
        setStatus("error");
        return;
      }

      // 1. Initialize session state
      const newSessionId = generateSessionId();
      setSessionId(newSessionId);
      activeSessionIdRef.current = newSessionId;
      setError(null);
      setEpochProgress([]);
      setTrainingResult(null);
      setStatus("connecting");
      startTimeRef.current = null;
      initialErrorRef.current = null;

      setMetrics({
        ...INITIAL_METRICS,
        maxEpochs: parameters.epochs,
      });

      try {
        // 2. Ensure SignalR connection is active
        await startConnection();

        // 3. Register client to isolated session group
        await joinSession(newSessionId);

        // 4. Setup SignalR event listener
        const unsub = onReceiveEpochProgress((progress) => {
          const epoch = progress.epoch;
          const err = progress.avarageError ?? progress.averageError ?? 0;

          if (initialErrorRef.current === null && err > 0) {
            initialErrorRef.current = err;
          }

          const initErr = initialErrorRef.current ?? err;
          const reduction = initErr > 0 ? ((initErr - err) / initErr) * 100 : 0;
          const progressPct = Math.min(100, Math.max(0, (epoch / parameters.epochs) * 100));

          setEpochProgress((prev) => [
            ...prev,
            { epoch, avarageError: err, averageError: err },
          ]);

          setMetrics((prev) => ({
            ...prev,
            currentEpoch: epoch,
            currentError: err,
            initialError: initErr,
            errorReduction: Number(reduction.toFixed(2)),
            errorReductionPercentage: Number(reduction.toFixed(2)),
            progressPercentage: Number(progressPct.toFixed(1)),
          }));
        });

        unsubscribeProgressRef.current = unsub;

        // 5. Start elapsed timer
        startTimeRef.current = Date.now();
        setStatus("training");

        stopTimer();
        timerIntervalRef.current = setInterval(() => {
          if (startTimeRef.current) {
            const elapsed = Math.max(0, (Date.now() - startTimeRef.current) / 1000);
            setMetrics((prev) => ({
              ...prev,
              elapsedSeconds: Number(elapsed.toFixed(1)),
            }));
          }
        }, 100);

        // 6. Build typed payload and dispatch REST POST
        const testRows = (!parameters.sameFileForTesting && testDataset?.normalizedRows?.length)
          ? testDataset.normalizedRows
          : null;
        const payload = buildRunPerceptronPayload(parameters, dataset, newSessionId, testRows);
        abortControllerRef.current = new AbortController();

        const response = await runPerceptron(payload, {
          signal: abortControllerRef.current.signal,
          timeout: 120000,
        });

        // 7. On success: capture results & finalize metrics
        stopTimer();

        if (response?.data) {
          setTrainingResult(response.data);

          // If SignalR dropped or lagged, ensure complete final epoch history
          if (response.data.arrAvaregeError && response.data.arrAvaregeError.length > 0) {
            setEpochProgress((prev) =>
              prev.length >= response.data.arrAvaregeError.length
                ? prev
                : response.data.arrAvaregeError
            );
          }

          const finalEpochs = response.data.totalEpochs;
          const finalErr = response.data.finalError;
          const initErr = initialErrorRef.current ?? finalErr;
          const finalReduction = initErr > 0 ? ((initErr - finalErr) / initErr) * 100 : 0;
          const finalPct = Math.min(100, Math.max(0, (finalEpochs / parameters.epochs) * 100));

          setMetrics((prev) => ({
            ...prev,
            currentEpoch: finalEpochs,
            currentError: finalErr,
            errorReduction: Number(finalReduction.toFixed(2)),
            errorReductionPercentage: Number(finalReduction.toFixed(2)),
            progressPercentage: Number(finalPct.toFixed(1)),
          }));
        }

        setStatus("completed");
      } catch (err: any) {
        stopTimer();

        // If user intentionally stopped, keep status as stopped
        if (err?.name === "CanceledError" || err?.name === "AbortError") {
          setStatus("stopped");
        } else {
          const parsed = parseApiError(err);
          setError(parsed.userMessage);
          setStatus("error");
        }
      } finally {
        // 8. Clean up SignalR listener & session
        if (unsubscribeProgressRef.current) {
          unsubscribeProgressRef.current();
          unsubscribeProgressRef.current = null;
        }

        if (activeSessionIdRef.current) {
          leaveSession(activeSessionIdRef.current).catch(() => {});
        }
      }
    },
    [status, stopTimer]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTimer();
      if (unsubscribeProgressRef.current) {
        unsubscribeProgressRef.current();
      }
      if (activeSessionIdRef.current) {
        leaveSession(activeSessionIdRef.current).catch(() => {});
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [stopTimer]);

  return {
    sessionId,
    status,
    connectionState,
    epochProgress,
    metrics,
    trainingResult,
    error,
    startTraining,
    stopTraining,
    resetTraining,
  };
};
