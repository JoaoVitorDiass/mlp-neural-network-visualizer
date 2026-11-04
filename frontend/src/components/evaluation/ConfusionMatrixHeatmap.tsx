import React from "react";
import { motion } from "framer-motion";
import { Card, CardBody, Chip, Tooltip } from "@heroui/react";
import { CheckCircle2, AlertTriangle, HelpCircle, Lightbulb } from "lucide-react";

interface ConfusionMatrixHeatmapProps {
  matrix: number[][];
  classNames?: string[];
  totalSamples?: number;
  accuracyPercentage?: number;
}

export const ConfusionMatrixHeatmap: React.FC<ConfusionMatrixHeatmapProps> = ({
  matrix,
  classNames = [],
}) => {
  if (!matrix || matrix.length === 0 || !matrix[0]) {
    return null;
  }

  const numClasses = matrix.length;

  // Resolve labels for each class (fallback to Class 0, Class 1...)
  const labels = Array.from({ length: numClasses }, (_, i) => {
    return classNames[i] ? classNames[i].replace(/^target_/, "") : `Classe ${i + 1}`;
  });

  // Calculate totals and max value for color scaling
  let maxCell = 0;
  let totalCount = 0;
  let correctCount = 0;

  const rowTotals = new Array(numClasses).fill(0);
  const colTotals = new Array(numClasses).fill(0);

  for (let r = 0; r < numClasses; r++) {
    for (let c = 0; c < numClasses; c++) {
      const val = matrix[r][c] || 0;
      if (val > maxCell) maxCell = val;
      totalCount += val;
      rowTotals[r] += val;
      colTotals[c] += val;
      if (r === c) correctCount += val;
    }
  }

  if (maxCell === 0) maxCell = 1;

  // Calculate per-class metrics (Precision, Recall, F1)
  const classMetrics = labels.map((name, i) => {
    const tp = matrix[i]?.[i] || 0;
    const actualTotal = rowTotals[i] || 0;
    const predictedTotal = colTotals[i] || 0;

    const precision = predictedTotal > 0 ? (tp / predictedTotal) * 100 : 0;
    const recall = actualTotal > 0 ? (tp / actualTotal) * 100 : 0;
    const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

    return {
      name,
      tp,
      actualTotal,
      predictedTotal,
      precision,
      recall,
      f1,
    };
  });

  return (
    <div className="space-y-6">
      {/* Educational Callout */}
      <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40 text-xs sm:text-sm text-emerald-900 dark:text-emerald-200 shadow-sm">
        <Lightbulb className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold text-emerald-950 dark:text-emerald-100">
            Passo 4: Avaliação do Modelo e Matriz de Confusão
          </p>
          <p className="text-emerald-800/80 dark:text-emerald-300/80 text-xs leading-relaxed">
            A matriz de confusão cruza os valores reais do dataset com as predições geradas pela MLP. Os blocos em verde na <strong>diagonal principal</strong> são os acertos exatos. Células fora da diagonal em tons avermelhados indicam erros onde o modelo se confundiu.
          </p>
        </div>
      </div>

      {/* Matrix Card */}
      <Card className="border border-emerald-100/80 dark:border-emerald-950/40 bg-white/80 dark:bg-content1/60 backdrop-blur-md shadow-sm rounded-2xl">
        <CardBody className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-foreground">
                  Matriz de Confusão (Heatmap)
                </h3>
                <Tooltip content="Linhas = classes reais. Colunas = classes previstas. A diagonal principal representa os acertos.">
                  <HelpCircle className="h-4 w-4 text-default-400 cursor-pointer" />
                </Tooltip>
              </div>
              <p className="text-xs text-default-500">
                Linhas = Valores Reais | Colunas = Predições do Modelo
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Chip size="sm" variant="flat" color="success" startContent={<CheckCircle2 className="h-3.5 w-3.5" />}>
                {correctCount} Acertos ({((correctCount / (totalCount || 1)) * 100).toFixed(1)}%)
              </Chip>
              {totalCount - correctCount > 0 && (
                <Chip size="sm" variant="flat" color="danger" startContent={<AlertTriangle className="h-3.5 w-3.5" />}>
                  {totalCount - correctCount} Erros
                </Chip>
              )}
            </div>
          </div>

          {/* Heatmap Grid */}
          <div className="overflow-x-auto pb-2">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full text-center border-collapse">
                <thead>
                  <tr>
                    <th className="p-2 text-xs font-semibold text-default-400 text-left">
                      Real \ Predito
                    </th>
                    {labels.map((colName, cIndex) => (
                      <th
                        key={cIndex}
                        className="p-2 text-xs font-semibold text-default-600 max-w-[120px] truncate"
                        title={colName}
                      >
                        {colName}
                      </th>
                    ))}
                    <th className="p-2 text-xs font-semibold text-default-400 border-l border-default-200/50">
                      Total Real
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {labels.map((rowName, rIndex) => (
                    <tr key={rIndex} className="border-t border-default-200/40">
                      {/* Row Header */}
                      <td
                        className="p-3 text-xs font-semibold text-default-700 dark:text-default-300 text-left whitespace-nowrap pr-4"
                        title={rowName}
                      >
                        {rowName}
                      </td>

                      {/* Matrix Cells */}
                      {matrix[rIndex].map((val, cIndex) => {
                        const isDiagonal = rIndex === cIndex;

                        let cellClass = "";
                        if (isDiagonal) {
                          if (val === 0) {
                            cellClass = "bg-default-50 dark:bg-default-100/20 text-default-400";
                          } else {
                            cellClass = "bg-emerald-100/80 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800 font-bold";
                          }
                        } else {
                          if (val > 0) {
                            cellClass = "bg-rose-100/80 text-rose-800 dark:bg-rose-950/50 dark:text-rose-200 border-rose-300 dark:border-rose-900/50 font-semibold";
                          } else {
                            cellClass = "bg-default-50/50 dark:bg-default-100/10 text-default-400";
                          }
                        }

                        return (
                          <td key={cIndex} className="p-2">
                            <Tooltip
                              content={
                                <div className="p-1 text-xs">
                                  <p className="font-bold">
                                    Real: {rowName} | Predito: {labels[cIndex]}
                                  </p>
                                  <p className="text-default-500">
                                    {val} amostra(s) ({((val / (rowTotals[rIndex] || 1)) * 100).toFixed(1)}% da classe real)
                                  </p>
                                </div>
                              }
                            >
                              <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.2, delay: (rIndex * numClasses + cIndex) * 0.02 }}
                                className={`rounded-xl py-3 px-2 transition-transform hover:scale-105 cursor-pointer shadow-sm border ${cellClass}`}
                              >
                                <span className="text-sm font-mono">{val}</span>
                              </motion.div>
                            </Tooltip>
                          </td>
                        );
                      })}

                      {/* Row Total */}
                      <td className="p-3 text-xs font-mono font-medium text-default-500 border-l border-default-200/50">
                        {rowTotals[rIndex]}
                      </td>
                    </tr>
                  ))}

                  {/* Column Totals Row */}
                  <tr className="border-t-2 border-default-200/60 font-medium">
                    <td className="p-3 text-xs font-semibold text-default-400 text-left">
                      Total Predito
                    </td>
                    {colTotals.map((colTotal, cIndex) => (
                      <td key={cIndex} className="p-2 text-xs font-mono text-default-500">
                        {colTotal}
                      </td>
                    ))}
                    <td className="p-3 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 border-l border-default-200/50">
                      {totalCount}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Per-Class Detailed Metrics Table */}
      <Card className="border border-emerald-100/80 dark:border-emerald-950/40 bg-white/80 dark:bg-content1/60 backdrop-blur-md shadow-sm rounded-2xl">
        <CardBody className="p-6 space-y-4">
          <h4 className="text-sm font-bold text-foreground">
            Métricas Detalhadas por Classe (Precisão, Recall e F1-Score)
          </h4>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-default-200/50 text-default-400 font-semibold">
                  <th className="py-2.5 px-3">Classe</th>
                  <th className="py-2.5 px-3">Amostras Reais</th>
                  <th className="py-2.5 px-3">Acertos (TP)</th>
                  <th className="py-2.5 px-3">Precisão</th>
                  <th className="py-2.5 px-3">Recall (Sensibilidade)</th>
                  <th className="py-2.5 px-3">F1-Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-default-100">
                {classMetrics.map((cm, idx) => (
                  <tr key={idx} className="hover:bg-default-50/50 dark:hover:bg-default-100/10 transition-colors">
                    <td className="py-3 px-3 font-medium text-foreground">{cm.name}</td>
                    <td className="py-3 px-3 font-mono text-default-500">{cm.actualTotal}</td>
                    <td className="py-3 px-3 font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{cm.tp}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium">{cm.precision.toFixed(1)}%</span>
                        <div className="w-16 h-1.5 bg-default-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${Math.min(100, cm.precision)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium">{cm.recall.toFixed(1)}%</span>
                        <div className="w-16 h-1.5 bg-default-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-sky-500 rounded-full"
                            style={{ width: `${Math.min(100, cm.recall)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium">{cm.f1.toFixed(1)}%</span>
                        <div className="w-16 h-1.5 bg-default-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-purple-500 rounded-full"
                            style={{ width: `${Math.min(100, cm.f1)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};
