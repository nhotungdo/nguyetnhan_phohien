using System;

namespace NguyetnhanPhohien.Domain.Entities;

/// <summary>
/// Đại diện cho 1 loại hạt / nguyên liệu trong tính năng Tự chọn hạt (Custom Mix Studio).
/// Danh mục gồm 6 loại: Long nhãn Phố Hiến, Hạt sen sấy, Hạt macca, Hạt điều, Hạnh nhân, Hạt bí xanh.
/// (Không có hạt óc chó, không có táo đỏ, không có kỷ tử).
/// </summary>
public class CustomIngredient
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// Tên loại hạt (ví dụ: "Long Nhãn Phố Hiến Tuyển Chọn", "Hạt Sen Phố Hiến Sấy Giòn")
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Hàm lượng calo ước tính trên 100g (kcal)
    /// </summary>
    public int CaloriesPer100g { get; set; }

    /// <summary>
    /// Đường dẫn ảnh chụp cận cảnh sắc nét của hạt (ví dụ: "/images/nuts/longnhan.jpg")
    /// </summary>
    public string ImageUrl { get; set; } = string.Empty;

    /// <summary>
    /// Mô tả chi tiết về hương vị, nguồn gốc và quy trình sấy
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Câu khẩu hiệu / Thẻ công dụng ngắn (ví dụ: "Đặc sản Phố Hiến, bổ khí huyết, an thần ngủ ngon")
    /// </summary>
    public string Tagline { get; set; } = string.Empty;

    /// <summary>
    /// Khối lượng tối thiểu khách có thể chọn (mặc định 0g)
    /// </summary>
    public int MinGrams { get; set; } = 0;

    /// <summary>
    /// Khối lượng tối đa khách có thể chọn (mặc định 900g)
    /// </summary>
    public int MaxGrams { get; set; } = 900;

    /// <summary>
    /// Bước nhảy tăng/giảm khối lượng mỗi lần bấm (+/- 10g hoặc 25g)
    /// </summary>
    public int StepGrams { get; set; } = 10;

    /// <summary>
    /// Có đang sẵn hàng để khách chọn hay tạm hết
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Thứ tự ưu tiên hiển thị trên danh mục
    /// </summary>
    public int DisplayOrder { get; set; } = 0;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
