namespace Mlp.Application.DTOs;

/// <summary>
/// Parâmetros de hiperparâmetros configurados pelo usuário na tela.
/// </summary>
public record MlpParametersDto(
    int InputLayer,
    int HiddenLayer,
    int OutputLayer,
    int FirstClassColumn,
    double LearningRate,
    double ErrorValue,
    int Epochs,
    string TransferFunction,
    double TrainingRate = 0.7,
    bool SameFileForTesting = true
);
