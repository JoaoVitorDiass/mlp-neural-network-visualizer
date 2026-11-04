import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardBody,
  Button,
} from "@heroui/react";
import {
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  BarChart3,
  Sparkles,
  Play,
  RotateCcw,
} from "lucide-react";
import { Navbar } from "./components/layout/Navbar";
import { Footer } from "./components/layout/Footer";
import { Stepper, StepId } from "./components/layout/Stepper";
import { MlpGuideModal } from "./components/common/MlpGuideModal";
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
  const [currentStep, setCurrentStep] = useState<StepId>("datasets");
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);

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

  const isDatasetReady = Boolean(
    dataset.processedDataset && dataset.processedDataset.normalizedRows.length > 0
  );
  const isTrained = Boolean(trainingSession.trainingResult);

  // Stepper navigation helpers
  const handlePrevStep = () => {
    if (currentStep === "parameters") setCurrentStep("datasets");
    else if (currentStep === "training") setCurrentStep("parameters");
    else if (currentStep === "evaluation") setCurrentStep("training");
  };

  const handleNextStep = () => {
    if (currentStep === "datasets") setCurrentStep("parameters");
    else if (currentStep === "parameters") setCurrentStep("training");
    else if (currentStep === "training") setCurrentStep("evaluation");
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/60 dark:bg-background text-foreground transition-colors duration-200">
      {/* Top Navigation */}
      <Navbar
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenGuide={() => setIsGuideOpen(true)}
      />

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Wizard Stepper Navigation */}
        <Stepper
          currentStep={currentStep}
          onStepChange={(step) => setCurrentStep(step)}
          isDatasetReady={isDatasetReady}
          isTrained={isTrained}
        />

        {/* Step Content Display Area with Animated Transitions */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {/* 1. DATASETS STEP */}
            {currentStep === "datasets" && (
              <div id="datasets-section" className="space-y-6">
                <DatasetStudio
                  dataset={dataset}
                  trainingRate={parameters.trainingRate}
                  sameFileForTesting={parameters.sameFileForTesting}
                  onSameFileForTestingChange={(useSame) => {
                    handleParametersChange({ sameFileForTesting: useSame });
                  }}
                />

                <div className="flex items-center justify-between pt-4 border-t border-default-200/40">
                  <div className="flex items-center gap-2 text-xs text-default-500">
                    <Sparkles className="h-4 w-4 text-sky-500" />
                    <span>Selecione um preset ou envie um CSV para avançar à arquitetura</span>
                  </div>
                  <Button
                    color="primary"
                    size="md"
                    variant="shadow"
                    endContent={<ArrowRight className="h-4 w-4" />}
                    onClick={handleNextStep}
                    className="font-semibold text-sm px-5"
                  >
                    Próximo Passo: 2. Arquitetura da Rede
                  </Button>
                </div>
              </div>
            )}

            {/* 2. PARAMETERS & TOPOLOGY STEP */}
            {currentStep === "parameters" && (
              <div id="parameters-section" className="space-y-6">
                {/* Educational Callout for Step 2 */}
                <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-purple-50/80 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-900/40 text-xs sm:text-sm text-purple-950 dark:text-purple-200 shadow-sm">
                  <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-semibold text-purple-900 dark:text-purple-100">
                      Passo 2: Defina a Estrutura da Rede e os Hiperparâmetros
                    </p>
                    <p className="text-purple-800/80 dark:text-purple-300/80 text-xs leading-relaxed">
                      Configure a camada oculta no diagrama visual abaixo, a função de ativação que calculará as saídas, e a taxa de aprendizado que determina a velocidade de ajuste dos pesos.
                    </p>
                  </div>
                </div>

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
                  isSeparateTestFile={dataset.isSeparateTestFile}
                  testSampleCount={dataset.testRawRows.length}
                  testFileName={dataset.testFileName}
                  onSeparateTestFileToggle={(separate) => {
                    dataset.setIsSeparateTestFile(separate);
                    handleParametersChange({ sameFileForTesting: !separate });
                  }}
                />

                <div className="flex items-center justify-between pt-4 border-t border-default-200/40">
                  <Button
                    variant="flat"
                    size="md"
                    startContent={<ArrowLeft className="h-4 w-4" />}
                    onClick={handlePrevStep}
                    className="font-medium text-xs sm:text-sm"
                  >
                    Passo Anterior: 1. Dados & Datasets
                  </Button>
                  <Button
                    color="secondary"
                    size="md"
                    variant="shadow"
                    endContent={<ArrowRight className="h-4 w-4" />}
                    onClick={handleNextStep}
                    className="font-semibold text-xs sm:text-sm px-5"
                  >
                    Próximo Passo: 3. Treinamento ao Vivo
                  </Button>
                </div>
              </div>
            )}

            {/* 3. LIVE TRAINING STEP */}
            {currentStep === "training" && (
              <div id="training-section" className="space-y-6">
                {/* Educational Callout for Step 3 */}
                <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-xs sm:text-sm text-amber-950 dark:text-amber-200 shadow-sm">
                  <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-semibold text-amber-900 dark:text-amber-100">
                      Passo 3: Treinamento em Tempo Real via WebSockets
                    </p>
                    <p className="text-amber-800/80 dark:text-amber-300/80 text-xs leading-relaxed">
                      Clique em <strong>Iniciar Treinamento</strong>. O backend C# executará o algoritmo de retropropagação e transmitirá as curvas de aprendizado e métricas a 60 FPS diretamente para o navegador.
                    </p>
                  </div>
                </div>

                {/* 1. Training Control Bar */}
                <TrainingControlBar
                  status={trainingSession.status}
                  connectionState={trainingSession.connectionState}
                  parameters={parameters}
                  datasetName={
                    dataset.currentPresetId
                      ? dataset.currentPresetId.toUpperCase()
                      : dataset.fileName || "CSV Personalizado"
                  }
                  datasetRowCount={dataset.rawRows.length}
                  testDatasetName={dataset.testFileName || undefined}
                  testRowCount={dataset.isSeparateTestFile ? dataset.testRawRows.length : undefined}
                  canStart={Boolean(
                    dataset.processedDataset &&
                      dataset.processedDataset.normalizedRows.length > 0
                  )}
                  onStart={() => {
                    if (dataset.processedDataset) {
                      trainingSession.startTraining(
                        parameters,
                        dataset.processedDataset,
                        dataset.testProcessedDataset
                      );
                    }
                  }}
                  onStop={trainingSession.stopTraining}
                  onReset={trainingSession.resetTraining}
                  onViewEvaluation={() => setCurrentStep("evaluation")}
                />

                {/* 2. Error Banner (if error occurred) */}
                {trainingSession.error && (
                  <Card className="border border-danger-200 bg-danger-50/50 dark:bg-danger-950/20 text-danger-700 dark:text-danger-400 p-4 rounded-2xl">
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
                            trainingSession.startTraining(
                              parameters,
                              dataset.processedDataset,
                              dataset.testProcessedDataset
                            );
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
                    <Card className="border border-success-200 bg-success-50/50 dark:bg-success-950/20 p-5 shadow-sm rounded-2xl">
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
                          onClick={() => setCurrentStep("evaluation")}
                          className="font-semibold"
                        >
                          Ver Relatório e Matriz de Confusão
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-default-200/40">
                  <Button
                    variant="flat"
                    size="md"
                    startContent={<ArrowLeft className="h-4 w-4" />}
                    onClick={handlePrevStep}
                    className="font-medium text-xs sm:text-sm"
                  >
                    Passo Anterior: 2. Arquitetura da Rede
                  </Button>
                  {isTrained && (
                    <Button
                      color="success"
                      size="md"
                      variant="shadow"
                      endContent={<ArrowRight className="h-4 w-4" />}
                      onClick={handleNextStep}
                      className="font-semibold text-xs sm:text-sm px-5"
                    >
                      Próximo Passo: 4. Avaliação & Métricas
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* 4. EVALUATION & METRICS STEP */}
            {currentStep === "evaluation" && (
              <div id="evaluation-section" className="space-y-6">
                {trainingSession.trainingResult ? (
                  <div className="space-y-6">
                    <Card className="border border-emerald-100/80 dark:border-emerald-950/40 bg-white/80 dark:bg-content1/60 backdrop-blur-md shadow-sm p-6 rounded-2xl">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="h-6 w-6" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-foreground">
                              Relatório de Desempenho do Modelo
                            </h3>
                            <p className="text-xs text-default-500">
                              Resultados computados sobre os dados de validação ({dataset.isSeparateTestFile ? "Arquivo de Teste Dedicado" : "Particionamento 70/30"})
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="flat"
                          color="primary"
                          startContent={<RotateCcw className="h-3.5 w-3.5" />}
                          onClick={() => setCurrentStep("training")}
                          className="rounded-lg"
                        >
                          Novo Treinamento
                        </Button>
                      </div>

                      {/* Performance Metric Cards */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2">
                        <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/30">
                          <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                            Acurácia Global
                          </span>
                          <p className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                            {trainingSession.trainingResult.accuracyPercentage.toFixed(2)}%
                          </p>
                        </div>
                        <div className="p-4 rounded-xl bg-sky-50/60 dark:bg-sky-950/20 border border-sky-200/50 dark:border-sky-900/30">
                          <span className="text-xs font-semibold text-sky-800 dark:text-sky-300">
                            Convergência
                          </span>
                          <p className="text-xl font-bold text-foreground">
                            {trainingSession.trainingResult.converged ? "Convergido" : "Máx Épocas"}
                          </p>
                        </div>
                        <div className="p-4 rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/50 dark:border-purple-900/30">
                          <span className="text-xs font-semibold text-purple-800 dark:text-purple-300">
                            Total de Épocas
                          </span>
                          <p className="text-2xl font-bold font-mono text-foreground">
                            {trainingSession.trainingResult.totalEpochs}
                          </p>
                        </div>
                        <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30">
                          <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                            Erro Final (MSE)
                          </span>
                          <p className="text-2xl font-bold font-mono text-foreground">
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
                  <Card className="border border-emerald-100/80 dark:border-emerald-950/40 bg-white/80 dark:bg-content1/60 backdrop-blur-md shadow-sm rounded-2xl">
                    <CardBody className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                      <div className="p-4 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <BarChart3 className="h-8 w-8" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-base font-semibold text-foreground">
                          Nenhum Modelo Treinado Ainda
                        </p>
                        <p className="text-xs text-default-500 max-w-sm">
                          Inicie o treinamento no passo "3. Treinamento ao Vivo" para que a rede neural seja calibrada e o relatório de acertos seja gerado.
                        </p>
                      </div>
                      <Button
                        color="primary"
                        variant="shadow"
                        size="sm"
                        startContent={<Play className="h-4 w-4 fill-current" />}
                        onClick={() => setCurrentStep("training")}
                        className="rounded-lg font-semibold"
                      >
                        Ir para Treinamento
                      </Button>
                    </CardBody>
                  </Card>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-default-200/40">
                  <Button
                    variant="flat"
                    size="md"
                    startContent={<ArrowLeft className="h-4 w-4" />}
                    onClick={handlePrevStep}
                    className="font-medium text-xs sm:text-sm"
                  >
                    Passo Anterior: 3. Treinamento ao Vivo
                  </Button>
                  <Button
                    color="primary"
                    variant="flat"
                    size="md"
                    startContent={<RotateCcw className="h-4 w-4" />}
                    onClick={() => setCurrentStep("datasets")}
                    className="font-medium text-xs sm:text-sm"
                  >
                    Recomeçar com Novo Dataset
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Educational MLP Guide Modal */}
      <MlpGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default App;
