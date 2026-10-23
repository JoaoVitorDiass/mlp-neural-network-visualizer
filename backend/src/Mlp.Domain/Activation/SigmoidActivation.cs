namespace Mlp.Domain.Activation;

/// <summary>
/// Função Sigmoide / Logística: varia entre 0.0 e 1.0.
/// </summary>
public sealed class SigmoidActivation : IActivationFunction
{
    public string Name => "Logistica";

    public double Activate(double net) => 1.0 / (1.0 + Math.Exp(-net));

    public double Derivative(double output) => output * (1.0 - output);
}
