using System;

namespace NguyetnhanPhohien.Domain.Entities;

public class WebsiteVisit
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>Đường dẫn trang truy cập (vd: "/", "/tu-chon-hat", "/san-pham")</summary>
    public string Path { get; set; } = "/";

    /// <summary>Mã khách truy cập duy nhất (UUID ẩn danh sinh ngẫu nhiên trên trình duyệt)</summary>
    public string VisitorId { get; set; } = string.Empty;

    /// <summary>Chuỗi băm SHA-256 của IP khách (bảo vệ quyền riêng tư theo GDPR/luật An toàn thông tin)</summary>
    public string? IpHash { get; set; }

    /// <summary>Thiết bị: Desktop, Mobile, Tablet</summary>
    public string? DeviceType { get; set; }

    /// <summary>Nguồn giới thiệu (Referrer URL)</summary>
    public string? Referrer { get; set; }

    /// <summary>Thời gian truy cập (UTC)</summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
