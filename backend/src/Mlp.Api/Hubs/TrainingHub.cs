using Microsoft.AspNetCore.SignalR;

namespace Mlp.Api.Hubs;

/// <summary>
/// Hub SignalR para comunicação bidirecional em tempo real (WebSockets).
/// </summary>
public class TrainingHub : Hub
{
    /// <summary>
    /// Permite que um cliente entre em uma sessão específica para receber notificações isoladas.
    /// </summary>
    public async Task JoinSession(string sessionId)
    {
        if (!string.IsNullOrWhiteSpace(sessionId))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, sessionId);
        }
    }

    /// <summary>
    /// Permite que o cliente saia da sessão quando terminar.
    /// </summary>
    public async Task LeaveSession(string sessionId)
    {
        if (!string.IsNullOrWhiteSpace(sessionId))
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, sessionId);
        }
    }
}
