namespace NguyetnhanPhohien.Domain.Entities;

/// <summary>
/// Ảnh của một sản phẩm. Một sản phẩm có thể có nhiều ảnh.
/// </summary>
public class ProductImage
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// FK tới Product
    /// </summary>
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;

    /// <summary>
    /// Đường dẫn tương đối đến file ảnh (vd: /uploads/products/abc.jpg)
    /// </summary>
    public string ImagePath { get; set; } = string.Empty;

    /// <summary>
    /// Thứ tự hiển thị. Ảnh có DisplayOrder = 0 là ảnh chính.
    /// </summary>
    public int DisplayOrder { get; set; } = 0;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
