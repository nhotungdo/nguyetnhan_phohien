using Microsoft.EntityFrameworkCore;
using NguyetnhanPhohien.Application.DTOs.Content;
using NguyetnhanPhohien.Application.Interfaces;
using NguyetnhanPhohien.Domain.Entities;
using NguyetnhanPhohien.Infrastructure.Persistence;

namespace NguyetnhanPhohien.Infrastructure.Services;

public class ContentService : IContentService
{
    private readonly AppDbContext _db;

    public ContentService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IEnumerable<WebsiteContentResponse>> GetAllContentAsync()
    {
        var contents = await _db.WebsiteContents.ToListAsync();
        return contents.Select(MapToResponse);
    }

    public async Task<WebsiteContentResponse?> GetContentByKeyAsync(string key)
    {
        var content = await _db.WebsiteContents.FirstOrDefaultAsync(w => w.Key == key);
        return content == null ? null : MapToResponse(content);
    }

    public async Task<WebsiteContentResponse> UpsertContentAsync(UpdateContentRequest request)
    {
        var existing = await _db.WebsiteContents.FirstOrDefaultAsync(w => w.Key == request.Key);

        if (existing != null)
        {
            existing.Value = request.Value;
            existing.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            existing = new WebsiteContent
            {
                Key = request.Key,
                Value = request.Value
            };
            _db.WebsiteContents.Add(existing);
        }

        await _db.SaveChangesAsync();
        return MapToResponse(existing);
    }

    private static WebsiteContentResponse MapToResponse(WebsiteContent c) => new()
    {
        Key = c.Key,
        Value = c.Value,
        Description = c.Description
    };
}
