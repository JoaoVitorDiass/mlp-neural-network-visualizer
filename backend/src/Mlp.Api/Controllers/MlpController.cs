using Microsoft.AspNetCore.Mvc;
using Mlp.Application.DTOs;
using Mlp.Application.Interfaces;

namespace Mlp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MlpController : ControllerBase
{
    private readonly IMlpService _mlpService;
    private readonly ILogger<MlpController> _logger;

    public MlpController(IMlpService mlpService, ILogger<MlpController> logger)
    {
        _mlpService = mlpService;
        _logger = logger;
    }

    /// <summary>
    /// Healthcheck para testar se a API está online.
    /// </summary>
    [HttpGet("health")]
    public IActionResult Health()
    {
        return Ok(new
        {
            status = "Online",
            message = "MLP Visualizer API está em execução.",
            timestamp = DateTime.UtcNow
        });
    }

    /// <summary>
    /// Executa o treinamento da rede neural com os dados e parâmetros recebidos.
    /// Emite atualizações em tempo real pelo SignalR durante o processo.
    /// </summary>
    [HttpPost("runPerceptron")]
    public async Task<IActionResult> RunPerceptron(
        [FromBody] RunPerceptronRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            _logger.LogInformation(
                "Iniciando treinamento MLP. Épocas: {Epochs}, Taxa: {Rate}, Função: {Func}",
                request.Parameters.Epochs,
                request.Parameters.LearningRate,
                request.Parameters.TransferFunction
            );

            var response = await _mlpService.RunPerceptronAsync(request, cancellationToken);
            return Ok(response);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Parâmetros inválidos recebidos na requisição.");
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro inesperado ao executar o treinamento da rede MLP.");
            return StatusCode(500, new { message = "Erro interno no treinamento: " + ex.Message });
        }
    }
}
