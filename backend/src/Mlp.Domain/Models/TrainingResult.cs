namespace Mlp.Domain.Models;

/// <summary>
/// Resultado final retornado após o término do treinamento.
/// </summary>
public record TrainingResult(
    int TotalEpochs,
    double FinalAverageError,
    bool Converged,
    IReadOnlyList<EpochProgress> History
);
