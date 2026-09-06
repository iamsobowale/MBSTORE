using MBSite.Application.Common;
using MBSite.Application.Common.Interfaces;
using MBSite.Domain.Catalog;
using Microsoft.EntityFrameworkCore;

namespace MBSite.Application.Catalog;

public class CatalogService : ICatalogService
{
    private readonly IAppDbContext _db;

    public CatalogService(IAppDbContext db) => _db = db;

    public async Task<PagedResult<ProductListItemDto>> ListAsync(ProductQuery query, CancellationToken ct = default)
    {
        query = query.Normalized();

        // Public listing only ever exposes Published products.
        var filtered = _db.Products.AsNoTracking().Where(p => p.Status == ProductStatus.Published);

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            // Provider-agnostic case-insensitive match (keeps this layer free of Npgsql).
            var term = query.Search.Trim().ToLower();
            filtered = filtered.Where(p => p.Name.ToLower().Contains(term));
        }

        if (!string.IsNullOrWhiteSpace(query.CategorySlug))
            filtered = filtered.Where(p => p.Categories.Any(c => c.Slug == query.CategorySlug));

        if (!string.IsNullOrWhiteSpace(query.Size))
            filtered = filtered.Where(p => p.Variants.Any(v => v.Size == query.Size && v.IsActive));

        // Price filter/sort uses BasePrice for correct SQL-side pagination; per-variant
        // overrides refine the displayed "from" price on the detail page.
        if (query.MinPrice.HasValue)
            filtered = filtered.Where(p => p.BasePrice >= query.MinPrice.Value);
        if (query.MaxPrice.HasValue)
            filtered = filtered.Where(p => p.BasePrice <= query.MaxPrice.Value);

        if (query.InStockOnly == true)
            filtered = filtered.Where(p => p.Variants.Any(v => v.IsActive && v.StockQuantity > 0));

        filtered = query.Sort switch
        {
            ProductSort.PriceAsc => filtered.OrderBy(p => p.BasePrice).ThenBy(p => p.Id),
            ProductSort.PriceDesc => filtered.OrderByDescending(p => p.BasePrice).ThenBy(p => p.Id),
            // BestSelling falls back to Newest until order data exists (Phase 5+).
            _ => filtered.OrderByDescending(p => p.CreatedAt).ThenBy(p => p.Id),
        };

        var total = await filtered.CountAsync(ct);

        // Materialize only the current page, then map in memory (cheap, correct).
        var page = await filtered
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Include(p => p.Images)
            .Include(p => p.Variants)
            .ToListAsync(ct);

        var items = page.Select(MapListItem).ToList();
        return new PagedResult<ProductListItemDto>(items, query.Page, query.PageSize, total);
    }

    public async Task<ProductDetailDto?> GetBySlugAsync(string slug, CancellationToken ct = default)
    {
        var product = await _db.Products.AsNoTracking()
            .Where(p => p.Slug == slug && p.Status == ProductStatus.Published)
            .Include(p => p.Images)
            .Include(p => p.Variants)
            .FirstOrDefaultAsync(ct);

        return product is null ? null : MapDetail(product);
    }

    public async Task<IReadOnlyList<CategoryDto>> GetCategoriesAsync(CancellationToken ct = default)
    {
        return await _db.Categories.AsNoTracking()
            .OrderBy(c => c.SortOrder).ThenBy(c => c.Name)
            .Select(c => new CategoryDto(c.Id, c.Name, c.Slug, c.ParentId, c.SortOrder))
            .ToListAsync(ct);
    }

    private static ProductListItemDto MapListItem(Product p)
    {
        var primary = p.Images.FirstOrDefault(i => i.IsPrimary)
                      ?? p.Images.OrderBy(i => i.SortOrder).FirstOrDefault();
        var colors = p.Variants.Where(v => v.IsActive).Select(v => v.Color).Distinct().ToList();

        return new ProductListItemDto(
            p.Id, p.Name, p.Slug, p.BasePrice, CompareAtPrice: null,
            primary?.Url, colors, InStock: p.Variants.Any(v => v.IsAvailable));
    }

    private static ProductDetailDto MapDetail(Product p)
    {
        var images = p.Images
            .OrderByDescending(i => i.IsPrimary).ThenBy(i => i.SortOrder)
            .Select(i => new ProductImageDto(i.Id, i.Url, i.AltText, i.IsPrimary, i.SortOrder))
            .ToList();

        var variants = p.Variants
            .OrderBy(v => v.Color).ThenBy(v => v.Size)
            .Select(v => new ProductVariantDto(
                v.Id, v.Color, v.Size,
                Price: v.Price ?? p.BasePrice,
                InStock: v.IsAvailable,
                AvailableQuantity: v.IsAvailable ? v.StockQuantity : 0))
            .ToList();

        var colors = variants.Select(v => v.Color).Distinct().ToList();
        var sizes = variants.Select(v => v.Size).Distinct().ToList();

        var sizeGuide = p.SizeGuide
            .OrderBy(m => m.SortOrder)
            .Select(m => new SizeMeasurementDto(m.Size, m.Dimension, m.Value, m.Unit))
            .ToList();

        return new ProductDetailDto(
            p.Id, p.Name, p.Slug, p.Description, p.BasePrice,
            InStock: variants.Any(v => v.InStock),
            images, variants, colors, sizes, sizeGuide);
    }
}
