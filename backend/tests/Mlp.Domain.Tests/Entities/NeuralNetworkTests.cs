using Mlp.Domain.Activation;
using Mlp.Domain.Entities;
using Mlp.Domain.Models;
using Xunit;

namespace Mlp.Domain.Tests.Entities;

public class NeuralNetworkTests
{
    [Fact]
    public void Constructor_InvalidParameters_ShouldThrowException()
    {
        var activation = new SigmoidActivation();

        Assert.Throws<ArgumentOutOfRangeException>(() => new NeuralNetwork(0, 2, 1, 0.1, activation));
        Assert.Throws<ArgumentOutOfRangeException>(() => new NeuralNetwork(2, 0, 1, 0.1, activation));
        Assert.Throws<ArgumentOutOfRangeException>(() => new NeuralNetwork(2, 2, 0, 0.1, activation));
        Assert.Throws<ArgumentOutOfRangeException>(() => new NeuralNetwork(2, 2, 1, -0.1, activation));
    }

    [Fact]
    public void Forward_ShouldReturnOutputOfCorrectSize()
    {
        // Arrange: 3 inputs, 4 hidden, 2 outputs
        var network = new NeuralNetwork(3, 4, 2, 0.1, new SigmoidActivation());
        double[] input = [0.5, 0.1, 0.9];

        // Act
        var output = network.Forward(input);

        // Assert
        Assert.Equal(2, output.Length);
        Assert.InRange(output[0], 0.0, 1.0);
        Assert.InRange(output[1], 0.0, 1.0);
    }

    [Fact]
    public void Train_LogicalAndProblem_ShouldDecreaseErrorAndInvokeCallback()
    {
        // Arrange
        // Porta AND com 2 classes one-hot: [1, 0] = Falso, [0, 1] = Verdadeiro
        double[][] inputs =
        [
            [0.0, 0.0],
            [0.0, 1.0],
            [1.0, 0.0],
            [1.0, 1.0]
        ];

        double[][] targets =
        [
            [1.0, 0.0],
            [1.0, 0.0],
            [1.0, 0.0],
            [0.0, 1.0]
        ];

        var network = new NeuralNetwork(
            inputSize: 2,
            hiddenSize: 4,
            outputSize: 2,
            learningRate: 0.5,
            activation: new SigmoidActivation(),
            random: new Random(42) // Seed fixa para reprodutibilidade
        );

        var progressCalls = new List<EpochProgress>();

        // Act
        var result = network.Train(
            inputs,
            targets,
            maxEpochs: 200,
            targetMinError: 0.001,
            onEpochProgress: progress => progressCalls.Add(progress),
            progressReportInterval: 20
        );

        // Assert
        Assert.True(progressCalls.Count > 0, "O callback de progresso deve ser invocado durante as épocas.");
        Assert.True(result.TotalEpochs > 0);
        Assert.True(result.FinalAverageError < progressCalls[0].AverageError, "O erro final deve ser menor que o inicial.");
    }

    [Fact]
    public void Evaluate_ShouldReturnCorrectConfusionMatrixDimensions()
    {
        // Arrange
        var network = new NeuralNetwork(2, 3, 2, 0.1, new SigmoidActivation(), new Random(42));
        double[][] testInputs =
        [
            [0.1, 0.2],
            [0.8, 0.9]
        ];
        double[][] testTargets =
        [
            [1.0, 0.0],
            [0.0, 1.0]
        ];

        // Act
        var eval = network.Evaluate(testInputs, testTargets);

        // Assert
        Assert.Equal(2, eval.TotalSamples);
        Assert.Equal(2, eval.ConfusionMatrix.Length);
        Assert.Equal(2, eval.ConfusionMatrix[0].Length);
        Assert.InRange(eval.AccuracyPercentage, 0.0, 100.0);
    }

    [Fact]
    public void Train_XorProblem_ShouldConverge()
    {
        // Arrange: XOR (Problema não-linear clássico que exige neurônios de bias e camada oculta)
        double[][] inputs =
        [
            [0.0, 0.0],
            [0.0, 1.0],
            [1.0, 0.0],
            [1.0, 1.0]
        ];

        double[][] targets =
        [
            [0.0],
            [1.0],
            [1.0],
            [0.0]
        ];

        var network = new NeuralNetwork(
            inputSize: 2,
            hiddenSize: 4,
            outputSize: 1,
            learningRate: 0.5,
            activation: new SigmoidActivation(),
            random: new Random(42)
        );

        // Act
        var result = network.Train(
            inputs,
            targets,
            maxEpochs: 2000,
            targetMinError: 0.01
        );

        // Assert
        Assert.True(result.FinalAverageError < 0.05, $"O erro final {result.FinalAverageError} deve ser menor que 0.05.");
        for (int i = 0; i < inputs.Length; i++)
        {
            double output = network.Forward(inputs[i])[0];
            double expected = targets[i][0];
            Assert.True(Math.Abs(output - expected) < 0.3, $"Amostra {i}: output {output} diverge de {expected}.");
        }
    }
}
