using Mlp.Application.DTOs;
using Mlp.Application.Interfaces;
using Mlp.Domain.Activation;
using Mlp.Domain.Entities;

namespace Mlp.Application.Services;

public class MlpService : IMlpService
{
    private readonly ITrainingNotifier _notifier;

    public MlpService(ITrainingNotifier notifier)
    {
        _notifier = notifier ?? throw new ArgumentNullException(nameof(notifier));
    }

    public async Task<RunPerceptronResponse> RunPerceptronAsync(
        RunPerceptronRequest request,
        CancellationToken cancellationToken = default)
    {
        var parameters = request.Parameters;
        var rawData = request.Data;

        if (rawData == null || rawData.Count == 0)
            throw new ArgumentException("Os dados de entrada não podem estar vazios.", nameof(request));

        // 1. Resolução da função de ativação via Factory
        var activation = ActivationFunctionFactory.Create(parameters.TransferFunction);

        // 2. Separação dos dados de treino e teste
        var (trainInputs, trainTargets, testInputs, testTargets) = PrepareDatasets(request);

        // 3. Instanciação da Rede Neural do Domínio
        var network = new NeuralNetwork(
            inputSize: parameters.InputLayer,
            hiddenSize: parameters.HiddenLayer,
            outputSize: parameters.OutputLayer,
            learningRate: parameters.LearningRate,
            activation: activation
        );

        // 4. Treinamento com notificação em tempo real
        var trainingResult = network.Train(
            inputs: trainInputs,
            targets: trainTargets,
            maxEpochs: parameters.Epochs,
            targetMinError: parameters.ErrorValue,
            progressReportInterval: Math.Max(1, parameters.Epochs / 100), // Envia cerca de 100 updates no máximo
            onEpochProgress: progress =>
            {
                // Dispara a notificação sem bloquear o loop de treino
                _ = _notifier.NotifyEpochProgressAsync(
                    request.SessionId,
                    progress.Epoch,
                    progress.AverageError,
                    cancellationToken
                );
            }
        );

        // 5. Avaliação do modelo e construção da Matriz de Confusão
        var evaluationResult = network.Evaluate(testInputs, testTargets);

        // 6. Mapeamento para o formato esperado pelo frontend
        var errorHistoryDto = trainingResult.History
            .Select(h => new AverageErrorPointDto(h.Epoch, h.AverageError))
            .ToList();

        var responseData = new RunPerceptronDataResponse(
            ArrAvaregeError: errorHistoryDto,
            ConfusionMatrix: evaluationResult.ConfusionMatrix,
            AccuracyPercentage: evaluationResult.AccuracyPercentage,
            TotalEpochs: trainingResult.TotalEpochs,
            FinalError: trainingResult.FinalAverageError,
            Converged: trainingResult.Converged
        );

        return new RunPerceptronResponse("OK", responseData);
    }

    private static (double[][] trainInputs, double[][] trainTargets, double[][] testInputs, double[][] testTargets)
        PrepareDatasets(RunPerceptronRequest request)
    {
        var paramsDto = request.Parameters;
        var data = request.Data;

        List<Dictionary<string, double>> trainData;
        List<Dictionary<string, double>> testData;

        if (request.DataToTest != null && request.DataToTest.Count > 0)
        {
            trainData = data;
            testData = request.DataToTest;
        }
        else
        {
            double rate = Math.Clamp(paramsDto.TrainingRate, 0.1, 1.0);
            int trainCount = (int)Math.Floor(data.Count * rate);
            if (trainCount == 0) trainCount = data.Count;

            // Embaralhamento reprodutível para evitar corte sequencial de classes
            var rng = new Random(42);
            var shuffled = data.OrderBy(_ => rng.Next()).ToList();

            trainData = shuffled.Take(trainCount).ToList();
            testData = shuffled.Skip(trainCount).ToList();

            // Se a taxa for 1.0 (ou não sobrar dados para teste), testa com o conjunto de treino
            if (testData.Count == 0)
            {
                testData = trainData;
            }
        }

        var (trainInputs, trainTargets) = ExtractVectors(trainData, paramsDto.InputLayer, paramsDto.OutputLayer, paramsDto.FirstClassColumn);
        var (testInputs, testTargets) = ExtractVectors(testData, paramsDto.InputLayer, paramsDto.OutputLayer, paramsDto.FirstClassColumn);

        return (trainInputs, trainTargets, testInputs, testTargets);
    }

    private static (double[][] inputs, double[][] targets) ExtractVectors(
        List<Dictionary<string, double>> rows,
        int inputLayer,
        int outputLayer,
        int firstClassColumn)
    {
        var inputs = new double[rows.Count][];
        var targets = new double[rows.Count][];

        for (int r = 0; r < rows.Count; r++)
        {
            var row = rows[r];
            var keys = row.Keys.ToArray();

            inputs[r] = new double[inputLayer];
            for (int i = 0; i < inputLayer; i++)
            {
                inputs[r][i] = row[keys[i]];
            }

            targets[r] = new double[outputLayer];
            for (int k = 0; k < outputLayer; k++)
            {
                int colIndex = firstClassColumn + k;
                targets[r][k] = colIndex < keys.Length ? row[keys[colIndex]] : 0.0;
            }
        }

        return (inputs, targets);
    }
}
