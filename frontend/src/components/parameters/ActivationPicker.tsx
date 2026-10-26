import React from "react";
import { Card, CardBody, CardHeader, Divider, Chip } from "@heroui/react";
import { Activity, Check } from "lucide-react";
import { ActivationFunction } from "../../types/mlp";

export interface ActivationPickerProps {
  selectedFunction: ActivationFunction;
  onSelect: (fn: ActivationFunction) => void;
}

interface ActivationOption {
  id: ActivationFunction;
  name: string;
  subtitle: string;
  formula: string;
  derivative: string;
  range: string;
  description: string;
  color: "primary" | "secondary" | "success";
}

const ACTIVATION_OPTIONS: ActivationOption[] = [
  {
    id: "Logistica",
    name: "Logística (Sigmoide)",
    subtitle: "Não-linearidade Suave Padrão",
    formula: "f(x) = 1 / (1 + e⁻ˣ)",
    derivative: "f'(y) = y · (1 - y)",
    range: "[0.0, 1.0]",
    description: "Ideal para saídas binárias e multiclasse com codificação one-hot. Valores estritamente entre 0 e 1.",
    color: "primary",
  },
  {
    id: "Hiperbolica",
    name: "Hiperbólica (Tanh)",
    subtitle: "Curva em S Centrada no Zero",
    formula: "f(x) = tanh(x)",
    derivative: "f'(y) = 1 - y²",
    range: "[-1.0, 1.0]",
    description: "Centrada em zero com gradientes mais fortes próximos à origem, reduzindo o deslocamento de viés.",
    color: "secondary",
  },
  {
    id: "Linear",
    name: "Linear",
    subtitle: "Escala Proporcional Identidade",
    formula: "f(x) = x / 10",
    derivative: "f'(y) = 0.1",
    range: "(-∞, +∞)",
    description: "Ativação linear escalonada fornecendo gradientes constantes para problemas de regressão.",
    color: "success",
  },
];

export const ActivationPicker: React.FC<ActivationPickerProps> = ({
  selectedFunction,
  onSelect,
}) => {
  return (
    <Card className="border border-default-200/50 bg-content1/60 backdrop-blur-md shadow-sm">
      <CardHeader className="flex gap-3 pb-2">
        <div className="p-2 rounded-lg bg-secondary/10 text-secondary">
          <Activity className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-semibold">Função de Ativação (Função de Transferência)</h3>
          <p className="text-xs text-default-500">
            Selecione a não-linearidade matemática aplicada nas camadas oculta e de saída
          </p>
        </div>
      </CardHeader>
      <Divider />
      <CardBody className="p-4 sm:p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ACTIVATION_OPTIONS.map((opt) => {
            const isSelected = selectedFunction === opt.id;

            return (
              <div
                key={opt.id}
                onClick={() => onSelect(opt.id)}
                className={`relative flex flex-col justify-between p-4 rounded-2xl border cursor-pointer transition-all duration-200 select-none ${
                  isSelected
                    ? "border-primary bg-primary/10 shadow-md ring-2 ring-primary/40 scale-[1.01]"
                    : "border-default-200/60 bg-content2/30 hover:border-default-400 hover:bg-content2/50"
                }`}
              >
                {/* Header: Name and Checkmark */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-foreground">{opt.name}</span>
                    {isSelected && (
                      <div className="p-1 rounded-full bg-primary text-primary-foreground shadow-sm">
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-default-500">{opt.subtitle}</p>
                </div>

                {/* Mathematical Formula Preview */}
                <div className="my-3 p-2.5 rounded-xl bg-content1/80 border border-default-200/50 font-mono text-center space-y-1">
                  <p className="text-xs font-semibold text-primary">{opt.formula}</p>
                  <p className="text-[10px] text-default-500">Derivada: {opt.derivative}</p>
                </div>

                {/* Footer: Output Range and Description */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-default-500 font-medium">Intervalo de Saída:</span>
                    <Chip size="sm" variant="flat" color={opt.color} className="h-5 text-[10px]">
                      {opt.range}
                    </Chip>
                  </div>
                  <p className="text-[11px] text-default-600 leading-tight">
                    {opt.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
};
