namespace Mlp.Application.DTOs;

public record AverageErrorPointDto(
    int Epoch,
    double AvarageError
);

public record RunPerceptronDataResponse(
    IReadOnlyList<AverageErrorPointDto> ArrAvaregeError,
    int[][] ConfusionMatrix,
    double AccuracyPercentage,
    int TotalEpochs,
    double FinalError,
    bool Converged
);

public record RunPerceptronResponse(
    string Message,
    RunPerceptronDataResponse Data
);
