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
} from "lucide-react";
import { UseDatasetReturn } from "../../hooks/useDataset";
import { PRESETS } from "../../data/presets";
import { CsvDropzone } from "./CsvDropzone";
import { ColumnRoleSelector } from "./ColumnRoleSelector";

export interface DatasetStudioProps {
  dataset: UseDatasetReturn;
  trainingRate?: number;
}

export const DatasetStudio: React.FC<DatasetStudioProps> = ({
  dataset,
  trainingRate = 0.7,
}) => {
  const [showNormalized, setShowNormalized] = useState(false);
  const [activeMode, setActiveMode] = useState<"preset" | "upload">(
    dataset.currentPresetId ? "preset" : "upload"
  );

  const {
    currentPresetId,
    fileName,
    rawRows,
    columns,
    processedDataset,
    isLoading,
    error,
    loadPreset,
    loadCsvFile,
    setColumnRole,
  } = dataset;

  const totalSamples = rawRows.length;
  const inputCount = processedDataset?.inputCount ?? 0;
  const outputCount = processedDataset?.outputCount ?? 0;
  const trainCount = Math.round(totalSamples * Math.max(0.1, Math.min(1.0, trainingRate)));
  const testCount = Math.max(0, totalSamples - trainCount);

  // Table preview rows (first 6 rows)
  const previewRows = showNormalized
    ? (processedDataset?.normalizedRows ?? []).slice(0, 6)
    : rawRows.slice(0, 6);

  // Table columns to display
  const previewColumns = showNormalized
    ? Object.keys(previewRows[0] || {})
    : columns.map((c) => c.name);

  return (
    <div className="space-y-6">
      {/* Top Controls: Preset Selection vs Custom Upload */}
      <Card className="border border-default-200/50 bg-content1/60 backdrop-blur-md shadow-sm">
        <CardBody className="p-4 sm:p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">Selecione um Dataset Padrão ou Envie o Seu</h2>
              </div>
              <p className="text-xs text-default-500">
                Escolha benchmarks clássicos para treino imediato com 1 clique ou faça upload do seu arquivo CSV.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {PRESETS.map((p) => {
                const isSelected = activeMode === "preset" && currentPresetId === p.id;
                return (
                  <Button
                    key={p.id}
                    color={isSelected ? "primary" : "default"}
                    variant={isSelected ? "solid" : "flat"}
                    size="sm"
                    onClick={() => {
                      setActiveMode("preset");
                      loadPreset(p.id);
                    }}
                    startContent={<Sparkles className="h-3.5 w-3.5" />}
                    className="font-medium"
                  >
                    {p.name} ({p.sampleCount} amostras)
                  </Button>
                );
              })}

              <Button
                color={activeMode === "upload" ? "secondary" : "default"}
                variant={activeMode === "upload" ? "solid" : "flat"}
                size="sm"
                onClick={() => setActiveMode("upload")}
                startContent={<UploadCloud className="h-3.5 w-3.5" />}
                className="font-medium"
              >
                Enviar CSV Próprio
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Main Grid: Upload/Preset Info on Left, Column Roles on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Dropzone & Dataset Info */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border border-default-200/50 bg-content1/60 backdrop-blur-md shadow-sm">
            <CardHeader className="flex gap-3 pb-2">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                {activeMode === "upload" ? (
                  <UploadCloud className="h-5 w-5" />
                ) : (
                  <FileSpreadsheet className="h-5 w-5" />
                )}
              </div>
              <div>
                <h3 className="text-base font-semibold">
                  {activeMode === "upload" ? "Enviar Arquivo CSV" : "Informações do Dataset Ativo"}
                </h3>
                <p className="text-xs text-default-500">
                  {activeMode === "upload"
                    ? "Arraste e solte ou selecione arquivos"
                    : "Características do benchmark pré-carregado"}
                </p>
              </div>
            </CardHeader>
            <Divider />
            <CardBody className="p-4 sm:p-5 space-y-4">
              {activeMode === "upload" ? (
                <CsvDropzone
                  onFileLoaded={loadCsvFile}
                  fileName={fileName}
                  rowCount={rawRows.length}
                  isLoading={isLoading}
                  error={error}
                />
              ) : (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-content2/40 border border-default-200/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-default-500 uppercase tracking-wider font-semibold">
                        Dataset Pré-definido
                      </span>
                      <Chip size="sm" color="primary" variant="flat">
                        {fileName}
                      </Chip>
                    </div>
                    <p className="text-xs text-default-600 leading-relaxed">
                      {currentPresetId === "iris"
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
                    <span>Total de Amostras</span>
                  </div>
                  <p className="text-lg font-bold text-foreground">{totalSamples}</p>
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
                      <span>Divisão Treino / Teste</span>
                    </div>
                    <span className="font-semibold text-foreground">
                      {Math.round(trainingRate * 100)}% / {100 - Math.round(trainingRate * 100)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Chip size="sm" color="primary" variant="flat" className="h-5 text-[11px]">
                      Treino: {trainCount} amostras
                    </Chip>
                    <Chip size="sm" color="secondary" variant="flat" className="h-5 text-[11px]">
                      Teste: {testCount} amostras
                    </Chip>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Right Column: Interactive Column Roles Configuration */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="border border-default-200/50 bg-content1/60 backdrop-blur-md shadow-sm">
            <CardHeader className="flex gap-3 pb-2">
              <div className="p-2 rounded-lg bg-secondary/10 text-secondary">
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
      <Card className="border border-default-200/50 bg-content1/60 backdrop-blur-md shadow-sm overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <TableProperties className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Prévia Tabular do Dataset (Primeiras 6 Amostras)</h3>
              <p className="text-xs text-default-500">
                {showNormalized
                  ? "Normalizado Min-Max em [0, 1] com codificação One-Hot para classes"
                  : "Valores brutos originais do dataset"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-xs text-default-600 font-medium">Exibir Normalizado [0, 1]</span>
            <Switch
              size="sm"
              color="primary"
              isSelected={showNormalized}
              onValueChange={setShowNormalized}
              aria-label="Alternar Visualização Normalizada"
            />
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
