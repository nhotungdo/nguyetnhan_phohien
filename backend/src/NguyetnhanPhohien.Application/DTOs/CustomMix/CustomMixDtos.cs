using System;
using System.Collections.Generic;

namespace NguyetnhanPhohien.Application.DTOs.CustomMix;

public class CustomPackagingDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string PackagingType { get; set; } = string.Empty;
    public int CapacityGrams { get; set; }
    public decimal FixedPrice { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
}

public class CustomIngredientDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int CaloriesPer100g { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Tagline { get; set; } = string.Empty;
    public int MinGrams { get; set; }
    public int MaxGrams { get; set; }
    public int StepGrams { get; set; }
    public int DisplayOrder { get; set; }
}

public class CustomMixOptionsResponse
{
    public List<CustomPackagingDto> Packagings { get; set; } = new();
    public List<CustomIngredientDto> Ingredients { get; set; } = new();
}

public class CustomMixSelectedIngredientDto
{
    public Guid IngredientId { get; set; }
    public string? Name { get; set; }
    public int WeightGrams { get; set; }
    public decimal Percentage { get; set; }
}

public class CustomMixItemDetailDto
{
    public Guid PackagingId { get; set; }
    public string PackagingName { get; set; } = string.Empty;
    public int TargetWeightGrams { get; set; }
    public string CustomProductName { get; set; } = string.Empty;
    public string? CustomLabelMessage { get; set; }
    public List<CustomMixSelectedIngredientDto> Ingredients { get; set; } = new();
    public decimal FixedPrice { get; set; }
}

public class ValidateCustomMixRequest
{
    public Guid PackagingId { get; set; }
    public string? CustomProductName { get; set; }
    public string? CustomLabelMessage { get; set; }
    public List<CustomMixSelectedIngredientDto> Ingredients { get; set; } = new();
}

public class ValidateCustomMixResponse
{
    public bool IsValid { get; set; }
    public int TotalGrams { get; set; }
    public int TargetGrams { get; set; }
    public decimal FixedPrice { get; set; }
    public string? Message { get; set; }
    public List<CustomMixSelectedIngredientDto> Ingredients { get; set; } = new();
}
