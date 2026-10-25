export type ActivationFunction = "Logistica" | "Hiperbolica" | "Linear";

export interface MlpParameters {
  inputLayer: number;
  hiddenLayer: number;
  outputLayer: number;
  firstClassColumn: number;
  learningRate: number;
  errorValue: number;
  epochs: number;
  transferFunction: ActivationFunction;
  trainingRate: number;
  sameFileForTesting: boolean;
}

export type DataRow = Record<string, number>;

export interface RunPerceptronRequest {
  sessionId: string;
  parameters: MlpParameters;
  data: DataRow[];
  dataToTest: DataRow[] | null;
}

export interface EpochProgress {
  epoch: number;
  avarageError: number; // Backend legacy spelling compatibility
  averageError?: number; // Normalized accessor
}

export interface RunPerceptronDataResponse {
  arrAvaregeError: EpochProgress[];
  confusionMatrix: number[][];
  accuracyPercentage: number;
  totalEpochs: number;
  finalError: number;
  converged: boolean;
}

export interface RunPerceptronResponse {
  message: string;
  data: RunPerceptronDataResponse;
}

export interface HealthResponse {
  status: string;
  message: string;
  timestamp: string;
}

export type TrainingStatus = "idle" | "connecting" | "training" | "completed" | "error" | "stopped";
