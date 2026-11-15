namespace NguyetnhanPhohien.Domain.Entities;

/// <summary>
/// Đại diện cho một sản phẩm hiển thị trên Landing Page.
/// </summary>
public class Product
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// Tên sản phẩm (ví dụ: "Long Nhãn Đặc Biệt")
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Giá tiền VNĐ (ví dụ: 350000)
    /// </summary>
    public decimal Price { get; set; }

    /// <summary>
    /// Khối lượng / Quy cách đóng gói (ví dụ: "500g", "1kg")
    /// </summary>
    public string Size { get; set; } = string.Empty;

    /// <summary>
    /// Mô tả tóm tắt về sản phẩm
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Link ảnh sản phẩm (có thể là link external hoặc upload nội bộ)
    /// </summary>
    public string ImageUrl { get; set; } = string.Empty;

    /// <summary>
    /// Mã sản phẩm định danh SKU (ví dụ: "NN-ZIP-150", "NN-DEO-300")
    /// </summary>
    public string? ProductCode { get; set; }

    /// <summary>
    /// Tên sản phẩm tiếng Anh
    /// </summary>
    public string? NameEn { get; set; }

    /// <summary>
    /// Dòng bao bì (ví dụ: "Túi Zip Kraft", "Hũ nắp gỗ sồi", "Lễ Hộp quai tre")
    /// </summary>
    public string? PackagingType { get; set; }

    /// <summary>
    /// Huy hiệu nổi bật (ví dụ: "Đặc Sản Tiến Vua", "Bản Ngự Thiện")
    /// </summary>
    public string? Badge { get; set; }

    /// <summary>
    /// Bài viết tổng quan chi tiết & câu chuyện di sản
    /// </summary>
    public string? Overview { get; set; }

    /// <summary>
    /// Danh sách thành phần & tỷ lệ nguyên liệu (text hoặc JSON)
    /// </summary>
    public string? Ingredients { get; set; }

    /// <summary>
    /// Hồ sơ cảm quan 4 trục điểm 1-10 (JSON: { nutCrispiness, longanChewiness, naturalSweetness, harmoniousAroma })
    /// </summary>
    public string? SensoryScores { get; set; }

    /// <summary>
    /// Công dụng dưỡng sinh đối với sức khỏe
    /// </summary>
    public string? HealthBenefits { get; set; }

    /// <summary>
    /// Hướng dẫn sử dụng & cách thưởng thức (thưởng trà, ăn liền, nấu chè...)
    /// </summary>
    public string? UsageInstructions { get; set; }

    /// <summary>
    /// Có đang được hiển thị trên web hay không
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Đánh dấu là sản phẩm yêu thích (Favorite Choice / Admin Choice)
    /// </summary>
    public bool IsFavorite { get; set; } = false;

    /// <summary>
    /// Thứ tự sắp xếp trên giao diện
    /// </summary>
    public int DisplayOrder { get; set; } = 0;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Danh sách ảnh của sản phẩm (navigation property)
    /// </summary>
    public ICollection<ProductImage> Images { get; set; } = new List<ProductImage>();
}
