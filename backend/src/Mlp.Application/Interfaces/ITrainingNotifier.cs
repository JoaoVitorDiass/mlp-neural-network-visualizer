namespace Mlp.Application.Interfaces;

/// <summary>
/// Contrato para notificação em tempo real do progresso das épocas.
/// Na Clean Architecture, a Application não conhece SignalR;
/// a implementação concreta reside na camada de apresentação/Api.
/// </summary>
public interface ITrainingNotifier
{
    Task NotifyEpochProgressAsync(
        string? sessionId,
        int epoch,
        double averageError,
        CancellationToken cancellationToken = default
    );
}
