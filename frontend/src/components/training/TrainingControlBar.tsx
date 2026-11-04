/**
 * Component: TrainingControlBar
 *
 * Dedicated header bar controlling model training execution:
 * - "Iniciar Treinamento" (Primary CTA with play icon and loading state).
 * - "Interromper" (Danger/warning button with square stop icon).
 * - "Novo Treinamento" / "Limpar" (Reset button).
 * - Connection status pill (SignalR live connected, connecting, disconnected).
 * - Dataset & Topology summary badge.
 * - Transition button to Evaluation tab upon completion.
 */

import React from "react";
import {
  Card,
  CardBody,
  Button,
  Chip,
  Tooltip,
} from "@heroui/react";
import {
  Play,
  Square,
  RotateCcw,
  Radio,
  Cpu,
  Database,
  ArrowRight,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { MlpParameters, TrainingStatus } from "../../types/mlp";
import { HubConnectionState } from "@microsoft/signalr";

export interface TrainingControlBarProps {
  status: TrainingStatus;
  connectionState: HubConnectionState;
  parameters: MlpParameters;
  datasetName?: string;
  datasetRowCount?: number;
  testDatasetName?: string;
  testRowCount?: number;
  canStart: boolean;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  onViewEvaluation: () => void;
}

export const TrainingControlBar: React.FC<TrainingControlBarProps> = ({
  status,
  connectionState,
  parameters,
  datasetName = "Dataset",
  datasetRowCount = 0,
  testDatasetName,
  testRowCount,
  canStart,
  onStart,
  onStop,
  onReset,
  onViewEvaluation,
}) => {
  const isTraining = status === "training";
  const isConnecting = status === "connecting";
  const isCompleted = status === "completed";
  const isStopped = status === "stopped";
  const isError = status === "error";

  const isSignalRConnected = connectionState === HubConnectionState.Connected;
  const isSignalRConnecting =
    connectionState === HubConnectionState.Connecting ||
    connectionState === HubConnectionState.Reconnecting;

  return (
    <Card className="border border-amber-200/80 dark:border-amber-950/40 bg-white/80 dark:bg-content1/70 backdrop-blur-md shadow-sm rounded-2xl">
      <CardBody className="p-5 space-y-4">
        {/* Row 1: Header / Status on Left and Primary Action Buttons on Right */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                <Play className="h-5 w-5 fill-current" />
              </div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
                Estúdio de Treinamento
              </h2>
            </div>

            {/* SignalR Connection Status Pill */}
            <Tooltip
              content={
                isSignalRConnected
                  ? "Conexão WebSocket ativa em /hubs/training (Streaming 60 FPS)"
                  : isSignalRConnecting
                  ? "Tentando estabelecer conexão com o Hub SignalR..."
                  : "Desconectado do SignalR. O backend precisa estar em execução."
              }
              placement="top"
            >
              <div>
                {isSignalRConnected ? (
                  <Chip
                    size="sm"
                    variant="flat"
                    color="success"
                    startContent={
                      <span className="relative flex h-2 w-2 ml-1">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                    }
                    className="font-semibold text-xs text-emerald-600 dark:text-emerald-400 rounded-xl"
                  >
                    SignalR Live
                  </Chip>
                ) : isSignalRConnecting ? (
                  <Chip
                    size="sm"
                    variant="flat"
                    color="warning"
                    startContent={<RefreshCw className="h-3 w-3 animate-spin text-amber-500 ml-1" />}
                    className="font-medium text-xs text-amber-600 dark:text-amber-400 rounded-xl"
                  >
                    Conectando Hub...
                  </Chip>
                ) : (
                  <Chip
                    size="sm"
                    variant="flat"
                    color="default"
                    startContent={<Radio className="h-3 w-3 text-default-400 ml-1" />}
                    className="font-medium text-xs text-default-500 rounded-xl"
                  >
                    SignalR Offline
                  </Chip>
                )}
              </div>
            </Tooltip>

            {/* Session Status Pill */}
            {status !== "idle" && (
              <Chip
                size="sm"
                variant="shadow"
                color={
                  isCompleted
                    ? "success"
                    : isTraining
                    ? "primary"
                    : isError
                    ? "danger"
                    : isStopped
                    ? "warning"
                    : "default"
                }
                startContent={
                  isCompleted ? (
                    <CheckCircle2 className="h-3.5 w-3.5 ml-1" />
                  ) : isStopped ? (
                    <AlertTriangle className="h-3.5 w-3.5 ml-1" />
                  ) : undefined
                }
                className="capitalize font-semibold text-xs rounded-xl"
              >
                {status === "training" && "Em Treinamento"}
                {status === "connecting" && "Preparando Sessão..."}
                {status === "completed" && "Concluído"}
                {status === "stopped" && "Interrompido"}
                {status === "error" && "Erro"}
              </Chip>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Reset / Clear Button */}
            {(isCompleted || isStopped || isError) && (
              <Button
                size="md"
                variant="flat"
                color="default"
                startContent={<RotateCcw className="h-4 w-4" />}
                onClick={onReset}
                className="font-medium text-xs sm:text-sm rounded-xl"
              >
                Novo Treinamento
              </Button>
            )}

            {/* Completed State: Transition to Evaluation CTA */}
            {isCompleted && (
              <Button
                size="md"
                variant="shadow"
                color="success"
                endContent={<ArrowRight className="h-4 w-4" />}
                onClick={onViewEvaluation}
                className="font-bold text-xs sm:text-sm rounded-xl px-4"
              >
                Ver Avaliação
              </Button>
            )}

            {/* Active Training: Interromper (Stop) Button */}
            {(isTraining || isConnecting) && (
              <Button
                size="md"
                variant="flat"
                color="danger"
                startContent={<Square className="h-4 w-4 fill-current" />}
                onClick={onStop}
                className="font-bold text-xs sm:text-sm rounded-xl px-4"
              >
                Interromper
              </Button>
            )}

            {/* Idle / Error / Stopped State: Iniciar Treinamento Primary CTA */}
            {!isTraining && !isConnecting && !isCompleted && (
              <Tooltip
                content={
                  !canStart
                    ? "Selecione ou carregue um dataset válido antes de iniciar"
                    : "Iniciar treinamento com backpropagation"
                }
                isDisabled={canStart}
              >
                <div>
                  <Button
                    size="md"
                    variant="shadow"
                    color="primary"
                    isDisabled={!canStart}
                    startContent={<Play className="h-4 w-4 fill-current" />}
                    onClick={onStart}
                    className="font-bold text-xs sm:text-sm shadow-primary/30 rounded-xl px-5"
                  >
                    Iniciar Treinamento
                  </Button>
                </div>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Row 2: Dataset, Topology and Hyperparameters Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-amber-100/80 dark:border-default-200/40 text-xs">
          {/* Dataset Badge */}
          <Chip
            size="sm"
            variant="flat"
            color="primary"
            startContent={<Database className="h-3.5 w-3.5 ml-1 text-primary" />}
            className="font-medium text-xs rounded-xl"
          >
            Treino: {datasetName} ({datasetRowCount} amostras)
          </Chip>

          {typeof testRowCount === "number" && testRowCount > 0 && (
            <Chip
              size="sm"
              variant="flat"
              color="secondary"
              startContent={<Database className="h-3.5 w-3.5 ml-1 text-secondary" />}
              className="font-medium text-xs rounded-xl"
            >
              Teste: {testDatasetName || "Teste"} ({testRowCount} amostras)
            </Chip>
          )}

          {/* Topology Badge */}
          <Chip
            size="sm"
            variant="flat"
            color="secondary"
            startContent={<Cpu className="h-3.5 w-3.5 ml-1 text-secondary" />}
            className="font-mono text-xs font-semibold rounded-xl"
          >
            {parameters.inputLayer} → {parameters.hiddenLayer} → {parameters.outputLayer}
          </Chip>

          {/* Hyperparameters Badge */}
          <Chip
            size="sm"
            variant="bordered"
            startContent={<Sliders className="h-3.5 w-3.5 ml-1 text-default-500" />}
            className="font-mono text-xs rounded-xl hidden sm:inline-flex"
          >
            η: {parameters.learningRate} | {parameters.transferFunction} | Épocas: {parameters.epochs}
          </Chip>
        </div>
      </CardBody>
    </Card>
  );
};
