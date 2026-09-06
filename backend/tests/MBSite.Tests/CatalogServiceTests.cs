using MBSite.Application.Catalog;
using MBSite.Domain.Catalog;
using MBSite.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace MBSite.Tests;

public class CatalogServiceTests
{
    private static AppDbContext NewDb() =>
        new(new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options);

    private static Product SampleProduct(string slug, ProductStatus status, decimal price = 100m)
    {
        var p = new Product { Name = slug, Slug = slug, BasePrice = price, Status = status };
        p.Images.Add(new ProductImage { Url = "img", IsPrimary = true });
        p.Variants.Add(new ProductVariant { Color = "Black", Size = "M", Sku = slug + "-BLA-M", StockQuantity = 5 });
        p.Variants.Add(new ProductVariant { Color = "Black", Size = "L", Sku = slug + "-BLA-L", StockQuantity = 0 });
        return p;
    }

    [Fact]
    public async Task ListAsync_ReturnsOnlyPublishedProducts()
    {
        using var db = NewDb();
        db.Products.Add(SampleProduct("published-a", ProductStatus.Published));
        db.Products.Add(SampleProduct("draft-b", ProductStatus.Draft));
        db.Products.Add(SampleProduct("archived-c", ProductStatus.Archived));
        await db.SaveChangesAsync();

        var result = await new CatalogService(db).ListAsync(new ProductQuery());

        Assert.Single(result.Items);
        Assert.Equal("published-a", result.Items[0].Slug);
        Assert.True(result.Items[0].InStock); // has a variant with stock
    }

    [Fact]
    public async Task GetBySlugAsync_ReturnsNull_ForUnpublishedProduct()
    {
        using var db = NewDb();
        db.Products.Add(SampleProduct("hidden", ProductStatus.Draft));
        await db.SaveChangesAsync();

        var result = await new CatalogService(db).GetBySlugAsync("hidden");

        Assert.Null(result);
    }

    [Fact]
    public async Task GetBySlugAsync_MarksSoldOutVariantUnavailable()
    {
        using var db = NewDb();
        db.Products.Add(SampleProduct("shirt", ProductStatus.Published));
        await db.SaveChangesAsync();

        var detail = await new CatalogService(db).GetBySlugAsync("shirt");

        Assert.NotNull(detail);
        var large = detail!.Variants.Single(v => v.Size == "L");
        var medium = detail.Variants.Single(v => v.Size == "M");
        Assert.False(large.InStock);
        Assert.Equal(0, large.AvailableQuantity);
        Assert.True(medium.InStock);
        Assert.Equal(5, medium.AvailableQuantity);
    }

    [Fact]
    public async Task ListAsync_SortsByPriceAscending()
    {
        using var db = NewDb();
        db.Products.Add(SampleProduct("cheap", ProductStatus.Published, 50m));
        db.Products.Add(SampleProduct("pricey", ProductStatus.Published, 500m));
        await db.SaveChangesAsync();

        var result = await new CatalogService(db)
            .ListAsync(new ProductQuery { Sort = ProductSort.PriceAsc });

        Assert.Equal("cheap", result.Items[0].Slug);
        Assert.Equal("pricey", result.Items[1].Slug);
    }
}
