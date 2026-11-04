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
  badge?: string;
  pastelBorder: string;
  pastelBg: string;
  activeRing: string;
  chipColor: "primary" | "secondary" | "success";
}

const ACTIVATION_OPTIONS: ActivationOption[] = [
  {
    id: "Logistica",
    name: "Logística (Sigmoide)",
    subtitle: "Não-linearidade Suave Padrão",
    formula: "f(x) = 1 / (1 + e⁻ˣ)",
    derivative: "f'(y) = y · (1 - y)",
    range: "[0.0, 1.0]",
    badge: "Recomendada para Classificação",
    description: "Ideal para saídas binárias e multiclasse com codificação One-Hot. Valores estritamente entre 0 e 1.",
    pastelBorder: "border-sky-300 dark:border-sky-800",
    pastelBg: "bg-sky-50/70 dark:bg-sky-950/30",
    activeRing: "ring-2 ring-sky-400/40",
    chipColor: "primary",
  },
  {
    id: "Hiperbolica",
    name: "Hiperbólica (Tanh)",
    subtitle: "Curva em S Centrada no Zero",
    formula: "f(x) = tanh(x)",
    derivative: "f'(y) = 1 - y²",
    range: "[-1.0, 1.0]",
    description: "Centrada em zero com gradientes mais fortes próximos à origem, reduzindo o deslocamento de viés.",
    pastelBorder: "border-purple-300 dark:border-purple-800",
    pastelBg: "bg-purple-50/70 dark:bg-purple-950/30",
    activeRing: "ring-2 ring-purple-400/40",
    chipColor: "secondary",
  },
  {
    id: "Linear",
    name: "Linear",
    subtitle: "Escala Proporcional Identidade",
    formula: "f(x) = x / 10",
    derivative: "f'(y) = 0.1",
    range: "(-∞, +∞)",
    description: "Ativação linear escalonada fornecendo gradientes constantes para problemas contínuos de regressão.",
    pastelBorder: "border-emerald-300 dark:border-emerald-800",
    pastelBg: "bg-emerald-50/70 dark:bg-emerald-950/30",
    activeRing: "ring-2 ring-emerald-400/40",
    chipColor: "success",
  },
];

export const ActivationPicker: React.FC<ActivationPickerProps> = ({
  selectedFunction,
  onSelect,
}) => {
  return (
    <Card className="border border-purple-100/80 dark:border-purple-950/40 bg-white/80 dark:bg-content1/60 backdrop-blur-md shadow-sm rounded-2xl">
      <CardHeader className="flex gap-3 pb-2">
        <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
          <Activity className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-semibold">Função de Ativação (Função de Transferência)</h3>
          <p className="text-xs text-default-500">
            Selecione a não-linearidade matemática que transforma a soma ponderada dos neurônios
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
                className={`relative flex flex-col justify-between p-4 sm:p-5 rounded-2xl border cursor-pointer transition-all duration-200 select-none ${
                  isSelected
                    ? `${opt.pastelBorder} ${opt.pastelBg} ${opt.activeRing} shadow-sm scale-[1.01]`
                    : "border-default-200/60 bg-content2/30 hover:border-purple-300 hover:bg-content2/50"
                }`}
              >
                {/* Header: Name and Checkmark */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-foreground">{opt.name}</span>
                    {isSelected && (
                      <div className="p-1 rounded-full bg-purple-600 text-white shadow-sm">
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                  </div>
                  {opt.badge && (
                    <Chip size="sm" color="primary" variant="flat" className="h-5 text-[10px]">
                      {opt.badge}
                    </Chip>
                  )}
                  <p className="text-[11px] text-default-500">{opt.subtitle}</p>
                </div>

                {/* Mathematical Formula Preview */}
                <div className="my-3 p-3 rounded-xl bg-content1/90 border border-default-200/60 font-mono text-center space-y-1">
                  <p className="text-xs font-bold text-foreground">{opt.formula}</p>
                  <p className="text-[10px] text-default-500">Derivada: {opt.derivative}</p>
                </div>

                {/* Footer: Output Range and Description */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-default-500 font-medium">Intervalo de Saída:</span>
                    <Chip size="sm" variant="flat" color={opt.chipColor} className="h-5 text-[10px]">
                      {opt.range}
                    </Chip>
                  </div>
                  <p className="text-[11px] text-default-600 leading-relaxed">
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
