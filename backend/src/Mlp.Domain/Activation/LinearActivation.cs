namespace Mlp.Domain.Activation;

/// <summary>
/// Função Linear: f(net) = net / 10.0.
/// </summary>
public sealed class LinearActivation : IActivationFunction
{
    public string Name => "Linear";

    public double Activate(double net) => net / 10.0;

    public double Derivative(double output) => 1.0 / 10.0;
}
