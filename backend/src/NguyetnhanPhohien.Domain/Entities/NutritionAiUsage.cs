using System;

namespace NguyetnhanPhohien.Domain.Entities;

public class NutritionAiUsage
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>Phiên trò chuyện (Session ID)</summary>
    public string? SessionId { get; set; }

    /// <summary>Mã khách truy cập duy nhất (Visitor ID)</summary>
    public string? VisitorId { get; set; }

    /// <summary>Trích đoạn câu hỏi người dùng đặt cho AI (tối đa 255 ký tự)</summary>
    public string? QuestionPreview { get; set; }

    /// <summary>Thiết bị: Desktop, Mobile, Tablet</summary>
    public string? DeviceType { get; set; }

    /// <summary>Ngôn ngữ: vi hoặc en</summary>
    public string Language { get; set; } = "vi";

    /// <summary>Thời điểm tương tác (UTC)</summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
