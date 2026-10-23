namespace Mlp.Application.DTOs;

/// <summary>
/// Requisição enviada pelo frontend contendo os parâmetros e as linhas de dados.
/// </summary>
public record RunPerceptronRequest(
    MlpParametersDto Parameters,
    List<Dictionary<string, double>> Data,
    List<Dictionary<string, double>>? DataToTest = null,
    string? SessionId = null
);
