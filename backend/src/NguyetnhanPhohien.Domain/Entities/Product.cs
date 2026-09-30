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
    /// Có đang được hiển thị trên web hay không
    /// </summary>
    public bool IsActive { get; set; } = true;

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
