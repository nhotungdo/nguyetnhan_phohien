using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using NguyetnhanPhohien.Application.DTOs.CustomMix;
using NguyetnhanPhohien.Application.Interfaces;
using NguyetnhanPhohien.Infrastructure.Persistence;

namespace NguyetnhanPhohien.Infrastructure.Services;

public class CustomMixService : ICustomMixService
{
    private readonly AppDbContext _db;
    private readonly IMemoryCache _cache;
    private readonly ILogger<CustomMixService> _logger;

    public const string OptionsCacheKey = "custom_mix_options_cache";

    public CustomMixService(AppDbContext db, IMemoryCache cache, ILogger<CustomMixService> logger)
    {
        _db = db;
        _cache = cache;
        _logger = logger;
    }

    public async Task<CustomMixOptionsResponse> GetOptionsAsync()
    {
        if (_cache.TryGetValue(OptionsCacheKey, out CustomMixOptionsResponse? cached) && cached != null)
        {
            return cached;
        }

        var packagings = await _db.CustomPackagings
            .AsNoTracking()
            .Where(p => p.IsActive)
            .OrderBy(p => p.DisplayOrder)
            .Select(p => new CustomPackagingDto
            {
                Id = p.Id,
                Name = p.Name,
                PackagingType = p.PackagingType,
                CapacityGrams = p.CapacityGrams,
                FixedPrice = p.FixedPrice,
                ImageUrl = p.ImageUrl,
                Description = p.Description,
                DisplayOrder = p.DisplayOrder
            })
            .ToListAsync();

        var ingredients = await _db.CustomIngredients
            .AsNoTracking()
            .Where(i => i.IsActive)
            .OrderBy(i => i.DisplayOrder)
            .Select(i => new CustomIngredientDto
            {
                Id = i.Id,
                Name = i.Name,
                CaloriesPer100g = i.CaloriesPer100g,
                ImageUrl = i.ImageUrl,
                Description = i.Description,
                Tagline = i.Tagline,
                MinGrams = i.MinGrams,
                MaxGrams = i.MaxGrams,
                StepGrams = i.StepGrams,
                DisplayOrder = i.DisplayOrder
            })
            .ToListAsync();

        var response = new CustomMixOptionsResponse
        {
            Packagings = packagings,
            Ingredients = ingredients
        };

        // Cache ngắn 30 giây để cập nhật giá thay đổi từ DB gần như tức thì
        _cache.Set(OptionsCacheKey, response, TimeSpan.FromSeconds(30));

        return response;
    }

    public async Task<ValidateCustomMixResponse> ValidateMixAsync(ValidateCustomMixRequest request)
    {
        if (request == null)
        {
            return new ValidateCustomMixResponse
            {
                IsValid = false,
                Message = "Dữ liệu yêu cầu không hợp lệ."
            };
        }

        if (string.IsNullOrWhiteSpace(request.CustomProductName))
        {
            return new ValidateCustomMixResponse
            {
                IsValid = false,
                Message = "Vui lòng đặt tên cho sản phẩm tự chọn hạt của bạn."
            };
        }

        var packaging = await _db.CustomPackagings
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == request.PackagingId && p.IsActive);

        if (packaging == null)
        {
            return new ValidateCustomMixResponse
            {
                IsValid = false,
                Message = "Quy cách bao bì không tồn tại hoặc đã tạm dừng."
            };
        }

        decimal fixedPrice = packaging.FixedPrice > 0 ? packaging.FixedPrice : packaging.CapacityGrams switch
        {
            150 => 69000m,
            300 => 153000m,
            900 => 756000m,
            _ => 0m
        };

        // 1. Chặn số âm và các giá trị bất thường
        if (request.Ingredients != null && request.Ingredients.Any(i => i.WeightGrams < 0))
        {
            return new ValidateCustomMixResponse
            {
                IsValid = false,
                TotalGrams = 0,
                TargetGrams = packaging.CapacityGrams,
                FixedPrice = fixedPrice,
                Message = "Khối lượng từng loại hạt không được là số âm."
            };
        }

        // 2. Gộp trùng lặp IngredientId và lọc bỏ hạt 0g
        var activeIngredientItems = request.Ingredients?
            .Where(i => i.WeightGrams > 0)
            .GroupBy(i => i.IngredientId)
            .Select(g => new CustomMixSelectedIngredientDto
            {
                IngredientId = g.Key,
                WeightGrams = g.Sum(x => x.WeightGrams)
            })
            .ToList() ?? new();

        if (activeIngredientItems.Count == 0)
        {
            return new ValidateCustomMixResponse
            {
                IsValid = false,
                TotalGrams = 0,
                TargetGrams = packaging.CapacityGrams,
                FixedPrice = fixedPrice,
                Message = "Vui lòng chọn ít nhất 1 loại hạt."
            };
        }

        var totalGrams = activeIngredientItems.Sum(i => i.WeightGrams);

        if (totalGrams != packaging.CapacityGrams)
        {
            var diff = Math.Abs(packaging.CapacityGrams - totalGrams);
            var detailMsg = totalGrams < packaging.CapacityGrams
                ? $"Còn thiếu {diff}g hạt để đóng gói chuẩn {packaging.CapacityGrams}g."
                : $"Vượt quá {diff}g so với dung tích {packaging.CapacityGrams}g của bao bì.";

            return new ValidateCustomMixResponse
            {
                IsValid = false,
                TotalGrams = totalGrams,
                TargetGrams = packaging.CapacityGrams,
                FixedPrice = fixedPrice,
                Message = detailMsg
            };
        }

        var ingredientIds = activeIngredientItems.Select(i => i.IngredientId).ToList();
        var dbIngredients = await _db.CustomIngredients
            .AsNoTracking()
            .Where(i => ingredientIds.Contains(i.Id) && i.IsActive)
            .ToDictionaryAsync(i => i.Id);

        if (dbIngredients.Count != ingredientIds.Count)
        {
            return new ValidateCustomMixResponse
            {
                IsValid = false,
                TotalGrams = totalGrams,
                TargetGrams = packaging.CapacityGrams,
                FixedPrice = fixedPrice,
                Message = "Có loại hạt không hợp lệ hoặc đã tạm ngừng kinh doanh."
            };
        }

        // 3. Validate StepGrams, MinGrams, MaxGrams & bổ sung thông tin
        foreach (var item in activeIngredientItems)
        {
            var ing = dbIngredients[item.IngredientId];
            item.Name = ing.Name;
            item.Percentage = Math.Round((decimal)item.WeightGrams * 100m / packaging.CapacityGrams, 1);

            int step = ing.StepGrams > 0 ? ing.StepGrams : 10;
            if (item.WeightGrams % step != 0)
            {
                return new ValidateCustomMixResponse
                {
                    IsValid = false,
                    TotalGrams = totalGrams,
                    TargetGrams = packaging.CapacityGrams,
                    FixedPrice = fixedPrice,
                    Message = $"Khối lượng {ing.Name} ({item.WeightGrams}g) phải là bội số của {step}g."
                };
            }

            if (ing.MinGrams > 0 && item.WeightGrams < ing.MinGrams)
            {
                return new ValidateCustomMixResponse
                {
                    IsValid = false,
                    TotalGrams = totalGrams,
                    TargetGrams = packaging.CapacityGrams,
                    FixedPrice = fixedPrice,
                    Message = $"Khối lượng {ing.Name} tối thiểu là {ing.MinGrams}g."
                };
            }

            if (ing.MaxGrams > 0 && item.WeightGrams > ing.MaxGrams)
            {
                return new ValidateCustomMixResponse
                {
                    IsValid = false,
                    TotalGrams = totalGrams,
                    TargetGrams = packaging.CapacityGrams,
                    FixedPrice = fixedPrice,
                    Message = $"Khối lượng {ing.Name} tối đa là {ing.MaxGrams}g."
                };
            }
        }

        return new ValidateCustomMixResponse
        {
            IsValid = true,
            TotalGrams = totalGrams,
            TargetGrams = packaging.CapacityGrams,
            FixedPrice = fixedPrice,
            Message = "Công thức phối hạt hoàn toàn hợp lệ.",
            Ingredients = activeIngredientItems
        };
    }

    public void InvalidateOptionsCache()
    {
        _cache.Remove(OptionsCacheKey);
    }
}
