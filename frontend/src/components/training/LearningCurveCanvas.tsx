/**
 * Component: LearningCurveCanvas
 *
 * Real-time 60 FPS learning curve visualizer powered by Chart.js & HTML5 Canvas:
 * - Dual-tier requestAnimationFrame (RAF) batching to eliminate React render overhead.
 * - In-memory decimation buffer capping rendering points without frame drops.
 * - Adaptive dark / light mode theming.
 * - Native inline Chart.js plugin drawing target minimum error dashed reference line (E_min).
 * - Comprehensive cleanup preventing canvas memory leaks.
 */

import React, { useEffect, useRef, useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
  Plugin,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { Card, CardBody, CardHeader, Chip } from "@heroui/react";
import { LineChart, Activity, Target, Zap } from "lucide-react";
import { EpochProgress } from "../../types/mlp";
import { LearningCurveDataBuffer } from "../../utils/learningCurveBuffer";

// Register necessary Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export interface LearningCurveCanvasProps {
  epochProgress: EpochProgress[];
  targetError?: number;
  maxEpochs?: number;
  isDark?: boolean;
  isTraining?: boolean;
}

export const LearningCurveCanvas: React.FC<LearningCurveCanvasProps> = ({
  epochProgress,
  targetError = 0.01,
  maxEpochs = 1000,
  isDark = true,
  isTraining = false,
}) => {
  const chartRef = useRef<any>(null);
  const bufferRef = useRef<LearningCurveDataBuffer>(new LearningCurveDataBuffer(500));
  const rafIdRef = useRef<number | null>(null);
  const lastRenderedIndexRef = useRef<number>(0);

  // Sync buffer with incoming epoch progress stream
  useEffect(() => {
    const buffer = bufferRef.current;

    // Detect reset if incoming array is empty
    if (epochProgress.length === 0) {
      buffer.reset();
      lastRenderedIndexRef.current = 0;
      if (chartRef.current) {
        chartRef.current.data.labels = [];
        chartRef.current.data.datasets[0].data = [];
        chartRef.current.update("none");
      }
      return;
    }

    // Append new points incrementally
    for (let i = lastRenderedIndexRef.current; i < epochProgress.length; i++) {
      const item = epochProgress[i];
      const err = item.avarageError ?? item.averageError ?? 0;
      buffer.addPoint(item.epoch, err);
    }
    lastRenderedIndexRef.current = epochProgress.length;

    // Schedule 60 FPS update via requestAnimationFrame
    if (!rafIdRef.current) {
      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null;
        if (!chartRef.current) return;

        const points = buffer.getPoints();
        const chart = chartRef.current;

        chart.data.labels = points.map((p) => p.epoch);
        chart.data.datasets[0].data = points.map((p) => p.error);

        // 'none' mode prevents slow animation rebuilds and guarantees crisp 60 FPS motion
        chart.update("none");
      });
    }

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [epochProgress]);

  // Target Emin horizontal line inline plugin
  const targetLinePlugin: Plugin = useMemo(
    () => ({
      id: "targetErrorLine",
      afterDraw: (chart) => {
        if (targetError == null || targetError <= 0) return;
        const {
          ctx,
          chartArea: { left, right, top, bottom },
          scales: { y },
        } = chart;

        if (!y) return;

        const yPos = y.getPixelForValue(targetError);
        if (yPos < top || yPos > bottom) return;

        ctx.save();
        ctx.beginPath();
        ctx.setLineDash([6, 6]);
        ctx.strokeStyle = isDark ? "#f59e0b" : "#d97706"; // Amber
        ctx.lineWidth = 1.5;
        ctx.moveTo(left, yPos);
        ctx.lineTo(right, yPos);
        ctx.stroke();

        // Target badge
        const labelText = `E_min: ${targetError}`;
        ctx.font = "600 10px Inter, sans-serif";
        const textWidth = ctx.measureText(labelText).width;
        const badgeX = right - textWidth - 14;
        const badgeY = yPos - 16;

        ctx.fillStyle = isDark ? "rgba(30, 41, 59, 0.9)" : "rgba(254, 243, 199, 0.95)";
        ctx.strokeStyle = isDark ? "#f59e0b" : "#d97706";
        ctx.lineWidth = 1;
        ctx.beginPath();
        if (typeof ctx.roundRect === "function") {
          ctx.roundRect(badgeX, badgeY, textWidth + 10, 14, 4);
        } else {
          ctx.rect(badgeX, badgeY, textWidth + 10, 14);
        }
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isDark ? "#fbbf24" : "#b45309";
        ctx.fillText(labelText, badgeX + 5, badgeY + 10);
        ctx.restore();
      },
    }),
    [targetError, isDark]
  );

  // Theme-aware Chart.js configuration
  const chartOptions: ChartOptions<"line"> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: false, // Essential for high-frequency streaming
      interaction: {
        mode: "index",
        intersect: false,
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          enabled: true,
          backgroundColor: isDark ? "rgba(15, 23, 42, 0.95)" : "rgba(255, 255, 255, 0.95)",
          titleColor: isDark ? "#f8fafc" : "#0f172a",
          bodyColor: isDark ? "#cbd5e1" : "#334155",
          borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
          borderWidth: 1,
          padding: 10,
          displayColors: false,
          callbacks: {
            title: (items) => `Época ${items[0]?.label}`,
            label: (item) => `Erro Médio: ${Number(item.raw).toFixed(6)}`,
          },
        },
      },
      scales: {
        x: {
          suggestedMax: maxEpochs,
          grid: {
            color: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
          },
          ticks: {
            color: isDark ? "#94a3b8" : "#64748b",
            font: { family: "Inter, sans-serif", size: 11 },
            maxTicksLimit: 10,
          },
          title: {
            display: true,
            text: "Épocas",
            color: isDark ? "#94a3b8" : "#64748b",
            font: { size: 12, weight: "bold" },
          },
        },
        y: {
          min: 0,
          grid: {
            color: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
          },
          ticks: {
            color: isDark ? "#94a3b8" : "#64748b",
            font: { family: "Inter, sans-serif", size: 11 },
            callback: (val) => Number(val).toFixed(3),
          },
          title: {
            display: true,
            text: "Erro Médio (Loss)",
            color: isDark ? "#94a3b8" : "#64748b",
            font: { size: 12, weight: "bold" },
          },
        },
      },
    }),
    [isDark, maxEpochs]
  );

  const initialData = useMemo(
    () => ({
      labels: [],
      datasets: [
        {
          label: "Erro Médio",
          data: [],
          borderColor: isDark ? "#6366f1" : "#4f46e5",
          backgroundColor: isDark ? "rgba(99, 102, 241, 0.15)" : "rgba(79, 70, 229, 0.1)",
          fill: true,
          tension: 0.25,
          borderWidth: 2,
          pointRadius: 0, // Zero radius during streaming prevents drawing thousands of circles
          pointHoverRadius: 4,
          pointHoverBackgroundColor: isDark ? "#818cf8" : "#4338ca",
        },
      ],
    }),
    [isDark]
  );

  const currentLoss =
    epochProgress.length > 0
      ? epochProgress[epochProgress.length - 1].avarageError ??
        epochProgress[epochProgress.length - 1].averageError ??
        0
      : null;

  return (
    <Card className="border border-amber-200/80 dark:border-amber-950/40 bg-white/80 dark:bg-content1/70 backdrop-blur-md shadow-sm rounded-2xl">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <LineChart className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold tracking-tight">Curva de Aprendizado (Loss Curve)</h3>
              {isTraining && (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              )}
            </div>
            <p className="text-xs text-default-500">
              Taxa de erro quadrático médio (MSE) por época transmitida a 60 FPS
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Chip
            size="sm"
            variant="flat"
            color="warning"
            startContent={<Target className="h-3 w-3 ml-1" />}
          >
            Meta E_min: {targetError}
          </Chip>
          {currentLoss !== null && (
            <Chip
              size="sm"
              variant="flat"
              color={currentLoss <= targetError ? "success" : "primary"}
              startContent={<Activity className="h-3 w-3 ml-1" />}
            >
              Erro Atual: {currentLoss.toFixed(5)}
            </Chip>
          )}
          <Chip
            size="sm"
            variant="dot"
            color={isTraining ? "success" : "default"}
            startContent={<Zap className="h-3 w-3" />}
          >
            {isTraining ? "60 FPS Streaming" : "Pronto"}
          </Chip>
        </div>
      </CardHeader>

      <CardBody className="pt-2 pb-6 px-4">
        <div className="w-full h-[360px] sm:h-[400px] relative">
          {epochProgress.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center space-y-3 z-10 bg-content1/30 backdrop-blur-[2px] rounded-2xl border border-dashed border-default-200">
              <div className="p-3.5 rounded-full bg-primary/10 text-primary animate-pulse">
                <LineChart className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  Aguardando início do treinamento
                </p>
                <p className="text-xs text-default-500 max-w-sm">
                  Os pontos de perda por época serão renderizados em tempo real conforme transmitidos pelo SignalR.
                </p>
              </div>
            </div>
          ) : null}

          <Line
            ref={chartRef}
            data={initialData}
            options={chartOptions}
            plugins={[targetLinePlugin]}
          />
        </div>
      </CardBody>
    </Card>
  );
};
