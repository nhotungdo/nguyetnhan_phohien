using System.ComponentModel.DataAnnotations;

namespace NguyetnhanPhohien.Application.DTOs.Ai;

public class ChatHistoryItem
{
    public string Role { get; set; } = "user"; // "user" hoặc "model"
    public string Content { get; set; } = string.Empty;
}

public class UserHealthProfile
{
    public string? Goal { get; set; } // ví dụ: "Ăn vặt lành mạnh", "Trị mất ngủ", "Tập gym", "Bổ sung dinh dưỡng mẹ bầu"
    public string? HealthCondition { get; set; } // ví dụ: "Tiền tiểu đường", "Huyết áp cao", "Mất ngủ kinh niên"
    public List<string>? Allergens { get; set; } // ví dụ: ["Hạt điều", "Hạnh nhân"]
}

public class NutritionConsultationRequest
{
    [Required(ErrorMessage = "Nội dung câu hỏi không được để trống.")]
    [MaxLength(1000, ErrorMessage = "Câu hỏi không được vượt quá 1000 ký tự.")]
    public string Message { get; set; } = string.Empty;
    public List<ChatHistoryItem>? History { get; set; }
    public UserHealthProfile? HealthProfile { get; set; }
}

public class SuggestedProductDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Size { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string? ImageUrl { get; set; }
    public string? Reason { get; set; }
}

public class NutritionConsultationResponse
{
    public string Reply { get; set; } = string.Empty;
    public List<SuggestedProductDto> SuggestedProducts { get; set; } = new();
    public string? PortionTip { get; set; }
    public string? AllergenNotice { get; set; }
}
