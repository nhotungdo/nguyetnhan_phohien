using NguyetnhanPhohien.Application.DTOs.Ai;

namespace NguyetnhanPhohien.Application.Interfaces;

public interface INutritionAiService
{
    Task<NutritionConsultationResponse> ConsultAsync(
        NutritionConsultationRequest request, 
        CancellationToken cancellationToken = default);

    IAsyncEnumerable<string> StreamConsultAsync(
        NutritionConsultationRequest request, 
        CancellationToken cancellationToken = default);
}
