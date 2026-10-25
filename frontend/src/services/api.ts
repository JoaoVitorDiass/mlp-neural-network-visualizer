/**
 * REST API Client Service
 *
 * Provides typed HTTP communication with the ASP.NET Core backend:
 * - GET /api/mlp/health: Health check status and uptime indicator.
 * - POST /api/mlp/runPerceptron: Initiates neural network training and returns final evaluation.
 * - parseApiError: Robust error classification and user-friendly offline / Portuguese error messaging.
 * - buildRunPerceptronPayload: Helper bridging ProcessedDataset with the backend DTO schema.
 */

import axios, { AxiosInstance } from "axios";
import {
  HealthResponse,
  MlpParameters,
  RunPerceptronRequest,
  RunPerceptronResponse,
  EpochProgress,
} from "../types/mlp";
import { ProcessedDataset } from "../types/dataset";
import { generateSessionId } from "./signalr";

/**
 * Resolves the API base URL based on environment variables or defaults to relative proxy.
 */
export function getApiBaseUrl(): string {
  const metaEnv = (import.meta as any).env;
  const envUrl = metaEnv?.VITE_API_URL || metaEnv?.VITE_BACKEND_URL;

  if (envUrl && typeof envUrl === "string" && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, "");
  }
  return "";
}

/**
 * Pre-configured Axios instance for backend communications.
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 120000, // 2-minute timeout for intensive backpropagation training
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

/**
 * Standardized error representation matching Tier 1 F19 offline and error expectations.
 */
export interface ApiErrorInfo {
  userMessage: string;
  isOffline: boolean;
  status?: number;
  data?: any;
  rawError: unknown;
}

/**
 * Parses any caught API error into actionable user messages and flags backend offline status.
 */
export function parseApiError(error: unknown): ApiErrorInfo {
  if (!error) {
    return {
      userMessage: "Erro desconhecido.",
      isOffline: false,
      rawError: error,
    };
  }

  const anyErr = error as any;
  const code = anyErr.code;
  const name = anyErr.name;
  const message = String(anyErr.message || "");

  // Offline detection: Connection refused, network error, fetch failure
  const isNetworkOffline =
    code === "ECONNREFUSED" ||
    code === "ERR_NETWORK" ||
    name === "TypeError" ||
    message.includes("fetch failed") ||
    message.includes("Network Error") ||
    message.includes("ECONNREFUSED") ||
    (axios.isAxiosError(error) && !error.response);

  if (isNetworkOffline) {
    return {
      userMessage:
        "Servidor backend offline. Verifique se o ASP.NET Core está rodando na porta 5134.",
      isOffline: true,
      rawError: error,
    };
  }

  const status = anyErr.status ?? (axios.isAxiosError(error) ? error.response?.status : undefined);
  const data = anyErr.data ?? (axios.isAxiosError(error) ? error.response?.data : undefined);

  // HTTP 400 Bad Request: Business / validation errors
  if (status === 400) {
    const errorMsg = data?.message || "Parâmetros de treinamento inválidos.";
    return {
      userMessage: errorMsg,
      isOffline: false,
      status: 400,
      data,
      rawError: error,
    };
  }

  // HTTP 500 Internal Server Error: Backend runtime failure
  if (status === 500) {
    const errorMsg = data?.message || "Erro interno no backend durante o treinamento.";
    return {
      userMessage: errorMsg.includes("Erro interno")
        ? errorMsg
        : "Erro interno no backend durante o treinamento.",
      isOffline: false,
      status: 500,
      data,
      rawError: error,
    };
  }

  return {
    userMessage: data?.message || message || "Erro inesperado na comunicação.",
    isOffline: false,
    status,
    data,
    rawError: error,
  };
}

/**
 * Helper to check whether an error indicates the backend is offline.
 */
export function isApiOffline(error: unknown): boolean {
  return parseApiError(error).isOffline;
}

/**
 * Checks backend health status.
 * Uses a snappy 5-second timeout for rapid offline detection.
 */
export async function checkHealth(options?: {
  timeout?: number;
  signal?: AbortSignal;
}): Promise<HealthResponse> {
  const timeout = options?.timeout ?? 5000;
  try {
    const response = await apiClient.get<HealthResponse>("/api/mlp/health", {
      timeout,
      signal: options?.signal,
    });
    return response.data;
  } catch (err) {
    const parsed = parseApiError(err);
    const error = new Error(parsed.userMessage);
    (error as any).info = parsed;
    (error as any).isOffline = parsed.isOffline;
    throw error;
  }
}

/**
 * Executes MLP neural network training via POST /api/mlp/runPerceptron.
 * Normalizes arrAvaregeError to guarantee dual accessor compatibility.
 */
export async function runPerceptron(
  request: RunPerceptronRequest,
  options?: { signal?: AbortSignal; timeout?: number }
): Promise<RunPerceptronResponse> {
  if (!request.data || request.data.length === 0) {
    throw new Error("Os dados de entrada não podem estar vazios.");
  }

  const payload: RunPerceptronRequest = {
    sessionId: request.sessionId || generateSessionId(),
    parameters: { ...request.parameters },
    data: request.data,
    dataToTest: request.dataToTest ?? null,
  };

  try {
    const response = await apiClient.post<RunPerceptronResponse>(
      "/api/mlp/runPerceptron",
      payload,
      {
        signal: options?.signal,
        timeout: options?.timeout ?? 120000,
      }
    );

    const result = response.data;

    // Normalize arrAvaregeError items for dual-accessor convenience
    if (result?.data?.arrAvaregeError) {
      result.data.arrAvaregeError = result.data.arrAvaregeError.map((item: EpochProgress) => ({
        epoch: item.epoch,
        avarageError: item.avarageError ?? (item as any).averageError ?? 0,
        averageError: (item as any).averageError ?? item.avarageError ?? 0,
      }));
    }

    return result;
  } catch (err) {
    const parsed = parseApiError(err);
    const error = new Error(parsed.userMessage);
    (error as any).info = parsed;
    (error as any).status = parsed.status;
    (error as any).data = parsed.data;
    (error as any).isOffline = parsed.isOffline;
    throw error;
  }
}

/**
 * Constructs a fully qualified RunPerceptronRequest payload from processed dataset and parameters.
 * Supports both argument orders: (parameters, dataset, sessionId) or (sessionId, parameters, dataset).
 */
export function buildRunPerceptronPayload(
  arg1: MlpParameters | string,
  arg2: ProcessedDataset | MlpParameters,
  arg3?: string | ProcessedDataset,
  arg4?: Record<string, number>[] | null
): RunPerceptronRequest {
  let sessionId: string;
  let parameters: MlpParameters;
  let dataset: ProcessedDataset;
  let testRows: Record<string, number>[] | null = null;

  if (typeof arg1 === "string") {
    sessionId = arg1;
    parameters = arg2 as MlpParameters;
    dataset = arg3 as ProcessedDataset;
    testRows = arg4 ?? null;
  } else {
    parameters = arg1 as MlpParameters;
    dataset = arg2 as ProcessedDataset;
    sessionId = typeof arg3 === "string" ? arg3 : generateSessionId();
    testRows = arg4 ?? null;
  }

  return {
    sessionId: sessionId || generateSessionId(),
    parameters: {
      inputLayer: parameters.inputLayer,
      hiddenLayer: parameters.hiddenLayer,
      outputLayer: parameters.outputLayer,
      firstClassColumn: parameters.firstClassColumn,
      learningRate: parameters.learningRate,
      errorValue: parameters.errorValue,
      epochs: parameters.epochs,
      transferFunction: parameters.transferFunction,
      trainingRate: parameters.trainingRate,
      sameFileForTesting: parameters.sameFileForTesting,
    },
    data: dataset.normalizedRows,
    dataToTest: testRows ?? null,
  };
}
