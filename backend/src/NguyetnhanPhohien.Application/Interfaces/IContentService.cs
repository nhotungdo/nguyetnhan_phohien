using NguyetnhanPhohien.Application.DTOs.Content;

namespace NguyetnhanPhohien.Application.Interfaces;

public interface IContentService
{
    Task<IEnumerable<WebsiteContentResponse>> GetAllContentAsync();
    Task<WebsiteContentResponse?> GetContentByKeyAsync(string key);
    Task<WebsiteContentResponse> UpsertContentAsync(UpdateContentRequest request);
}
