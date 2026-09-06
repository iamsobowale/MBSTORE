using MBSite.Application.Common.Interfaces;
using MBSite.Domain.StoreConfiguration;
using Microsoft.EntityFrameworkCore;

namespace MBSite.Application.StoreConfiguration;

public class StoreSettingsService : IStoreSettingsService
{
    private readonly IAppDbContext _db;

    public StoreSettingsService(IAppDbContext db) => _db = db;

    public async Task<StoreSettingsDto> GetAsync(CancellationToken ct = default)
    {
        var settings = await GetOrCreateAsync(ct);
        return Map(settings);
    }

    public async Task<StoreSettingsDto> UpdateAsync(UpdateStoreSettingsRequest request, CancellationToken ct = default)
    {
        var settings = await GetOrCreateAsync(ct);

        settings.BrandName = request.BrandName;
        settings.LogoUrl = request.LogoUrl;
        settings.FaviconUrl = request.FaviconUrl;
        settings.PrimaryColor = request.PrimaryColor;
        settings.SecondaryColor = request.SecondaryColor;
        settings.BackgroundColor = request.BackgroundColor;
        settings.TextColor = request.TextColor;
        settings.AccentColor = request.AccentColor;
        settings.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
        return Map(settings);
    }

    private async Task<StoreSettings> GetOrCreateAsync(CancellationToken ct)
    {
        var settings = await _db.StoreSettings.FirstOrDefaultAsync(ct);
        if (settings is null)
        {
            settings = new StoreSettings();
            _db.StoreSettings.Add(settings);
            await _db.SaveChangesAsync(ct);
        }

        return settings;
    }

    private static StoreSettingsDto Map(StoreSettings s) => new(
        s.BrandName, s.LogoUrl, s.FaviconUrl,
        s.PrimaryColor, s.SecondaryColor, s.BackgroundColor, s.TextColor, s.AccentColor);
}
