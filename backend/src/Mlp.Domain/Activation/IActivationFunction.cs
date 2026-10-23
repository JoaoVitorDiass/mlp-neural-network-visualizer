namespace Mlp.Domain.Activation;

/// <summary>
/// Contrato para funções de ativação e suas respectivas derivadas (necessárias no backpropagation).
/// </summary>
public interface IActivationFunction
{
    string Name { get; }

    /// <summary>
    /// Calcula o valor ativado (saída) dado o somatório ponderado (net).
    /// </summary>
    double Activate(double net);

    /// <summary>
    /// Calcula a derivada com base no valor de saída já ativado (fnet).
    /// </summary>
    double Derivative(double output);
}
