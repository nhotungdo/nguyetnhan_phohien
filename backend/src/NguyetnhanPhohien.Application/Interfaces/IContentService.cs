using NguyetnhanPhohien.Application.DTOs.Content;

namespace NguyetnhanPhohien.Application.Interfaces;

public interface IContentService
{
    Task<IEnumerable<WebsiteContentResponse>> GetAllContentAsync();
    Task<WebsiteContentResponse?> GetContentByKeyAsync(string key);
    Task<WebsiteContentResponse> UpsertContentAsync(UpdateContentRequest request);

    /// <summary>
    /// Upload ảnh banner lên server, tự động cập nhật key HeroBannerUrl và trả về đường dẫn ảnh.
    /// </summary>
    Task<string> UploadBannerImageAsync(Stream imageStream, string fileName);
}
