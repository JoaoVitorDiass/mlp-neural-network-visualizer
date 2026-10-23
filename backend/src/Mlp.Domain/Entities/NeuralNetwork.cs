using Mlp.Domain.Activation;
using Mlp.Domain.Models;

namespace Mlp.Domain.Entities;

/// <summary>
/// Implementação de uma Rede Neural Perceptron Multicamadas (Multi-Layer Perceptron).
/// </summary>
public class NeuralNetwork
{
    public int InputSize { get; }
    public int HiddenSize { get; }
    public int OutputSize { get; }
    public double LearningRate { get; }
    public IActivationFunction Activation { get; }

    // Matrizes de pesos
    // [i, j]: peso da entrada i para o neurônio oculto j
    public double[,] WeightsInputToHidden { get; }

    // [j, k]: peso do neurônio oculto j para o neurônio de saída k
    public double[,] WeightsHiddenToOutput { get; }

    // Estados dos neurônios
    private readonly double[] _hiddenNet;
    private readonly double[] _hiddenOutput;
    private readonly double[] _hiddenError;

    private readonly double[] _outputNet;
    private readonly double[] _outputOutput;
    private readonly double[] _outputError;

    public NeuralNetwork(
        int inputSize,
        int hiddenSize,
        int outputSize,
        double learningRate,
        IActivationFunction activation,
        Random? random = null)
    {
        if (inputSize <= 0) throw new ArgumentOutOfRangeException(nameof(inputSize), "A camada de entrada deve ter pelo menos 1 neurônio.");
        if (hiddenSize <= 0) throw new ArgumentOutOfRangeException(nameof(hiddenSize), "A camada oculta deve ter pelo menos 1 neurônio.");
        if (outputSize <= 0) throw new ArgumentOutOfRangeException(nameof(outputSize), "A camada de saída deve ter pelo menos 1 neurônio.");
        if (learningRate <= 0) throw new ArgumentOutOfRangeException(nameof(learningRate), "A taxa de aprendizado deve ser positiva.");

        InputSize = inputSize;
        HiddenSize = hiddenSize;
        OutputSize = outputSize;
        LearningRate = learningRate;
        Activation = activation ?? throw new ArgumentNullException(nameof(activation));

        WeightsInputToHidden = new double[inputSize, hiddenSize];
        WeightsHiddenToOutput = new double[hiddenSize, outputSize];

        _hiddenNet = new double[hiddenSize];
        _hiddenOutput = new double[hiddenSize];
        _hiddenError = new double[hiddenSize];

        _outputNet = new double[outputSize];
        _outputOutput = new double[outputSize];
        _outputError = new double[outputSize];

        InitializeWeights(random ?? Random.Shared);
    }

    private void InitializeWeights(Random rng)
    {
        bool isHyperbolic = Activation is HyperbolicTangentActivation;

        // Pesos entrada -> oculta
        for (int i = 0; i < InputSize; i++)
        {
            for (int j = 0; j < HiddenSize; j++)
            {
                WeightsInputToHidden[i, j] = isHyperbolic
                    ? (rng.NextDouble() * 2.0 - 1.0)
                    : rng.NextDouble();
            }
        }

        // Pesos oculta -> saída
        for (int j = 0; j < HiddenSize; j++)
        {
            for (int k = 0; k < OutputSize; k++)
            {
                WeightsHiddenToOutput[j, k] = isHyperbolic
                    ? (rng.NextDouble() * 2.0 - 1.0)
                    : rng.NextDouble();
            }
        }
    }

    /// <summary>
    /// Propagação direta (Forward Pass).
    /// </summary>
    public double[] Forward(double[] inputs)
    {
        if (inputs.Length != InputSize)
            throw new ArgumentException($"O vetor de entrada deve ter tamanho {InputSize}.", nameof(inputs));

        // 1. Camada Oculta
        for (int j = 0; j < HiddenSize; j++)
        {
            double sum = 0.0;
            for (int i = 0; i < InputSize; i++)
            {
                sum += inputs[i] * WeightsInputToHidden[i, j];
            }
            _hiddenNet[j] = sum;
            _hiddenOutput[j] = Activation.Activate(sum);
        }

        // 2. Camada de Saída
        double[] outputResult = new double[OutputSize];
        for (int k = 0; k < OutputSize; k++)
        {
            double sum = 0.0;
            for (int j = 0; j < HiddenSize; j++)
            {
                sum += _hiddenOutput[j] * WeightsHiddenToOutput[j, k];
            }
            _outputNet[k] = sum;
            _outputOutput[k] = Activation.Activate(sum);
            outputResult[k] = _outputOutput[k];
        }

        return outputResult;
    }

    /// <summary>
    /// Executa o passo de retropropagação (Backpropagation) para uma única amostra de treino.
    /// Retorna o erro quadrático calculado para essa amostra.
    /// </summary>
    public double TrainSample(double[] inputs, double[] targets)
    {
        if (targets.Length != OutputSize)
            throw new ArgumentException($"O vetor de saída esperada deve ter tamanho {OutputSize}.", nameof(targets));

        // 1. Forward pass
        Forward(inputs);

        // 2. Erro dos neurônios de saída: (Target - Output) * f'(Output)
        for (int k = 0; k < OutputSize; k++)
        {
            double target = targets[k];
            double output = _outputOutput[k];
            _outputError[k] = (target - output) * Activation.Derivative(output);
        }

        // 3. Erro dos neurônios ocultos: (Sum_k(error_k * W_jk)) * f'(Output_j)
        for (int j = 0; j < HiddenSize; j++)
        {
            double sum = 0.0;
            for (int k = 0; k < OutputSize; k++)
            {
                sum += _outputError[k] * WeightsHiddenToOutput[j, k];
            }
            _hiddenError[j] = sum * Activation.Derivative(_hiddenOutput[j]);
        }

        // 4. Métrica de erro da amostra: 0.5 * (Sum_k error_k)^2 (fiel ao algoritmo original)
        double totalOutputError = 0.0;
        for (int k = 0; k < OutputSize; k++)
        {
            totalOutputError += _outputError[k];
        }
        double sampleError = 0.5 * Math.Pow(totalOutputError, 2);

        // 5. Atualização dos pesos Oculta -> Saída: W_jk += lr * error_k * output_j
        for (int j = 0; j < HiddenSize; j++)
        {
            for (int k = 0; k < OutputSize; k++)
            {
                WeightsHiddenToOutput[j, k] += LearningRate * _outputError[k] * _hiddenOutput[j];
            }
        }

        // 6. Atualização dos pesos Entrada -> Oculta: W_ij += lr * error_j * input_i
        for (int i = 0; i < InputSize; i++)
        {
            for (int j = 0; j < HiddenSize; j++)
            {
                WeightsInputToHidden[i, j] += LearningRate * _hiddenError[j] * inputs[i];
            }
        }

        return sampleError;
    }

    /// <summary>
    /// Treina a rede por múltiplas épocas até o erro convergir ou atingir o limite de épocas.
    /// Suporta um callback para streaming do progresso (perfeito para WebSocket).
    /// </summary>
    public TrainingResult Train(
        double[][] inputs,
        double[][] targets,
        int maxEpochs,
        double targetMinError,
        Action<EpochProgress>? onEpochProgress = null,
        int progressReportInterval = 10)
    {
        if (inputs.Length == 0 || inputs.Length != targets.Length)
            throw new ArgumentException("Conjunto de dados de entrada e saídas esperadas inválido.");

        var history = new List<EpochProgress>();
        double currentAverageError = double.PositiveInfinity;
        int epoch = 0;

        while (epoch < maxEpochs && currentAverageError > targetMinError)
        {
            double epochErrorSum = 0.0;

            for (int i = 0; i < inputs.Length; i++)
            {
                epochErrorSum += TrainSample(inputs[i], targets[i]);
            }

            currentAverageError = epochErrorSum / inputs.Length;
            epoch++;

            // Emite progresso nos intervalos ou no término
            if (epoch % progressReportInterval == 0 || epoch == 1 || epoch == maxEpochs || currentAverageError <= targetMinError)
            {
                var progress = new EpochProgress(epoch, currentAverageError);
                history.Add(progress);
                onEpochProgress?.Invoke(progress);
            }
        }

        return new TrainingResult(
            TotalEpochs: epoch,
            FinalAverageError: currentAverageError,
            Converged: currentAverageError <= targetMinError,
            History: history
        );
    }

    /// <summary>
    /// Avalia a rede contra dados de teste e constrói a matriz de confusão e acurácia.
    /// </summary>
    public EvaluationResult Evaluate(double[][] testInputs, double[][] testTargets)
    {
        if (testInputs.Length == 0 || testInputs.Length != testTargets.Length)
            throw new ArgumentException("Conjunto de teste inválido.");

        // Inicializa a matriz de confusão [OutputSize x OutputSize]
        int[][] confusionMatrix = new int[OutputSize][];
        for (int k = 0; k < OutputSize; k++)
        {
            confusionMatrix[k] = new int[OutputSize];
        }

        int correctPredictions = 0;

        for (int i = 0; i < testInputs.Length; i++)
        {
            double[] predictedOutputs = Forward(testInputs[i]);
            double[] expectedOutputs = testTargets[i];

            int predictedClass = ArgMax(predictedOutputs);
            int expectedClass = ArgMax(expectedOutputs);

            confusionMatrix[expectedClass][predictedClass]++;

            if (predictedClass == expectedClass)
            {
                correctPredictions++;
            }
        }

        double accuracy = ((double)correctPredictions / testInputs.Length) * 100.0;

        return new EvaluationResult(
            ConfusionMatrix: confusionMatrix,
            TotalSamples: testInputs.Length,
            CorrectPredictions: correctPredictions,
            AccuracyPercentage: accuracy
        );
    }

    private static int ArgMax(double[] vector)
    {
        int maxIndex = 0;
        double maxValue = vector[0];

        for (int i = 1; i < vector.Length; i++)
        {
            if (vector[i] > maxValue)
            {
                maxValue = vector[i];
                maxIndex = i;
            }
        }

        return maxIndex;
    }
}
