import React, { useState } from "react";
import { Card, CardBody, CardHeader, Divider, Input, Button, Chip, Tooltip } from "@heroui/react";
import { Cpu, Info, Plus, Minus, ChevronDown, ChevronUp, Lightbulb } from "lucide-react";
import { MlpParameters } from "../../types/mlp";

export interface TopologyPanelProps {
  parameters: MlpParameters;
  onChange: (updated: Partial<MlpParameters>) => void;
  datasetInputCount?: number;
  datasetOutputCount?: number;
}

/**
 * Interactive SVG diagram displaying actual neuron circles and connections
 */
const NetworkDiagram: React.FC<{
  inputCount: number;
  hiddenCount: number;
  outputCount: number;
}> = ({ inputCount, hiddenCount, outputCount }) => {
  const maxDisplay = 5;

  const clampNodes = (count: number) => {
    const visible = Math.min(count, maxDisplay);
    return Array.from({ length: visible }, (_, i) => ({
      id: i,
      isMore: count > maxDisplay && i === maxDisplay - 1,
    }));
  };

  const inputNodes = clampNodes(inputCount);
  const hiddenNodes = clampNodes(hiddenCount);
  const outputNodes = clampNodes(outputCount);

  const height = 150;
  const width = 320;
  const xInput = 40;
  const xHidden = 160;
  const xOutput = 280;

  const getY = (index: number, total: number) => {
    const spacing = height / (total + 1);
    return spacing * (index + 1);
  };

  return (
    <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-purple-50/40 dark:bg-purple-950/20 border border-purple-100/80 dark:border-purple-900/40">
      <div className="w-full flex items-center justify-between pb-2 text-[11px] font-semibold text-default-500 uppercase tracking-wider">
        <span>Diagrama da Arquitetura</span>
        <Chip size="sm" color="secondary" variant="flat" className="h-5 text-[10px]">
          {inputCount} × {hiddenCount} × {outputCount}
        </Chip>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full max-w-[340px] h-36 overflow-visible select-none"
      >
        {/* Connection Lines: Input to Hidden */}
        {inputNodes.map((_, i) => {
          const yIn = getY(i, inputNodes.length);
          return hiddenNodes.map((_, j) => {
            const yH = getY(j, hiddenNodes.length);
            return (
              <line
                key={`in-${i}-h-${j}`}
                x1={xInput}
                y1={yIn}
                x2={xHidden}
                y2={yH}
                stroke="#a855f7"
                strokeOpacity={0.18}
                strokeWidth={1.2}
              />
            );
          });
        })}

        {/* Connection Lines: Hidden to Output */}
        {hiddenNodes.map((_, i) => {
          const yH = getY(i, hiddenNodes.length);
          return outputNodes.map((_, j) => {
            const yOut = getY(j, outputNodes.length);
            return (
              <line
                key={`h-${i}-out-${j}`}
                x1={xHidden}
                y1={yH}
                x2={xOutput}
                y2={yOut}
                stroke="#10b981"
                strokeOpacity={0.18}
                strokeWidth={1.2}
              />
            );
          });
        })}

        {/* Input Nodes */}
        {inputNodes.map((node, i) => {
          const y = getY(i, inputNodes.length);
          return (
            <g key={`node-in-${i}`}>
              <circle
                cx={xInput}
                cy={y}
                r={node.isMore ? 8 : 10}
                className="fill-sky-500 stroke-sky-200 dark:stroke-sky-800"
                strokeWidth={2}
              />
              <text
                x={xInput}
                y={y + 3}
                textAnchor="middle"
                className="fill-white font-mono text-[9px] font-bold pointer-events-none"
              >
                {node.isMore ? "..." : `x${i + 1}`}
              </text>
            </g>
          );
        })}

        {/* Hidden Nodes */}
        {hiddenNodes.map((node, i) => {
          const y = getY(i, hiddenNodes.length);
          return (
            <g key={`node-h-${i}`}>
              <circle
                cx={xHidden}
                cy={y}
                r={node.isMore ? 8 : 10}
                className="fill-purple-600 stroke-purple-200 dark:stroke-purple-800"
                strokeWidth={2}
              />
              <text
                x={xHidden}
                y={y + 3}
                textAnchor="middle"
                className="fill-white font-mono text-[9px] font-bold pointer-events-none"
              >
                {node.isMore ? "..." : `h${i + 1}`}
              </text>
            </g>
          );
        })}

        {/* Output Nodes */}
        {outputNodes.map((node, i) => {
          const y = getY(i, outputNodes.length);
          return (
            <g key={`node-out-${i}`}>
              <circle
                cx={xOutput}
                cy={y}
                r={node.isMore ? 8 : 10}
                className="fill-emerald-600 stroke-emerald-200 dark:stroke-emerald-800"
                strokeWidth={2}
              />
              <text
                x={xOutput}
                y={y + 3}
                textAnchor="middle"
                className="fill-white font-mono text-[9px] font-bold pointer-events-none"
              >
                {node.isMore ? "..." : `y${i + 1}`}
              </text>
            </g>
          );
        })}

        {/* Column Labels */}
        <text
          x={xInput}
          y={height - 2}
          textAnchor="middle"
          className="fill-sky-700 dark:fill-sky-300 font-semibold text-[10px]"
        >
          Entrada
        </text>
        <text
          x={xHidden}
          y={height - 2}
          textAnchor="middle"
          className="fill-purple-700 dark:fill-purple-300 font-semibold text-[10px]"
        >
          Oculta
        </text>
        <text
          x={xOutput}
          y={height - 2}
          textAnchor="middle"
          className="fill-emerald-700 dark:fill-emerald-300 font-semibold text-[10px]"
        >
          Saída
        </text>
      </svg>
    </div>
  );
};

export const TopologyPanel: React.FC<TopologyPanelProps> = ({
  parameters,
  onChange,
  datasetInputCount: _datasetInputCount,
  datasetOutputCount: _datasetOutputCount,
}) => {
  const { inputLayer, hiddenLayer, outputLayer, firstClassColumn } = parameters;
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleHiddenChange = (delta: number) => {
    const nextVal = Math.max(1, Math.min(64, hiddenLayer + delta));
    onChange({ hiddenLayer: nextVal });
  };

  return (
    <Card className="border border-purple-100/80 dark:border-purple-950/40 bg-white/80 dark:bg-content1/60 backdrop-blur-md shadow-sm rounded-2xl">
      <CardHeader className="flex gap-3 pb-2">
        <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
          <Cpu className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-semibold">Arquitetura e Topologia da Rede</h3>
          <p className="text-xs text-default-500">
            Defina o número de neurônios da camada oculta e revise as camadas conectadas
          </p>
        </div>
      </CardHeader>
      <Divider />
      <CardBody className="p-4 sm:p-5 space-y-5">
        {/* Visual Layer Architecture Diagram */}
        <NetworkDiagram
          inputCount={inputLayer}
          hiddenCount={hiddenLayer}
          outputCount={outputLayer}
        />

        {/* Educational Tip */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-purple-50/70 dark:bg-purple-950/20 border border-purple-200/50 dark:border-purple-900/30 text-xs text-purple-900 dark:text-purple-200">
          <Lightbulb className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <span className="font-semibold">Dica de Aprendizado:</span> As camadas de <strong>Entrada</strong> e <strong>Saída</strong> são definidas automaticamente pelo dataset. O seu principal ajuste aqui são os <strong>Neurônios Ocultos</strong>: comece com um valor entre a entrada e o dobro de entradas.
          </p>
        </div>

        {/* Neurons Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Input Neurons (Read-only / Synced with Dataset) */}
          <div className="p-3.5 rounded-2xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-200/60 dark:border-sky-900/40 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-sky-900 dark:text-sky-200">
                Entradas
              </span>
              <Chip size="sm" color="primary" variant="flat" className="h-5 text-[10px] px-1.5 font-semibold">
                Auto ({inputLayer})
              </Chip>
            </div>
            <div className="flex items-center justify-center h-10 rounded-xl bg-white/80 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/40">
              <span className="font-mono font-extrabold text-xl text-sky-700 dark:text-sky-300">
                {inputLayer}
              </span>
            </div>
            <span className="text-[10px] text-default-500 text-center block">Atributos do dataset</span>
          </div>

          {/* Hidden Neurons (Interactive Stepper) */}
          <div className="p-3.5 rounded-2xl bg-purple-50/60 dark:bg-purple-950/25 border-2 border-purple-300 dark:border-purple-700/60 shadow-sm flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-950 dark:text-purple-100">
                Camada Oculta
              </span>
              <span className="text-[10px] font-mono font-bold text-purple-700 dark:text-purple-300 uppercase">
                Ajustável
              </span>
            </div>
            <div className="flex items-center gap-2 h-10 px-1 rounded-xl bg-white/80 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/40">
              <Button
                isIconOnly
                size="sm"
                variant="flat"
                color="secondary"
                onClick={() => handleHiddenChange(-1)}
                disabled={hiddenLayer <= 1}
                aria-label="Diminuir neurônios ocultos"
                className="h-8 w-8 min-w-8 rounded-lg"
              >
                <Minus className="h-3.5 w-3.5" />
              </Button>
              <span className="flex-1 text-center font-mono font-extrabold text-xl text-purple-800 dark:text-purple-200">
                {hiddenLayer}
              </span>
              <Button
                isIconOnly
                size="sm"
                variant="flat"
                color="secondary"
                onClick={() => handleHiddenChange(1)}
                disabled={hiddenLayer >= 64}
                aria-label="Aumentar neurônios ocultos"
                className="h-8 w-8 min-w-8 rounded-lg"
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
            <span className="text-[10px] text-default-500 text-center block">Neurônios de processamento</span>
          </div>

          {/* Output Neurons (Read-only / Synced with Dataset) */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                Saídas
              </span>
              <Chip size="sm" color="success" variant="flat" className="h-5 text-[10px] px-1.5 font-semibold">
                Auto ({outputLayer})
              </Chip>
            </div>
            <div className="flex items-center justify-center h-10 rounded-xl bg-white/80 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40">
              <span className="font-mono font-extrabold text-xl text-emerald-700 dark:text-emerald-300">
                {outputLayer}
              </span>
            </div>
            <span className="text-[10px] text-default-500 text-center block">Classes One-Hot</span>
          </div>
        </div>

        {/* Advanced Options Accordion (Hiding firstClassColumn for beginners) */}
        <div className="border-t border-default-200/40 pt-2">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center justify-between w-full py-1.5 text-xs font-semibold text-default-500 hover:text-default-700 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <span>Opções Avançadas de Topologia</span>
              <span className="text-[10px] font-normal text-default-400">
                (Índice de colunas One-Hot)
              </span>
            </span>
            {showAdvanced ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>

          {showAdvanced && (
            <div className="pt-3 pb-1 space-y-2">
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-1">
                  <label className="text-xs font-semibold text-foreground">
                    Índice da 1ª Coluna de Classe
                  </label>
                  <Tooltip content="Posição no vetor (base zero) onde iniciam as classes One-Hot. Calculado automaticamente como igual ao número de entradas.">
                    <Info className="h-3.5 w-3.5 text-default-400 cursor-pointer" />
                  </Tooltip>
                </div>
                <span className="text-[10px] text-default-500 font-mono">
                  Índice configurado: {firstClassColumn}
                </span>
              </div>
              <Input
                type="number"
                size="sm"
                min={0}
                value={firstClassColumn.toString()}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!Number.isNaN(val) && val >= 0) {
                    onChange({ firstClassColumn: val });
                  }
                }}
                startContent={<span className="text-xs font-mono text-default-400">#</span>}
                description="Altere apenas caso o CSV possua atributos intercalados de forma não-padrão"
              />
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
};
