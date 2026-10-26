import React from "react";
import { Card, CardBody, CardHeader, Divider, Input, Button, Tooltip } from "@heroui/react";
import { Sparkles, Gauge, Target, Repeat, RotateCcw, Info } from "lucide-react";
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
    <Card className="border border-default-200/50 bg-content1/60 backdrop-blur-md shadow-sm">
      <CardHeader className="flex items-center justify-between gap-3 pb-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-warning/10 text-warning">
            <Gauge className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold">Hiperparâmetros de Treinamento</h3>
            <p className="text-xs text-default-500">
              Configure critérios de convergência, taxa de aprendizado e limite de épocas
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
            className="text-xs"
          >
            Restaurar Padrões
          </Button>
        )}
      </CardHeader>
      <Divider />
      <CardBody className="p-4 sm:p-5 space-y-4">
        {/* Learning Rate */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <label className="text-xs font-semibold text-foreground">
                Taxa de Aprendizado (<span className="font-serif italic">&eta;</span>)
              </label>
              <Tooltip content="Tamanho do passo no sentido do gradiente negativo durante a atualização dos pesos via backpropagation. Recomendado: 0.05 - 0.3.">
                <Info className="h-3 w-3 text-default-400 cursor-pointer" />
              </Tooltip>
            </div>
            <span className="text-[10px] text-default-500 font-mono">0.001 - 1.0</span>
          </div>
          <Input
            type="number"
            size="sm"
            step="0.01"
            min={0.001}
            max={1.0}
            value={learningRate.toString()}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (!Number.isNaN(val) && val > 0) {
                onChange({ learningRate: val });
              }
            }}
            startContent={<Sparkles className="h-3.5 w-3.5 text-warning" />}
            description="Multiplicador do passo no gradiente descendente"
          />
        </div>

        {/* Target Minimum Error */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <label className="text-xs font-semibold text-foreground">
                Erro Mínimo Desejado (<span className="font-serif italic">E<sub>min</sub></span>)
              </label>
              <Tooltip content="Critério de parada antecipada. Quando o erro médio por amostra cair abaixo deste valor, o treino finaliza com sucesso. Recomendado: 0.01 - 0.03.">
                <Info className="h-3 w-3 text-default-400 cursor-pointer" />
              </Tooltip>
            </div>
            <span className="text-[10px] text-default-500 font-mono">0.0001 - 0.5</span>
          </div>
          <Input
            type="number"
            size="sm"
            step="0.005"
            min={0.0001}
            max={0.5}
            value={errorValue.toString()}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (!Number.isNaN(val) && val > 0) {
                onChange({ errorValue: val });
              }
            }}
            startContent={<Target className="h-3.5 w-3.5 text-danger" />}
            description="Limiar de parada para convergência antecipada"
          />
        </div>

        {/* Maximum Epochs */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <label className="text-xs font-semibold text-foreground">Máximo de Épocas</label>
              <Tooltip content="Limite máximo de passagens completas pelo dataset de treino. O SignalR emite eventos em tempo real ao longo dessa execução.">
                <Info className="h-3 w-3 text-default-400 cursor-pointer" />
              </Tooltip>
            </div>
            <span className="text-[10px] text-default-500 font-mono">10 - 10000</span>
          </div>
          <Input
            type="number"
            size="sm"
            step="100"
            min={10}
            max={10000}
            value={epochs.toString()}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (!Number.isNaN(val) && val >= 1) {
                onChange({ epochs: val });
              }
            }}
            startContent={<Repeat className="h-3.5 w-3.5 text-primary" />}
            description="Número máximo de iterações de treino"
          />
        </div>
      </CardBody>
    </Card>
  );
};
