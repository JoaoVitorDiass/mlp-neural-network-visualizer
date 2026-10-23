using Mlp.Application.DTOs;

namespace Mlp.Application.Interfaces;

public interface IMlpService
{
    Task<RunPerceptronResponse> RunPerceptronAsync(
        RunPerceptronRequest request,
        CancellationToken cancellationToken = default
    );
}
