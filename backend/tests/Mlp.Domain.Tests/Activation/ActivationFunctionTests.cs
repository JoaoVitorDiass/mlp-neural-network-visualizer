using Mlp.Domain.Activation;
using Xunit;

namespace Mlp.Domain.Tests.Activation;

public class ActivationFunctionTests
{
    [Fact]
    public void Sigmoid_Activate_ZeroNet_ShouldReturnHalf()
    {
        // Arrange
        var sigmoid = new SigmoidActivation();

        // Act
        var result = sigmoid.Activate(0.0);

        // Assert
        Assert.Equal(0.5, result, precision: 4);
    }

    [Fact]
    public void Sigmoid_Derivative_HalfOutput_ShouldReturnQuarter()
    {
        // Arrange
        var sigmoid = new SigmoidActivation();

        // Act
        var result = sigmoid.Derivative(0.5);

        // Assert (0.5 * (1 - 0.5) = 0.25)
        Assert.Equal(0.25, result, precision: 4);
    }

    [Fact]
    public void HyperbolicTangent_Activate_ZeroNet_ShouldReturnZero()
    {
        // Arrange
        var tanh = new HyperbolicTangentActivation();

        // Act
        var result = tanh.Activate(0.0);

        // Assert
        Assert.Equal(0.0, result, precision: 4);
    }

    [Fact]
    public void HyperbolicTangent_Derivative_ZeroOutput_ShouldReturnOne()
    {
        // Arrange
        var tanh = new HyperbolicTangentActivation();

        // Act
        var result = tanh.Derivative(0.0);

        // Assert (1 - 0^2 = 1.0)
        Assert.Equal(1.0, result, precision: 4);
    }

    [Theory]
    [InlineData("Logistica", typeof(SigmoidActivation))]
    [InlineData("Hiperbólica", typeof(HyperbolicTangentActivation))]
    [InlineData("hiperbolica", typeof(HyperbolicTangentActivation))]
    [InlineData("Linear", typeof(LinearActivation))]
    [InlineData("desconhecido", typeof(SigmoidActivation))]
    public void Factory_ShouldResolveCorrectType(string inputName, Type expectedType)
    {
        // Act
        var activation = ActivationFunctionFactory.Create(inputName);

        // Assert
        Assert.IsType(expectedType, activation);
    }
}
