namespace Mlp.Domain.Activation;

/// <summary>
/// Função Tangente Hiperbólica (Tanh): varia entre -1.0 e 1.0.
/// </summary>
public sealed class HyperbolicTangentActivation : IActivationFunction
{
    public string Name => "Hiperbolica";

    public double Activate(double net) => Math.Tanh(net);

    public double Derivative(double output) => 1.0 - Math.Pow(output, 2);
}
