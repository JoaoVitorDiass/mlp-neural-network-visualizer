import { MlpParameters } from "./mlp";

export type ColumnRole = "input" | "target" | "ignore";

export interface ColumnMeta {
  name: string;
  role: ColumnRole;
  type: "numeric" | "categorical";
  min?: number;
  max?: number;
  uniqueValues?: string[];
}

export interface ProcessedDataset {
  rawRows: Record<string, any>[];
  normalizedRows: Record<string, number>[];
  columns: ColumnMeta[];
  inputCount: number;
  outputCount: number;
  firstClassIndex: number;
  targetClasses: string[];
}

export interface DatasetPreset {
  id: string;
  name: string;
  description: string;
  sampleCount: number;
  featureCount: number;
  classCount: number;
  csvContent: string;
  defaultParameters: Partial<MlpParameters>;
}
