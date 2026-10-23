namespace Mlp.Domain.Models;

/// <summary>
/// Representa o progresso de uma época durante o treinamento.
/// Esse modelo é perfeito para ser enviado via WebSocket (SignalR) ao frontend.
/// </summary>
public record EpochProgress(int Epoch, double AverageError);
