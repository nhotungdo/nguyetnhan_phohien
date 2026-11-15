namespace NguyetnhanPhohien.Application.DTOs.Products;

public class ProductImageResponse
{
    public Guid Id { get; set; }
    public string ImagePath { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
}

public class ProductResponse
{
    public Guid Id { get; set; }
    public string? ProductCode { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? NameEn { get; set; }
    public string? PackagingType { get; set; }
    public decimal Price { get; set; }
    public string Size { get; set; } = string.Empty;
    public string? Badge { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? Overview { get; set; }
    public string? Ingredients { get; set; }
    public string? SensoryScores { get; set; }
    public string? HealthBenefits { get; set; }
    public string? UsageInstructions { get; set; }
    public string? ImageUrl { get; set; }
    public bool IsActive { get; set; }
    public int DisplayOrder { get; set; }
    public List<ProductImageResponse> Images { get; set; } = new();
}

public class CreateProductRequest
{
    public string? ProductCode { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? NameEn { get; set; }
    public string? PackagingType { get; set; }
    public decimal Price { get; set; }
    public string Size { get; set; } = string.Empty;
    public string? Badge { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? Overview { get; set; }
    public string? Ingredients { get; set; }
    public string? SensoryScores { get; set; }
    public string? HealthBenefits { get; set; }
    public string? UsageInstructions { get; set; }
    public bool IsActive { get; set; } = true;
    public int DisplayOrder { get; set; } = 0;
}

public class UpdateProductRequest
{
    public string? ProductCode { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? NameEn { get; set; }
    public string? PackagingType { get; set; }
    public decimal Price { get; set; }
    public string Size { get; set; } = string.Empty;
    public string? Badge { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? Overview { get; set; }
    public string? Ingredients { get; set; }
    public string? SensoryScores { get; set; }
    public string? HealthBenefits { get; set; }
    public string? UsageInstructions { get; set; }
    public bool IsActive { get; set; } = true;
    public int DisplayOrder { get; set; } = 0;
}

// Admin gửi thứ tự ảnh MỚI đầy đủ (id đầu tiên = ảnh đại diện trên landing page)
public class ReorderImagesRequest
{
    public List<Guid> ImageIds { get; set; } = new();
}
