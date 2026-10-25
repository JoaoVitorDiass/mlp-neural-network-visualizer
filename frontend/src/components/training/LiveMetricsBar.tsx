/**
 * Component: LiveMetricsBar
 *
 * Displays live training metrics and visual progress:
 * - 4 Responsive KPI Metric Cards (Epochs, Current Error, Error Reduction %, Elapsed Timer).
 * - Animated HeroUI Progress bar reflecting training progress.
 * - Dynamic color status and convergence indicators.
 */

import React, { useEffect, useState } from "react";
import { Card, CardBody, Progress, Chip } from "@heroui/react";
import {
  Layers,
  Target,
  TrendingDown,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { calculateLiveMetrics, formatTimer } from "../../utils/metricsCalculator";
import { TrainingStatus } from "../../types/mlp";

export interface LiveMetricsBarProps {
  currentEpoch: number;
  maxEpochs: number;
  currentError: number;
  initialError: number;
  targetError: number;
  status: TrainingStatus;
  startTime: number | null;
}

export const LiveMetricsBar: React.FC<LiveMetricsBarProps> = ({
  currentEpoch,
  maxEpochs,
  currentError,
  initialError,
  targetError,
  status,
  startTime,
}) => {
  const [nowMs, setNowMs] = useState<number>(Date.now());

  // Active training timer ticker
  useEffect(() => {
    if (status !== "training" || !startTime) return;

    const interval = setInterval(() => {
      setNowMs(Date.now());
    }, 50); // 20 Hz update frequency for smooth sub-second counter

    return () => clearInterval(interval);
  }, [status, startTime]);

  const metrics = calculateLiveMetrics({
    currentEpoch,
    maxEpochs,
    initialError,
    currentError,
    startTimeMs: startTime ?? Date.now(),
    nowMs: status === "training" ? nowMs : startTime ? nowMs : Date.now(),
  });

  const isCompleted = status === "completed";
  const isTraining = status === "training";
  const isStopped = status === "stopped";
  const isError = status === "error";
  const isConverged = currentError <= targetError && currentError > 0;

  return (
    <div className="space-y-4">
      {/* 4 Responsive KPI Metric Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tile 1: Epochs */}
        <Card className="border border-default-200/50 bg-content1/60 backdrop-blur-md shadow-sm">
          <CardBody className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-default-500 uppercase tracking-wider">
                Épocas
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold font-mono tracking-tight text-foreground">
                  {currentEpoch.toLocaleString()}
                </span>
                <span className="text-xs text-default-400 font-mono">
                  / {maxEpochs.toLocaleString()}
                </span>
              </div>
              <p className="text-[11px] text-default-500">
                {metrics.progressPercentage.toFixed(1)}% concluído
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-primary/10 text-primary">
              <Layers className="h-6 w-6" />
            </div>
          </CardBody>
        </Card>

        {/* Tile 2: Current Average Error */}
        <Card className="border border-default-200/50 bg-content1/60 backdrop-blur-md shadow-sm">
          <CardBody className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-default-500 uppercase tracking-wider">
                Erro Médio
              </span>
              <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
                {currentError > 0 ? currentError.toFixed(5) : "—"}
              </div>
              <p className="text-[11px] text-default-500">
                Meta: <span className="font-mono">{targetError}</span>
              </p>
            </div>
            <div
              className={`p-3 rounded-2xl ${
                isConverged
                  ? "bg-success/10 text-success"
                  : "bg-warning/10 text-warning"
              }`}
            >
              <Target className="h-6 w-6" />
            </div>
          </CardBody>
        </Card>

        {/* Tile 3: Error Reduction */}
        <Card className="border border-default-200/50 bg-content1/60 backdrop-blur-md shadow-sm">
          <CardBody className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-default-500 uppercase tracking-wider">
                Redução de Erro
              </span>
              <div className="flex items-baseline gap-1.5">
                <span
                  className={`text-2xl font-bold font-mono tracking-tight ${
                    metrics.errorReductionPercentage > 0
                      ? "text-success"
                      : "text-foreground"
                  }`}
                >
                  {metrics.errorReductionPercentage > 0 ? "+" : ""}
                  {metrics.errorReductionPercentage.toFixed(2)}%
                </span>
              </div>
              <p className="text-[11px] text-default-500">
                Inicial:{" "}
                <span className="font-mono">
                  {initialError > 0 ? initialError.toFixed(4) : "—"}
                </span>
              </p>
            </div>
            <div
              className={`p-3 rounded-2xl ${
                metrics.errorReductionPercentage > 0
                  ? "bg-success/10 text-success"
                  : "bg-default-100 text-default-400"
              }`}
            >
              {metrics.errorReductionPercentage >= 0 ? (
                <TrendingDown className="h-6 w-6" />
              ) : (
                <TrendingUp className="h-6 w-6 text-danger" />
              )}
            </div>
          </CardBody>
        </Card>

        {/* Tile 4: Elapsed Timer */}
        <Card className="border border-default-200/50 bg-content1/60 backdrop-blur-md shadow-sm">
          <CardBody className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-default-500 uppercase tracking-wider">
                Tempo Decorrido
              </span>
              <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
                {formatTimer(metrics.elapsedSeconds)}
              </div>
              <div className="flex items-center gap-1.5 pt-0.5">
                {isTraining && (
                  <Chip size="sm" variant="flat" color="success" className="h-5 text-[10px]">
                    Ativo
                  </Chip>
                )}
                {isCompleted && (
                  <Chip size="sm" variant="flat" color="primary" className="h-5 text-[10px]">
                    Finalizado
                  </Chip>
                )}
                {isStopped && (
                  <Chip size="sm" variant="flat" color="warning" className="h-5 text-[10px]">
                    Interrompido
                  </Chip>
                )}
                {status === "idle" && (
                  <span className="text-[11px] text-default-400">Em espera</span>
                )}
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-secondary/10 text-secondary">
              <Clock className="h-6 w-6" />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Animated HeroUI Progress Bar */}
      <Card className="border border-default-200/50 bg-content1/60 backdrop-blur-md shadow-sm p-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-medium">
            <div className="flex items-center gap-2">
              {isTraining && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />}
              {isCompleted && <CheckCircle2 className="h-3.5 w-3.5 text-success" />}
              {isStopped && <AlertCircle className="h-3.5 w-3.5 text-warning" />}
              {isError && <AlertCircle className="h-3.5 w-3.5 text-danger" />}
              <span className="text-foreground">
                {status === "idle" && "Aguardando início do treinamento"}
                {status === "connecting" && "Conectando ao hub SignalR..."}
                {status === "training" &&
                  `Treinando rede neural... (${metrics.progressPercentage.toFixed(1)}%)`}
                {status === "completed" &&
                  (isConverged
                    ? "Treinamento Convergido com Sucesso!"
                    : "Treinamento Finalizado (Máx Épocas)")}
                {status === "stopped" && "Treinamento Interrompido pelo Usuário"}
                {status === "error" && "Erro durante execução"}
              </span>
            </div>
            <span className="font-mono text-default-600">
              {metrics.progressPercentage.toFixed(1)}%
            </span>
          </div>

          <Progress
            aria-label="Progresso do treinamento da MLP"
            value={metrics.progressPercentage}
            color={
              isCompleted
                ? isConverged
                  ? "success"
                  : "primary"
                : isError
                ? "danger"
                : isStopped
                ? "warning"
                : "primary"
            }
            size="md"
            radius="full"
            isStriped={isTraining}
            isIndeterminate={status === "connecting"}
            classNames={{
              base: "w-full",
              track: "bg-default-200/50 drop-shadow-sm",
              indicator:
                isCompleted && isConverged
                  ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                  : "bg-gradient-to-r from-primary-500 via-indigo-500 to-secondary-500",
            }}
          />
        </div>
      </Card>
    </div>
  );
};
