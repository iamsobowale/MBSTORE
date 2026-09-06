using MBSite.Application.Catalog.Admin;
using MBSite.Application.Common;
using MBSite.Domain.Catalog;
using MBSite.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace MBSite.Tests;

public class AdminCatalogServiceTests
{
    // Fresh context each call, sharing one in-memory database — mirrors the
    // request-scoped DbContext lifetime used in production.
    private static AppDbContext NewDb(string dbName) =>
        new(new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options);

    private static AppDbContext NewDb() => NewDb(Guid.NewGuid().ToString());

    private static UpsertProductRequest Request(
        string name, ProductStatus status = ProductStatus.Published,
        IReadOnlyList<UpsertVariantRequest>? variants = null) =>
        new(name, null, "desc", 1000m, status,
            Array.Empty<Guid>(), Array.Empty<UpsertImageRequest>(),
            variants ?? new[] { new UpsertVariantRequest(null, "Black", "M", "SKU-1", null, 5) });

    [Fact]
    public async Task CreateProduct_GeneratesSlugFromName()
    {
        using var db = NewDb();
        var svc = new AdminCatalogService(db);

        var created = await svc.CreateProductAsync(Request("Premium Compression Tee"));

        Assert.Equal("premium-compression-tee", created.Slug);
    }

    [Fact]
    public async Task CreateProduct_DeduplicatesSlug()
    {
        using var db = NewDb();
        var svc = new AdminCatalogService(db);

        await svc.CreateProductAsync(Request("Same Name",
            variants: new[] { new UpsertVariantRequest(null, "Black", "M", "SKU-A", null, 1) }));
        var second = await svc.CreateProductAsync(Request("Same Name",
            variants: new[] { new UpsertVariantRequest(null, "Black", "M", "SKU-B", null, 1) }));

        Assert.Equal("same-name-2", second.Slug);
    }

    [Fact]
    public async Task CreateProduct_RejectsDuplicateSkuWithinProduct()
    {
        using var db = NewDb();
        var svc = new AdminCatalogService(db);

        await Assert.ThrowsAsync<ValidationException>(() => svc.CreateProductAsync(Request("Dup",
            variants: new[]
            {
                new UpsertVariantRequest(null, "Black", "M", "DUP", null, 1),
                new UpsertVariantRequest(null, "White", "L", "DUP", null, 1),
            })));
    }

    [Fact]
    public async Task UpdateProduct_SyncsVariants_AddsUpdatesRemoves()
    {
        var dbName = Guid.NewGuid().ToString();

        Guid productId, keepId;
        using (var db = NewDb(dbName))
        {
            var created = await new AdminCatalogService(db).CreateProductAsync(Request("Sync",
                variants: new[] { new UpsertVariantRequest(null, "Black", "M", "S-M", null, 5) }));
            productId = created.Id;
            keepId = created.Variants[0].Id;
        }

        using (var db = NewDb(dbName))
        {
            var updated = await new AdminCatalogService(db).UpdateProductAsync(productId, Request("Sync", variants: new[]
            {
                new UpsertVariantRequest(keepId, "Black", "M", "S-M", null, 20), // update stock
                new UpsertVariantRequest(null, "Black", "L", "S-L", null, 3),    // add
            }));

            Assert.Equal(2, updated.Variants.Count);
            Assert.Equal(20, updated.Variants.Single(v => v.Sku == "S-M").StockQuantity);
        }
    }

    [Fact]
    public async Task ArchiveProduct_SetsArchivedStatus_WithoutDeleting()
    {
        using var db = NewDb();
        var svc = new AdminCatalogService(db);
        var created = await svc.CreateProductAsync(Request("Archive Me"));

        await svc.ArchiveProductAsync(created.Id);

        var product = await db.Products.FindAsync(created.Id);
        Assert.NotNull(product);
        Assert.Equal(ProductStatus.Archived, product!.Status);
    }
}
