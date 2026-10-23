using Mlp.Application.DTOs;
using Mlp.Application.Interfaces;
using Mlp.Application.Services;
using Xunit;

namespace Mlp.Domain.Tests.Services;

public class MlpServiceTests
{
    private class TestNotifier : ITrainingNotifier
    {
        public List<(string? SessionId, int Epoch, double Error)> Notifications { get; } = [];

        public Task NotifyEpochProgressAsync(
            string? sessionId,
            int epoch,
            double averageError,
            CancellationToken cancellationToken = default)
        {
            Notifications.Add((sessionId, epoch, averageError));
            return Task.CompletedTask;
        }
    }

    [Fact]
    public async Task RunPerceptronAsync_ValidRequest_ShouldTrainAndReturnOk()
    {
        // Arrange
        var notifier = new TestNotifier();
        var service = new MlpService(notifier);

        var parameters = new MlpParametersDto(
            InputLayer: 2,
            HiddenLayer: 3,
            OutputLayer: 2,
            FirstClassColumn: 2,
            LearningRate: 0.3,
            ErrorValue: 0.01,
            Epochs: 100,
            TransferFunction: "Logistica",
            TrainingRate: 1.0,
            SameFileForTesting: true
        );

        var data = new List<Dictionary<string, double>>
        {
            new() { ["x1"] = 0.0, ["x2"] = 0.0, ["y1"] = 1.0, ["y2"] = 0.0 },
            new() { ["x1"] = 1.0, ["x2"] = 1.0, ["y1"] = 0.0, ["y2"] = 1.0 }
        };

        var request = new RunPerceptronRequest(
            Parameters: parameters,
            Data: data,
            SessionId: "test-session-123"
        );

        // Act
        var response = await service.RunPerceptronAsync(request);

        // Assert
        Assert.Equal("OK", response.Message);
        Assert.NotNull(response.Data);
        Assert.NotEmpty(response.Data.ArrAvaregeError);
        Assert.Equal(2, response.Data.ConfusionMatrix.Length);
        Assert.InRange(response.Data.AccuracyPercentage, 0.0, 100.0);
        Assert.True(notifier.Notifications.Count > 0, "O notificador deve receber progresso de épocas.");
        Assert.All(notifier.Notifications, n => Assert.Equal("test-session-123", n.SessionId));
    }
}
