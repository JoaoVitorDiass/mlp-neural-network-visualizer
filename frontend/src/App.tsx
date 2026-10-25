import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardBody,
  Tabs,
  Tab,
  Button,
  Chip,
} from "@heroui/react";
import {
  Database,
  Sliders,
  PlayCircle,
  BarChart3,
  Sparkles,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Navbar } from "./components/layout/Navbar";
import { Footer } from "./components/layout/Footer";
import { useTheme } from "./hooks/useTheme";
import { useDataset } from "./hooks/useDataset";
import { useTrainingSession } from "./hooks/useTrainingSession";
import { getPresetById } from "./data/presets";
import { MlpParameters } from "./types/mlp";
import { DatasetStudio } from "./components/dataset/DatasetStudio";
import { TopologyPanel } from "./components/parameters/TopologyPanel";
import { Hyperparameters } from "./components/parameters/Hyperparameters";
import { ActivationPicker } from "./components/parameters/ActivationPicker";
import { SplitSlider } from "./components/parameters/SplitSlider";
import { TrainingControlBar } from "./components/training/TrainingControlBar";
import { LiveMetricsBar } from "./components/training/LiveMetricsBar";
import { LearningCurveCanvas } from "./components/training/LearningCurveCanvas";
import { ConfusionMatrixHeatmap } from "./components/evaluation/ConfusionMatrixHeatmap";

export const App: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [selectedTab, setSelectedTab] = useState<string>("datasets");

  const dataset = useDataset();

  // Initialize unified training session
  const trainingSession = useTrainingSession();

  const [parameters, setParameters] = useState<MlpParameters>({
    inputLayer: 4,
    hiddenLayer: 3,
    outputLayer: 3,
    firstClassColumn: 4,
    learningRate: 0.1,
    errorValue: 0.01,
    epochs: 1000,
    transferFunction: "Logistica",
    trainingRate: 0.7,
    sameFileForTesting: true,
  });

  const handleParametersChange = useCallback((updated: Partial<MlpParameters>) => {
    setParameters((prev) => ({ ...prev, ...updated }));
  }, []);

  // Synchronize topology whenever dataset columns or roles update
  useEffect(() => {
    const processed = dataset.processedDataset;
    if (processed) {
      setParameters((prev) => ({
        ...prev,
        inputLayer: processed.inputCount,
        outputLayer: processed.outputCount,
        firstClassColumn: processed.firstClassIndex,
      }));
    }
  }, [dataset.processedDataset]);

  // When a preset is chosen, auto-configure recommended topology and hyperparameters
  useEffect(() => {
    if (dataset.currentPresetId) {
      const preset = getPresetById(dataset.currentPresetId);
      if (preset && preset.defaultParameters) {
        setParameters((prev) => ({
          ...prev,
          ...preset.defaultParameters,
        }));
      }
    }
  }, [dataset.currentPresetId]);

  const handleResetDefaults = useCallback(() => {
    if (dataset.currentPresetId) {
      const preset = getPresetById(dataset.currentPresetId);
      if (preset && preset.defaultParameters) {
        setParameters((prev) => ({
          ...prev,
          ...preset.defaultParameters,
        }));
        return;
      }
    }

    const inCount = dataset.processedDataset?.inputCount ?? 4;
    const outCount = dataset.processedDataset?.outputCount ?? 3;
    setParameters({
      inputLayer: inCount,
      hiddenLayer: Math.max(1, Math.floor((inCount + outCount) / 2)),
      outputLayer: outCount,
      firstClassColumn: inCount,
      learningRate: 0.1,
      errorValue: 0.01,
      epochs: 1000,
      transferFunction: "Logistica",
      trainingRate: 0.7,
      sameFileForTesting: true,
    });
  }, [dataset.currentPresetId, dataset.processedDataset]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-200">
      {/* Top Navigation */}
      <Navbar theme={theme} onToggleTheme={toggleTheme} />

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Banner with Motion */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-background border border-default-200/50 backdrop-blur-md shadow-xl"
        >
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex items-center gap-2">
                <Chip
                  size="sm"
                  variant="shadow"
                  color="primary"
                  startContent={<Sparkles className="h-3.5 w-3.5 ml-1" />}
                >
                  Modern AI Visualizer
                </Chip>
                <Chip size="sm" variant="flat" color="secondary">
                  Backpropagation & SignalR
                </Chip>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-primary bg-clip-text text-transparent">
                Multi-Layer Perceptron Studio
              </h1>
              <p className="text-sm sm:text-base text-default-600 leading-relaxed">
                Configure network topology, stream training epochs at 60 FPS
                over WebSockets, and analyze interactive confusion matrix
                evaluations in real-time.
              </p>
            </div>

            {/* Quick Stats or Action */}
            <div className="flex flex-wrap md:flex-col gap-3 w-full md:w-auto">
              <Button
                color="primary"
                variant="shadow"
                size="md"
                endContent={<ArrowRight className="h-4 w-4" />}
                onClick={() => setSelectedTab("training")}
                className="font-medium"
              >
                Go to Training Studio
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Studio Navigation Tabs */}
        <div className="flex flex-col gap-6">
          <Tabs
            aria-label="Studio Navigation"
            selectedKey={selectedTab}
            onSelectionChange={(key) => setSelectedTab(key as string)}
            color="primary"
            variant="underlined"
            classNames={{
              tabList: "gap-6 w-full border-b border-default-200/50 pb-0",
              cursor: "w-full bg-primary",
              tab: "max-w-fit px-2 h-12 text-sm font-medium",
              tabContent: "group-data-[selected=true]:text-primary",
            }}
          >
            <Tab
              key="datasets"
              title={
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  <span>1. Datasets & Features</span>
                </div>
              }
            />
            <Tab
              key="parameters"
              title={
                <div className="flex items-center gap-2">
                  <Sliders className="h-4 w-4" />
                  <span>2. Hyperparameter Studio</span>
                </div>
              }
            />
            <Tab
              key="training"
              title={
                <div className="flex items-center gap-2">
                  <PlayCircle className="h-4 w-4" />
                  <span>3. Real-Time Training</span>
                </div>
              }
            />
            <Tab
              key="evaluation"
              title={
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  <span>4. Evaluation & Metrics</span>
                </div>
              }
            />
          </Tabs>

          {/* Tab Content Display Area with Animated Transitions */}
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              {selectedTab === "datasets" && (
                <div id="datasets-section" className="space-y-6">
                  <DatasetStudio
                    dataset={dataset}
                    trainingRate={parameters.trainingRate}
                  />

                  <div className="flex justify-end pt-2">
                    <Button
                      color="primary"
                      size="md"
                      variant="shadow"
                      endContent={<ArrowRight className="h-4 w-4" />}
                      onClick={() => setSelectedTab("parameters")}
                      className="font-medium"
                    >
                      Configure Hyperparameters
                    </Button>
                  </div>
                </div>
              )}

              {selectedTab === "parameters" && (
                <div id="parameters-section" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <TopologyPanel
                      parameters={parameters}
                      onChange={handleParametersChange}
                      datasetInputCount={dataset.processedDataset?.inputCount}
                      datasetOutputCount={dataset.processedDataset?.outputCount}
                    />
                    <Hyperparameters
                      parameters={parameters}
                      onChange={handleParametersChange}
                      onReset={handleResetDefaults}
                    />
                  </div>

                  <ActivationPicker
                    selectedFunction={parameters.transferFunction}
                    onSelect={(fn) => handleParametersChange({ transferFunction: fn })}
                  />

                  <SplitSlider
                    parameters={parameters}
                    onChange={handleParametersChange}
                    totalSamples={dataset.rawRows.length}
                  />

                  <div className="flex items-center justify-between pt-4">
                    <Button
                      variant="flat"
                      size="md"
                      onClick={() => setSelectedTab("datasets")}
                      className="font-medium"
                    >
                      ← Back to Dataset
                    </Button>
                    <Button
                      color="primary"
                      size="md"
                      variant="shadow"
                      endContent={<ArrowRight className="h-4 w-4" />}
                      onClick={() => setSelectedTab("training")}
                      className="font-medium"
                    >
                      Proceed to Real-Time Training
                    </Button>
                  </div>
                </div>
              )}

              {selectedTab === "training" && (
                <div id="training-section" className="space-y-6">
                  {/* 1. Training Control Bar */}
                  <TrainingControlBar
                    status={trainingSession.status}
                    connectionState={trainingSession.connectionState}
                    parameters={parameters}
                    datasetName={
                      dataset.currentPresetId
                        ? dataset.currentPresetId.toUpperCase()
                        : dataset.fileName || "Custom CSV"
                    }
                    datasetRowCount={dataset.rawRows.length}
                    canStart={Boolean(
                      dataset.processedDataset &&
                        dataset.processedDataset.normalizedRows.length > 0
                    )}
                    onStart={() => {
                      if (dataset.processedDataset) {
                        trainingSession.startTraining(parameters, dataset.processedDataset);
                      }
                    }}
                    onStop={trainingSession.stopTraining}
                    onReset={trainingSession.resetTraining}
                    onViewEvaluation={() => setSelectedTab("evaluation")}
                  />

                  {/* 2. Error Banner (if error occurred) */}
                  {trainingSession.error && (
                    <Card className="border border-danger-200 bg-danger-50/50 dark:bg-danger-950/20 text-danger-700 dark:text-danger-400 p-4">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 shrink-0" />
                        <div className="flex-1 text-sm font-medium">
                          {trainingSession.error}
                        </div>
                        <Button
                          size="sm"
                          variant="flat"
                          color="danger"
                          onClick={() => {
                            if (dataset.processedDataset) {
                              trainingSession.startTraining(parameters, dataset.processedDataset);
                            }
                          }}
                        >
                          Tentar Novamente
                        </Button>
                      </div>
                    </Card>
                  )}

                  {/* 3. Live Metrics Bar (KPI Cards & Progress Bar) */}
                  <LiveMetricsBar
                    currentEpoch={trainingSession.metrics.currentEpoch}
                    maxEpochs={parameters.epochs}
                    currentError={trainingSession.metrics.currentError}
                    initialError={trainingSession.metrics.initialError}
                    targetError={parameters.errorValue}
                    status={trainingSession.status}
                    startTime={
                      trainingSession.status === "training"
                        ? Date.now() - trainingSession.metrics.elapsedSeconds * 1000
                        : null
                    }
                  />

                  {/* 4. Real-Time 60 FPS Learning Curve Canvas */}
                  <LearningCurveCanvas
                    epochProgress={trainingSession.epochProgress}
                    targetError={parameters.errorValue}
                    maxEpochs={parameters.epochs}
                    isDark={theme === "dark"}
                    isTraining={trainingSession.status === "training"}
                  />

                  {/* 5. Completion Banner with CTA to Evaluation */}
                  {trainingSession.status === "completed" && trainingSession.trainingResult && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card className="border border-success-200 bg-success-50/40 dark:bg-success-950/20 p-5 shadow-sm">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="p-3 rounded-full bg-success/20 text-success">
                              <CheckCircle2 className="h-6 w-6" />
                            </div>
                            <div>
                              <h4 className="text-base font-bold text-foreground">
                                Treinamento Finalizado com Sucesso!
                              </h4>
                              <p className="text-xs text-default-600">
                                Acurácia:{" "}
                                <span className="font-bold text-success font-mono">
                                  {trainingSession.trainingResult.accuracyPercentage.toFixed(1)}%
                                </span>{" "}
                                | Total de Épocas:{" "}
                                <span className="font-mono">
                                  {trainingSession.trainingResult.totalEpochs}
                                </span>{" "}
                                | Erro Final:{" "}
                                <span className="font-mono">
                                  {trainingSession.trainingResult.finalError.toFixed(5)}
                                </span>
                              </p>
                            </div>
                          </div>
                          <Button
                            color="success"
                            size="md"
                            variant="shadow"
                            endContent={<ArrowRight className="h-4 w-4" />}
                            onClick={() => setSelectedTab("evaluation")}
                            className="font-semibold"
                          >
                            Ver Relatório e Matriz de Confusão
                          </Button>
                        </div>
                      </Card>
                    </motion.div>
                  )}
                </div>
              )}

              {selectedTab === "evaluation" && (
                <div id="evaluation-section" className="space-y-6">
                  {trainingSession.trainingResult ? (
                    <div className="space-y-6">
                      <Card className="border border-default-200/50 bg-content1/60 backdrop-blur-md shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-success/10 text-success">
                              <CheckCircle2 className="h-6 w-6" />
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-foreground">
                                Relatório de Desempenho do Modelo
                              </h3>
                              <p className="text-xs text-default-500">
                                Resultados computados sobre os dados de validação
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="flat"
                            color="primary"
                            onClick={() => setSelectedTab("training")}
                          >
                            Novo Treinamento
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2">
                          <div className="p-4 rounded-xl bg-default-100/60">
                            <span className="text-xs text-default-500">Acurácia Global</span>
                            <p className="text-2xl font-bold font-mono text-success">
                              {trainingSession.trainingResult.accuracyPercentage.toFixed(2)}%
                            </p>
                          </div>
                          <div className="p-4 rounded-xl bg-default-100/60">
                            <span className="text-xs text-default-500">Convergência</span>
                            <p className="text-xl font-bold">
                              {trainingSession.trainingResult.converged ? "Convergido" : "Máx Épocas"}
                            </p>
                          </div>
                          <div className="p-4 rounded-xl bg-default-100/60">
                            <span className="text-xs text-default-500">Total de Épocas</span>
                            <p className="text-2xl font-bold font-mono">
                              {trainingSession.trainingResult.totalEpochs}
                            </p>
                          </div>
                          <div className="p-4 rounded-xl bg-default-100/60">
                            <span className="text-xs text-default-500">Erro Final</span>
                            <p className="text-2xl font-bold font-mono">
                              {trainingSession.trainingResult.finalError.toFixed(5)}
                            </p>
                          </div>
                        </div>
                      </Card>

                      {/* Interactive Confusion Matrix Heatmap */}
                      <ConfusionMatrixHeatmap
                        matrix={trainingSession.trainingResult.confusionMatrix}
                        classNames={dataset.processedDataset?.targetClasses}
                        totalSamples={dataset.processedDataset?.rawRows?.length}
                        accuracyPercentage={trainingSession.trainingResult.accuracyPercentage}
                      />
                    </div>
                  ) : (
                    <Card className="border border-default-200/50 bg-content1/60 backdrop-blur-md shadow-sm">
                      <CardBody className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="p-4 rounded-full bg-default-100 text-default-400">
                          <BarChart3 className="h-8 w-8" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-base font-semibold text-foreground">
                            Nenhum Modelo Treinado Ainda
                          </p>
                          <p className="text-xs text-default-500 max-w-sm">
                            Inicie o treinamento na aba "Real-Time Training" para gerar a matriz de confusão e o relatório de desempenho.
                          </p>
                        </div>
                        <Button
                          color="primary"
                          variant="flat"
                          size="sm"
                          onClick={() => setSelectedTab("training")}
                        >
                          Ir para Treinamento
                        </Button>
                      </CardBody>
                    </Card>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default App;
