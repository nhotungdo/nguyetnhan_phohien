namespace NguyetnhanPhohien.Application.DTOs.Content;

// DTO trả về nội dung website
public class WebsiteContentResponse
{
    public string Key { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public string? Description { get; set; }
}

// DTO Admin dùng để cập nhật nội dung
public class UpdateContentRequest
{
    public string Key { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
}
