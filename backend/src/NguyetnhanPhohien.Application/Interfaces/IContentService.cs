using NguyetnhanPhohien.Application.DTOs.Content;

namespace NguyetnhanPhohien.Application.Interfaces;

public interface IContentService
{
    Task<IEnumerable<WebsiteContentResponse>> GetAllContentAsync();
    Task<WebsiteContentResponse?> GetContentByKeyAsync(string key);
    Task<WebsiteContentResponse> UpsertContentAsync(UpdateContentRequest request);

    /// <summary>
    /// Upload ảnh cho một slot ảnh của landing page (key thuộc whitelist),
    /// tự cập nhật key nội dung và dọn file cũ. Trả về đường dẫn ảnh tương đối.
    /// </summary>
    Task<string> UploadImageAsync(Stream imageStream, string fileName, string contentKey);
}
