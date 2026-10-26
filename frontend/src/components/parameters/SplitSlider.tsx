import React from "react";
import { Card, CardBody, CardHeader, Divider, Slider, Switch, Chip } from "@heroui/react";
import { PieChart, CheckCircle2, SplitSquareVertical, Files } from "lucide-react";
import { MlpParameters } from "../../types/mlp";

export interface SplitSliderProps {
  parameters: MlpParameters;
  onChange: (updated: Partial<MlpParameters>) => void;
  totalSamples?: number;
  isSeparateTestFile?: boolean;
  testSampleCount?: number;
  testFileName?: string | null;
  onSeparateTestFileToggle?: (separate: boolean) => void;
}

export const SplitSlider: React.FC<SplitSliderProps> = ({
  parameters,
  onChange,
  totalSamples = 150,
  isSeparateTestFile = false,
  testSampleCount = 0,
  testFileName = null,
  onSeparateTestFileToggle,
}) => {
  const { trainingRate, sameFileForTesting } = parameters;
  const isSingleFile = sameFileForTesting && !isSeparateTestFile;
  const percentage = Math.round(trainingRate * 100);

  const trainCount = isSingleFile
    ? Math.round(totalSamples * (percentage / 100))
    : totalSamples;
  const testCount = isSingleFile
    ? Math.max(0, totalSamples - trainCount)
    : testSampleCount;

  const handleToggleSameFile = (useSame: boolean) => {
    onChange({ sameFileForTesting: useSame });
    if (onSeparateTestFileToggle) {
      onSeparateTestFileToggle(!useSame);
    }
  };

  return (
    <Card className="border border-default-200/50 bg-content1/60 backdrop-blur-md shadow-sm">
      <CardHeader className="flex gap-3 pb-2">
        <div className="p-2 rounded-lg bg-success/10 text-success">
          <SplitSquareVertical className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-semibold">Particionamento de Dados (Treino / Teste)</h3>
          <p className="text-xs text-default-500">
            Configure a divisão de validação (arquivo único ou arquivos dedicados de treino e teste)
          </p>
        </div>
      </CardHeader>
      <Divider />
      <CardBody className="p-4 sm:p-5 space-y-6">
        {/* Dynamic Samples Breakdown Chips */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-content2/40 border border-default-200/50">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-default-500">
              Distribuição de Amostras
            </span>
            <p className="text-sm font-bold text-foreground">
              {isSingleFile
                ? `${percentage}% Treino / ${100 - percentage}% Teste (Arquivo Único)`
                : `100% Treino / Teste Externo (Arquivos Separados)`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Chip
              size="sm"
              color="primary"
              variant="flat"
              startContent={<PieChart className="h-3 w-3 ml-1" />}
            >
              Treino: {trainCount} amostras
            </Chip>
            <Chip
              size="sm"
              color="secondary"
              variant="flat"
              startContent={<CheckCircle2 className="h-3 w-3 ml-1" />}
            >
              Teste: {testCount} amostras {isSingleFile ? "" : `(${testFileName || "Dedicado"})`}
            </Chip>
          </div>
        </div>

        {/* HeroUI Slider (active only in Single File mode) */}
        {isSingleFile ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground">Proporção de Treino</label>
              <span className="text-xs font-mono font-bold text-primary">{percentage}%</span>
            </div>
            <Slider
              aria-label="Proporção de Treino"
              size="md"
              step={5}
              minValue={50}
              maxValue={100}
              value={percentage}
              onChange={(val) => {
                const numVal = typeof val === "number" ? val : val[0];
                onChange({ trainingRate: numVal / 100 });
              }}
              color="primary"
              className="max-w-full"
              marks={[
                { value: 50, label: "50%" },
                { value: 70, label: "70%" },
                { value: 80, label: "80%" },
                { value: 90, label: "90%" },
                { value: 100, label: "100%" },
              ]}
            />
          </div>
        ) : (
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-secondary/10 text-secondary border border-secondary/20 text-xs">
            <Files className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-foreground">Modo de Arquivos Separados Ativo</p>
              <p className="text-default-600 leading-relaxed">
                A rede será treinada utilizando 100% dos dados do arquivo de treinamento.
                A matriz de confusão e as métricas de validação serão avaliadas estritamente contra as amostras do arquivo de teste dedicado
                {testFileName ? ` (${testFileName})` : ""}.
              </p>
            </div>
          </div>
        )}

        <Divider />

        {/* Same file for testing toggle */}
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <label className="text-xs font-semibold text-foreground">
              Usar o Mesmo Arquivo para Treino e Validação
            </label>
            <p className="text-[11px] text-default-500 leading-tight">
              Quando ativado, particiona um único arquivo CSV via proporção percentual.
              Quando desativado, permite utilizar arquivos CSV distintos para treino e teste.
            </p>
          </div>
          <Switch
            size="sm"
            color="primary"
            isSelected={isSingleFile}
            onValueChange={handleToggleSameFile}
            aria-label="Usar o mesmo arquivo para teste"
          />
        </div>
      </CardBody>
    </Card>
  );
};
