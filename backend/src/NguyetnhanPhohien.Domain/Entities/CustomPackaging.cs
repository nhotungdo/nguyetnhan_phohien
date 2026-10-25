using System;

namespace NguyetnhanPhohien.Domain.Entities;

/// <summary>
/// Đại diện cho một quy cách bao bì trong tính năng Tự chọn hạt (Custom Mix Studio).
/// Có 3 mức chuẩn: Túi zip 150g (69.000đ), Hộp nhựa 300g (153.000đ), Lễ hộp 900g (756.000đ).
/// </summary>
public class CustomPackaging
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// Tên bao bì (ví dụ: "Túi Zip Khóa Khí Tiện Lợi", "Hộp Nhựa Mica Trong Suốt", "Lễ Hộp Quà Tặng Hoàng Gia")
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Phân loại bao bì: "ZipBag", "Box", "GiftSet"
    /// </summary>
    public string PackagingType { get; set; } = string.Empty;

    /// <summary>
    /// Khối lượng tịnh mục tiêu (gram): 150, 300, hoặc 900
    /// </summary>
    public int CapacityGrams { get; set; }

    /// <summary>
    /// Đơn giá trọn gói niêm yết (VNĐ): 69000, 153000, 756000 (đã bao gồm hạt + vỏ + in ấn)
    /// </summary>
    public decimal FixedPrice { get; set; }

    /// <summary>
    /// Đường dẫn ảnh đại diện bao bì (ví dụ: "/images/tuizip.jpg")
    /// </summary>
    public string ImageUrl { get; set; } = string.Empty;

    /// <summary>
    /// Mô tả tóm tắt về quy cách và công năng bảo quản
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Trạng thái kích hoạt (cho phép khách chọn hay tạm dừng)
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Thứ tự sắp xếp hiển thị trên giao diện
    /// </summary>
    public int DisplayOrder { get; set; } = 0;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
