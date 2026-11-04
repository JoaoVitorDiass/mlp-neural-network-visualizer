import React, { useState } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Chip,
  Divider,
  Switch,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/react";
import {
  Database,
  Sparkles,
  UploadCloud,
  Layers,
  FileSpreadsheet,
  TableProperties,
  Hash,
  Binary,
  PieChart,
  SplitSquareVertical,
  Files,
  CheckCircle2,
} from "lucide-react";
import { UseDatasetReturn } from "../../hooks/useDataset";
import { PRESETS } from "../../data/presets";
import { CsvDropzone } from "./CsvDropzone";
import { ColumnRoleSelector } from "./ColumnRoleSelector";

export interface DatasetStudioProps {
  dataset: UseDatasetReturn;
  trainingRate?: number;
  sameFileForTesting?: boolean;
  onSameFileForTestingChange?: (val: boolean) => void;
}

export const DatasetStudio: React.FC<DatasetStudioProps> = ({
  dataset,
  trainingRate = 0.7,
  onSameFileForTestingChange,
}) => {
  const [showNormalized, setShowNormalized] = useState(false);
  const [activeMode, setActiveMode] = useState<"preset" | "upload">(
    dataset.currentPresetId ? "preset" : "upload"
  );
  const [previewTarget, setPreviewTarget] = useState<"train" | "test">("train");

  const {
    currentPresetId,
    fileName,
    rawRows,
    columns,
    processedDataset,
    isLoading,
    error,
    isSeparateTestFile,
    setIsSeparateTestFile,
    testFileName,
    testRawRows,
    testProcessedDataset,
    testError,
    loadPreset,
    loadCsvFile,
    loadTestCsvFile,
    clearTestFile,
    setColumnRole,
  } = dataset;

  const totalTrainSamples = rawRows.length;
  const totalTestSamples = isSeparateTestFile ? testRawRows.length : Math.max(0, totalTrainSamples - Math.round(totalTrainSamples * trainingRate));
  const effectiveTrainCount = isSeparateTestFile ? totalTrainSamples : Math.round(totalTrainSamples * trainingRate);

  const inputCount = processedDataset?.inputCount ?? 0;
  const outputCount = processedDataset?.outputCount ?? 0;

  // Active preview rows
  const activeRawRows = previewTarget === "test" && isSeparateTestFile ? testRawRows : rawRows;
  const activeProcessed = previewTarget === "test" && isSeparateTestFile ? testProcessedDataset : processedDataset;

  const previewRows = showNormalized
    ? (activeProcessed?.normalizedRows ?? []).slice(0, 6)
    : activeRawRows.slice(0, 6);

  const previewColumns = showNormalized
    ? Object.keys(previewRows[0] || {})
    : columns.map((c) => c.name);

  const handleTogglePartitionMode = (separate: boolean) => {
    setIsSeparateTestFile(separate);
    if (onSameFileForTestingChange) {
      onSameFileForTestingChange(!separate);
    }
  };

  return (
    <div className="space-y-6">
      {/* Educational Step Callout */}
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-sky-50/90 dark:bg-sky-950/30 border border-sky-200/80 dark:border-sky-900/50 text-sky-950 dark:text-sky-200 shadow-sm">
        <div className="p-2 rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400 shrink-0">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="text-xs sm:text-sm space-y-0.5">
          <p className="font-semibold text-sky-900 dark:text-sky-100">
            Passo 1: Carregue os Dados para o Treinamento da Rede
          </p>
          <p className="text-sky-800/80 dark:text-sky-300/80 text-xs">
            A rede neural precisa de dados rotulados para aprender. Escolha um dos benchmarks acadêmicos recomendados com 1 clique ou envie seus arquivos CSV.
          </p>
        </div>
      </div>

      {/* Top Controls: Preset Selection vs Custom Upload */}
      <Card className="border border-sky-100/80 dark:border-default-200/40 bg-white/80 dark:bg-content1/60 backdrop-blur-md shadow-sm rounded-2xl">
        <CardBody className="p-5 sm:p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                <h2 className="text-base sm:text-lg font-bold text-foreground">
                  Escolha um Dataset Pré-configurado ou Envie o Seu
                </h2>
              </div>
              <p className="text-xs text-default-500">
                Os benchmarks pré-configurados já vêm com colunas e hiperparâmetros ajustados para convergência imediata.
              </p>
            </div>

            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-default-100/70 border border-default-200/50 text-xs self-start md:self-auto">
              <Button
                size="sm"
                variant={activeMode === "preset" ? "solid" : "light"}
                color={activeMode === "preset" ? "primary" : "default"}
                onClick={() => setActiveMode("preset")}
                className="h-8 text-xs px-3 font-semibold rounded-lg"
                startContent={<Sparkles className="h-3.5 w-3.5" />}
              >
                Datasets Padrão
              </Button>
              <Button
                size="sm"
                variant={activeMode === "upload" ? "solid" : "light"}
                color={activeMode === "upload" ? "primary" : "default"}
                onClick={() => setActiveMode("upload")}
                className="h-8 text-xs px-3 font-semibold rounded-lg"
                startContent={<UploadCloud className="h-3.5 w-3.5" />}
              >
                Enviar CSV Próprio
              </Button>
            </div>
          </div>

          {/* Preset Buttons Grid */}
          {activeMode === "preset" && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {PRESETS.map((p) => {
                const isSelected = currentPresetId === p.id;
                const isBenchmark = p.id === "base-benchmark";
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      loadPreset(p.id);
                    }}
                    className={`cursor-pointer p-4 rounded-xl border transition-all text-left flex flex-col justify-between gap-2 select-none ${
                      isSelected
                        ? "border-sky-500 bg-sky-50/70 dark:bg-sky-950/40 shadow-sm ring-2 ring-sky-400/30"
                        : "border-default-200/60 bg-content2/30 hover:border-sky-300 hover:bg-sky-50/30 dark:hover:bg-content2/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
                        {p.name}
                        {isBenchmark && (
                          <Chip size="sm" color="warning" variant="flat" className="h-5 text-[10px]">
                            Recomendado
                          </Chip>
                        )}
                      </span>
                      {isSelected && (
                        <CheckCircle2 className="h-4 w-4 text-sky-600 dark:text-sky-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-default-500 line-clamp-2">
                      {p.description}
                    </p>
                    <div className="flex items-center gap-2 pt-1 text-[11px] text-default-600 font-mono">
                      <span>{p.sampleCount} treino</span>
                      {p.testSampleCount && (
                        <>
                          <span>•</span>
                          <span>{p.testSampleCount} teste</span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Main Grid: Upload/Preset Info on Left, Column Roles on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Dropzone & Dataset Info */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border border-sky-100/80 dark:border-default-200/40 bg-white/80 dark:bg-content1/60 backdrop-blur-md shadow-sm rounded-2xl">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
                  {activeMode === "upload" ? (
                    <UploadCloud className="h-5 w-5" />
                  ) : (
                    <FileSpreadsheet className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-semibold">
                    {activeMode === "upload" ? "Envio de Arquivos CSV" : "Informações do Dataset Ativo"}
                  </h3>
                  <p className="text-xs text-default-500">
                    {activeMode === "upload"
                      ? "Arraste e solte arquivos de treino e teste"
                      : "Características do benchmark pré-carregado"}
                  </p>
                </div>
              </div>

              {/* Partition Mode Selector Pill */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-default-100/70 border border-default-200/50 text-xs">
                <Button
                  size="sm"
                  variant={!isSeparateTestFile ? "solid" : "light"}
                  color={!isSeparateTestFile ? "primary" : "default"}
                  onClick={() => handleTogglePartitionMode(false)}
                  className="h-7 text-[11px] px-2.5 font-medium rounded-lg"
                  startContent={<SplitSquareVertical className="h-3 w-3" />}
                >
                  Arquivo Único
                </Button>
                <Button
                  size="sm"
                  variant={isSeparateTestFile ? "solid" : "light"}
                  color={isSeparateTestFile ? "secondary" : "default"}
                  onClick={() => handleTogglePartitionMode(true)}
                  className="h-7 text-[11px] px-2.5 font-medium rounded-lg"
                  startContent={<Files className="h-3 w-3" />}
                >
                  Arquivos Separados
                </Button>
              </div>
            </CardHeader>
            <Divider />
            <CardBody className="p-4 sm:p-5 space-y-4">
              {activeMode === "upload" ? (
                <div className="space-y-4">
                  {/* Training File Dropzone */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <FileSpreadsheet className="h-3.5 w-3.5 text-primary" />
                      Arquivo de Treinamento (.csv)
                    </span>
                    <CsvDropzone
                      onFileLoaded={loadCsvFile}
                      fileName={fileName}
                      rowCount={rawRows.length}
                      isLoading={isLoading}
                      error={error}
                    />
                  </div>

                  {/* Test File Dropzone (if Separate Files Mode is active) */}
                  {isSeparateTestFile && (
                    <div className="space-y-1.5 pt-2 border-t border-default-200/40">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-secondary" />
                          Arquivo Dedicado de Teste (.csv)
                        </span>
                        {testFileName && (
                          <Button
                            size="sm"
                            variant="light"
                            color="danger"
                            onClick={clearTestFile}
                            className="h-6 text-[10px] px-2"
                          >
                            Remover teste
                          </Button>
                        )}
                      </div>
                      <CsvDropzone
                        onFileLoaded={loadTestCsvFile}
                        fileName={testFileName || undefined}
                        rowCount={testRawRows.length > 0 ? testRawRows.length : undefined}
                        isLoading={isLoading}
                        error={testError}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-content2/40 border border-default-200/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-default-500 uppercase tracking-wider font-semibold">
                        Dataset Pré-definido
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Chip size="sm" color="primary" variant="flat">
                          Treino: {fileName}
                        </Chip>
                        {testFileName && (
                          <Chip size="sm" color="secondary" variant="flat">
                            Teste: {testFileName}
                          </Chip>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-default-600 leading-relaxed">
                      {currentPresetId === "base-benchmark"
                        ? "Base de dados clássica (6 entradas, 5 classes CA/CB/CC/CD/CE) com pares dedicados de treinamento (827 amostras) e teste (352 amostras)."
                        : currentPresetId === "iris"
                        ? "Dataset Fisher Iris: 150 flores com 4 atributos físicos contínuos e 3 classes de espécies balanceadas (Setosa, Versicolor, Virginica)."
                        : "Dataset ColorBalls: 400 amostras espaciais com 4 atributos de coordenadas classificados em 4 cores distintas (Azul, Verde, Vermelho, Amarelo)."}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-default-500">Deseja testar dados próprios?</span>
                    <Button
                      size="sm"
                      variant="light"
                      color="secondary"
                      onClick={() => setActiveMode("upload")}
                      startContent={<UploadCloud className="h-3.5 w-3.5" />}
                    >
                      Alternar para Envio de Arquivo
                    </Button>
                  </div>
                </div>
              )}

              {/* Dataset Summary Metrics */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-content2/30 border border-default-200/40 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-default-500">
                    <Hash className="h-3.5 w-3.5 text-primary" />
                    <span>Amostras de Treino</span>
                  </div>
                  <p className="text-lg font-bold text-foreground">{effectiveTrainCount}</p>
                </div>

                <div className="p-3 rounded-xl bg-content2/30 border border-default-200/40 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-default-500">
                    <Layers className="h-3.5 w-3.5 text-secondary" />
                    <span>Entradas / Saídas</span>
                  </div>
                  <p className="text-lg font-bold text-foreground">
                    {inputCount} <span className="text-xs text-default-500 font-normal">entradas</span> / {outputCount}{" "}
                    <span className="text-xs text-default-500 font-normal">saídas</span>
                  </p>
                </div>

                <div className="col-span-2 p-3 rounded-xl bg-content2/30 border border-default-200/40 space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-default-500">
                    <div className="flex items-center gap-1.5">
                      <PieChart className="h-3.5 w-3.5 text-success" />
                      <span>
                        {isSeparateTestFile
                          ? "Particionamento por Arquivos Dedicados"
                          : "Divisão Treino / Teste (Percentual)"}
                      </span>
                    </div>
                    <span className="font-semibold text-foreground">
                      {isSeparateTestFile
                        ? "100% Treino / Teste Externo"
                        : `${Math.round(trainingRate * 100)}% / ${100 - Math.round(trainingRate * 100)}%`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Chip size="sm" color="primary" variant="flat" className="h-5 text-[11px]">
                      Treino: {effectiveTrainCount} amostras
                    </Chip>
                    <Chip size="sm" color="secondary" variant="flat" className="h-5 text-[11px]">
                      Teste: {totalTestSamples} amostras {isSeparateTestFile ? "(Dedicado)" : "(Divisão)"}
                    </Chip>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Right Column: Interactive Column Roles Configuration */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="border border-sky-100/80 dark:border-default-200/40 bg-white/80 dark:bg-content1/60 backdrop-blur-md shadow-sm rounded-2xl">
            <CardHeader className="flex gap-3 pb-2">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <Binary className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold">Configuração Interativa de Colunas</h3>
                <p className="text-xs text-default-500">
                  Defina entradas, rótulo de classificação alvo ou ignore identificadores
                </p>
              </div>
            </CardHeader>
            <Divider />
            <CardBody className="p-4 sm:p-5">
              <ColumnRoleSelector columns={columns} onRoleChange={setColumnRole} />
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Bottom Area: Data Preview Table (Raw vs Normalized) */}
      <Card className="border border-sky-100/80 dark:border-default-200/40 bg-white/80 dark:bg-content1/60 backdrop-blur-md shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <TableProperties className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">
                Prévia Tabular do Dataset ({previewTarget === "test" ? "Arquivo de Teste" : "Arquivo de Treino"})
              </h3>
              <p className="text-xs text-default-500">
                {showNormalized
                  ? "Normalizado Min-Max em [0, 1] com codificação One-Hot para classes"
                  : "Valores brutos originais do dataset"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-end sm:self-auto">
            {/* Toggle between Train vs Test preview if test dataset loaded */}
            {isSeparateTestFile && testRawRows.length > 0 && (
              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-default-100 text-xs">
                <Button
                  size="sm"
                  variant={previewTarget === "train" ? "solid" : "light"}
                  color={previewTarget === "train" ? "primary" : "default"}
                  onClick={() => setPreviewTarget("train")}
                  className="h-6 text-[10px] px-2 font-medium"
                >
                  Ver Treino
                </Button>
                <Button
                  size="sm"
                  variant={previewTarget === "test" ? "solid" : "light"}
                  color={previewTarget === "test" ? "secondary" : "default"}
                  onClick={() => setPreviewTarget("test")}
                  className="h-6 text-[10px] px-2 font-medium"
                >
                  Ver Teste
                </Button>
              </div>
            )}

            <div className="flex items-center gap-2">
              <span className="text-xs text-default-600 font-medium">Exibir Normalizado [0, 1]</span>
              <Switch
                size="sm"
                color="primary"
                isSelected={showNormalized}
                onValueChange={setShowNormalized}
                aria-label="Alternar Visualização Normalizada"
              />
            </div>
          </div>
        </CardHeader>
        <Divider />
        <CardBody className="p-0 overflow-x-auto">
          {previewRows.length === 0 ? (
            <div className="py-12 text-center text-xs text-default-500">
              Nenhum dado de prévia disponível
            </div>
          ) : (
            <Table
              aria-label="Tabela de Prévia do Dataset"
              removeWrapper
              className="min-w-full text-xs"
              classNames={{
                th: "bg-content2/60 text-default-600 text-[11px] font-semibold py-2.5",
                td: "py-2 text-[12px] font-mono border-b border-default-100",
              }}
            >
              <TableHeader>
                {previewColumns.map((colName) => (
                  <TableColumn key={colName}>
                    <div className="flex items-center gap-1">
                      <span>{colName}</span>
                      {showNormalized && (
                        <span className="text-[10px] text-primary font-normal">(norm)</span>
                      )}
                    </div>
                  </TableColumn>
                ))}
              </TableHeader>
              <TableBody>
                {previewRows.map((row, rowIdx) => (
                  <TableRow key={rowIdx}>
                    {previewColumns.map((colName) => {
                      const val = row[colName];
                      const displayVal =
                        typeof val === "number"
                          ? Number.isInteger(val)
                            ? val.toString()
                            : val.toFixed(3)
                          : String(val ?? "");
                      return <TableCell key={colName}>{displayVal}</TableCell>;
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>
    </div>
  );
};
