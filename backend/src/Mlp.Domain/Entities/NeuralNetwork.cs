using Mlp.Domain.Activation;
using Mlp.Domain.Models;

namespace Mlp.Domain.Entities;

/// <summary>
/// Implementação robusta de uma Rede Neural Perceptron Multicamadas (Multi-Layer Perceptron)
/// com retropropagação (backpropagation), neurônios de bias e cálculo correto de erro quadrático (SSE/MSE).
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

    // Pesos de Bias
    public double[] BiasHidden { get; }
    public double[] BiasOutput { get; }

    // Estados internos dos neurônios
    private readonly double[] _hiddenNet;
    private readonly double[] _hiddenOutput;
    private readonly double[] _hiddenError;

    private readonly double[] _outputNet;
    private readonly double[] _outputOutput;
    private readonly double[] _outputError;

    private readonly Random _rng;

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
        _rng = random ?? Random.Shared;

        WeightsInputToHidden = new double[inputSize, hiddenSize];
        WeightsHiddenToOutput = new double[hiddenSize, outputSize];

        BiasHidden = new double[hiddenSize];
        BiasOutput = new double[outputSize];

        _hiddenNet = new double[hiddenSize];
        _hiddenOutput = new double[hiddenSize];
        _hiddenError = new double[hiddenSize];

        _outputNet = new double[outputSize];
        _outputOutput = new double[outputSize];
        _outputError = new double[outputSize];

        InitializeWeights(_rng);
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
                    : (rng.NextDouble() * 2.0 - 1.0) * (2.0 / Math.Sqrt(InputSize));
            }
        }

        // Bias camada oculta
        for (int j = 0; j < HiddenSize; j++)
        {
            BiasHidden[j] = isHyperbolic
                ? (rng.NextDouble() * 2.0 - 1.0) * 0.1
                : (rng.NextDouble() * 0.2 - 0.1);
        }

        // Pesos oculta -> saída
        for (int j = 0; j < HiddenSize; j++)
        {
            for (int k = 0; k < OutputSize; k++)
            {
                WeightsHiddenToOutput[j, k] = isHyperbolic
                    ? (rng.NextDouble() * 2.0 - 1.0)
                    : (rng.NextDouble() * 2.0 - 1.0) * (2.0 / Math.Sqrt(HiddenSize));
            }
        }

        // Bias camada de saída
        for (int k = 0; k < OutputSize; k++)
        {
            BiasOutput[k] = isHyperbolic
                ? (rng.NextDouble() * 2.0 - 1.0) * 0.1
                : (rng.NextDouble() * 0.2 - 0.1);
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
            double sum = BiasHidden[j];
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
            double sum = BiasOutput[k];
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
    /// Retorna o erro quadrático (SSE) = 0.5 * sum((target - output)^2) para essa amostra.
    /// </summary>
    public double TrainSample(double[] inputs, double[] targets)
    {
        if (targets.Length != OutputSize)
            throw new ArgumentException($"O vetor de saída esperada deve ter tamanho {OutputSize}.", nameof(targets));

        // 1. Forward pass
        Forward(inputs);

        // 2. Erro dos neurônios de saída: delta_k = (target_k - output_k) * f'(output_k)
        for (int k = 0; k < OutputSize; k++)
        {
            double diff = targets[k] - _outputOutput[k];
            _outputError[k] = diff * Activation.Derivative(_outputOutput[k]);
        }

        // 3. Erro dos neurônios ocultos: delta_j = (sum_k delta_k * W_jk) * f'(output_j)
        for (int j = 0; j < HiddenSize; j++)
        {
            double sum = 0.0;
            for (int k = 0; k < OutputSize; k++)
            {
                sum += _outputError[k] * WeightsHiddenToOutput[j, k];
            }
            _hiddenError[j] = sum * Activation.Derivative(_hiddenOutput[j]);
        }

        // 4. Métrica de erro da amostra (Sum of Squared Errors - SSE):
        // E = 0.5 * sum_k (target_k - output_k)^2
        // Garante que erros positivos e negativos nunca se anulem indevidamente.
        double sumSquaredError = 0.0;
        for (int k = 0; k < OutputSize; k++)
        {
            double diff = targets[k] - _outputOutput[k];
            sumSquaredError += diff * diff;
        }
        double sampleError = 0.5 * sumSquaredError;

        // 5. Atualização dos pesos e bias: Camada Oculta -> Saída
        // W_jk += lr * delta_k * output_j
        // B_k  += lr * delta_k
        for (int k = 0; k < OutputSize; k++)
        {
            BiasOutput[k] += LearningRate * _outputError[k];
            for (int j = 0; j < HiddenSize; j++)
            {
                WeightsHiddenToOutput[j, k] += LearningRate * _outputError[k] * _hiddenOutput[j];
            }
        }

        // 6. Atualização dos pesos e bias: Camada de Entrada -> Oculta
        // W_ij += lr * delta_j * input_i
        // B_j  += lr * delta_j
        for (int j = 0; j < HiddenSize; j++)
        {
            BiasHidden[j] += LearningRate * _hiddenError[j];
            for (int i = 0; i < InputSize; i++)
            {
                WeightsInputToHidden[i, j] += LearningRate * _hiddenError[j] * inputs[i];
            }
        }

        return sampleError;
    }

    /// <summary>
    /// Treina a rede por múltiplas épocas até o erro convergir ou atingir o limite de épocas.
    /// Utiliza embaralhamento estocástico por época (SGD) para evitar viés de sequência de classes.
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

        int n = inputs.Length;
        int[] indices = new int[n];
        for (int i = 0; i < n; i++) indices[i] = i;

        while (epoch < maxEpochs && currentAverageError > targetMinError)
        {
            // Embaralhamento estocástico (Fisher-Yates) por época
            for (int i = n - 1; i > 0; i--)
            {
                int swapIdx = _rng.Next(i + 1);
                (indices[i], indices[swapIdx]) = (indices[swapIdx], indices[i]);
            }

            double epochErrorSum = 0.0;

            for (int idx = 0; idx < n; idx++)
            {
                int i = indices[idx];
                epochErrorSum += TrainSample(inputs[i], targets[i]);
            }

            currentAverageError = epochErrorSum / n;
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
