import React from "react";
import { Card, CardBody, CardHeader, Divider, Button, Slider, Tooltip } from "@heroui/react";
import { Sparkles, Gauge, Target, Repeat, RotateCcw, Info, Lightbulb } from "lucide-react";
import { MlpParameters } from "../../types/mlp";

export interface HyperparametersProps {
  parameters: MlpParameters;
  onChange: (updated: Partial<MlpParameters>) => void;
  onReset?: () => void;
}

export const Hyperparameters: React.FC<HyperparametersProps> = ({
  parameters,
  onChange,
  onReset,
}) => {
  const { learningRate, errorValue, epochs } = parameters;

  return (
    <Card className="border border-purple-100/80 dark:border-purple-950/40 bg-white/80 dark:bg-content1/60 backdrop-blur-md shadow-sm rounded-2xl">
      <CardHeader className="flex items-center justify-between gap-3 pb-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Gauge className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold">Hiperparâmetros de Treinamento</h3>
            <p className="text-xs text-default-500">
              Ajuste a velocidade de convergência e os limites de parada da retropropagação
            </p>
          </div>
        </div>

        {onReset && (
          <Button
            size="sm"
            variant="flat"
            color="default"
            onClick={onReset}
            startContent={<RotateCcw className="h-3.5 w-3.5" />}
            className="text-xs rounded-lg"
          >
            Padrões
          </Button>
        )}
      </CardHeader>
      <Divider />
      <CardBody className="p-4 sm:p-5 space-y-5">
        {/* Educational Callout */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 text-xs text-amber-900 dark:text-amber-200">
          <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <span className="font-semibold">Regra Prática:</span> Comece com Taxa de Aprendizado em <strong>0.1</strong> e Erro Mínimo em <strong>0.01</strong>. Se a curva de aprendizado demorar a cair, aumente levemente a taxa (ex: 0.2). Se oscilar descontroladamente, reduza (ex: 0.05).
          </p>
        </div>

        {/* Learning Rate (eta) */}
        <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-900/30 border border-slate-200/70 dark:border-slate-800/60 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <label className="text-xs font-bold text-foreground">
                Taxa de Aprendizado (<span className="font-serif italic">&eta;</span>)
              </label>
              <Tooltip content="Controla o tamanho do passo no gradiente negativo. Valor ideal: 0.05 a 0.3.">
                <Info className="h-3.5 w-3.5 text-default-400 cursor-pointer" />
              </Tooltip>
            </div>
            <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200/60 dark:border-amber-900/40">
              {learningRate.toFixed(3)}
            </span>
          </div>

          <div className="py-1">
            <Slider
              aria-label="Taxa de Aprendizado"
              size="sm"
              step={0.005}
              minValue={0.01}
              maxValue={0.5}
              value={learningRate}
              onChange={(val) => {
                if (typeof val === "number") {
                  onChange({ learningRate: val });
                }
              }}
              color="warning"
              className="w-full"
            />
          </div>
          <p className="text-[11px] text-default-500 leading-relaxed">
            Passo do gradiente descendente. Valores menores evitam oscilações; maiores aprendem mais rápido.
          </p>
        </div>

        {/* Target Minimum Error */}
        <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-900/30 border border-slate-200/70 dark:border-slate-800/60 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Target className="h-4 w-4 text-rose-500" />
              <label className="text-xs font-bold text-foreground">
                Erro Mínimo Desejado (<span className="font-serif italic">E<sub>min</sub></span>)
              </label>
              <Tooltip content="Critério de parada antecipada. Quando o MSE ficar abaixo disso, o treino finaliza com sucesso.">
                <Info className="h-3.5 w-3.5 text-default-400 cursor-pointer" />
              </Tooltip>
            </div>
            <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md border border-rose-200/60 dark:border-rose-900/40">
              {errorValue.toFixed(4)}
            </span>
          </div>

          <div className="py-1">
            <Slider
              aria-label="Erro Mínimo Desejado"
              size="sm"
              step={0.001}
              minValue={0.001}
              maxValue={0.1}
              value={errorValue}
              onChange={(val) => {
                if (typeof val === "number") {
                  onChange({ errorValue: val });
                }
              }}
              color="danger"
              className="w-full"
            />
          </div>
          <p className="text-[11px] text-default-500 leading-relaxed">
            Limiar de convergência. Quanto menor, mais rigorosa a precisão exigida da rede.
          </p>
        </div>

        {/* Maximum Epochs */}
        <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-900/30 border border-slate-200/70 dark:border-slate-800/60 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Repeat className="h-4 w-4 text-sky-500" />
              <label className="text-xs font-bold text-foreground">
                Máximo de Épocas
              </label>
              <Tooltip content="Número máximo de passagens completas pelo dataset.">
                <Info className="h-3.5 w-3.5 text-default-400 cursor-pointer" />
              </Tooltip>
            </div>
            <span className="text-xs font-mono font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 px-2 py-0.5 rounded-md border border-sky-200/60 dark:border-sky-900/40">
              {epochs.toLocaleString()} épocas
            </span>
          </div>

          <div className="py-1">
            <Slider
              aria-label="Máximo de Épocas"
              size="sm"
              step={100}
              minValue={100}
              maxValue={5000}
              value={epochs}
              onChange={(val) => {
                if (typeof val === "number") {
                  onChange({ epochs: val });
                }
              }}
              color="primary"
              className="w-full"
            />
          </div>
          <p className="text-[11px] text-default-500 leading-relaxed">
            Limite máximo de iterações para evitar loops infinitos caso a rede não convirja.
          </p>
        </div>
      </CardBody>
    </Card>
  );
};
