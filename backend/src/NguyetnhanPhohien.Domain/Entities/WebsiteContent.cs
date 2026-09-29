using System;

namespace NguyetnhanPhohien.Domain.Entities;

/// <summary>
/// Quản lý nội dung động của website (banner, ảnh, text mô tả...)
/// Admin có thể chỉnh sửa qua Dashboard thay vì phải deploy lại code.
/// </summary>
public class WebsiteContent
{
    public Guid Id { get; set; } = Guid.NewGuid();

    // Key định danh duy nhất. VD: "hero_banner_url", "about_us_text", "product_1_image"
    public string Key { get; set; } = string.Empty;

    // Giá trị tương ứng (URL ảnh, đoạn text, ...)
    public string Value { get; set; } = string.Empty;

    // Mô tả ngắn để Admin biết field này dùng để làm gì
    public string? Description { get; set; }

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
