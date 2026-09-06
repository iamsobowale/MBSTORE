using MBSite.Application.StoreConfiguration;
using MBSite.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace MBSite.Tests;

public class StoreSettingsServiceTests
{
    private static AppDbContext NewDb() =>
        new(new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options);

    [Fact]
    public async Task GetAsync_CreatesDefaultBlackAndWhiteTheme_WhenNoneExists()
    {
        using var db = NewDb();
        var service = new StoreSettingsService(db);

        var result = await service.GetAsync();

        Assert.Equal("#000000", result.PrimaryColor);
        Assert.Equal("#FFFFFF", result.BackgroundColor);
    }

    [Fact]
    public async Task UpdateAsync_PersistsNewBranding()
    {
        using var db = NewDb();
        var service = new StoreSettingsService(db);

        var updated = await service.UpdateAsync(new UpdateStoreSettingsRequest(
            BrandName: "Apex",
            LogoUrl: "https://cdn/logo.png",
            FaviconUrl: null,
            PrimaryColor: "#FF0000",
            SecondaryColor: "#222222",
            BackgroundColor: "#FFFFFF",
            TextColor: "#000000",
            AccentColor: "#FF0000"));

        Assert.Equal("Apex", updated.BrandName);
        Assert.Equal("#FF0000", updated.PrimaryColor);

        // A second fetch returns the same persisted singleton (no duplicate row).
        var refetched = await service.GetAsync();
        Assert.Equal("Apex", refetched.BrandName);
        Assert.Equal(1, await db.StoreSettings.CountAsync());
    }
}
