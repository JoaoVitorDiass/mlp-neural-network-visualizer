namespace Mlp.Domain.Models;

/// <summary>
/// Resultado da etapa de testes e avaliação do modelo com a matriz de confusão.
/// </summary>
public record EvaluationResult(
    int[][] ConfusionMatrix,
    int TotalSamples,
    int CorrectPredictions,
    double AccuracyPercentage
);
