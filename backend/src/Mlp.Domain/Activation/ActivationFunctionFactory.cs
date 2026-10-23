namespace Mlp.Domain.Activation;

/// <summary>
/// Factory para instanciar a função de ativação correspondente pelo nome vindo do frontend.
/// </summary>
public static class ActivationFunctionFactory
{
    public static IActivationFunction Create(string? name)
    {
        return name?.Trim().ToLowerInvariant() switch
        {
            "hiperbólica" or "hiperbolica" or "tanh" => new HyperbolicTangentActivation(),
            "linear" => new LinearActivation(),
            _ => new SigmoidActivation() // Padrão: Logística / Sigmoide
        };
    }
}
