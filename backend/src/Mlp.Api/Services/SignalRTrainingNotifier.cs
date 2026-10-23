using Microsoft.AspNetCore.SignalR;
using Mlp.Api.Hubs;
using Mlp.Application.Interfaces;

namespace Mlp.Api.Services;

/// <summary>
/// Implementação concreta do notificador usando SignalR.
/// </summary>
public class SignalRTrainingNotifier : ITrainingNotifier
{
    private readonly IHubContext<TrainingHub> _hubContext;

    public SignalRTrainingNotifier(IHubContext<TrainingHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task NotifyEpochProgressAsync(
        string? sessionId,
        int epoch,
        double averageError,
        CancellationToken cancellationToken = default)
    {
        var payload = new
        {
            epoch,
            avarageError = averageError // mantendo 'avarageError' para compatibilidade perfeita com o frontend
        };

        if (!string.IsNullOrWhiteSpace(sessionId))
        {
            await _hubContext.Clients.Group(sessionId)
                .SendAsync("ReceiveEpochProgress", payload, cancellationToken);
        }
        else
        {
            await _hubContext.Clients.All
                .SendAsync("ReceiveEpochProgress", payload, cancellationToken);
        }
    }
}
