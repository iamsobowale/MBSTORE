using MBSite.Application.Common;
using MBSite.Application.Common.Interfaces;
using MBSite.Domain.Catalog;
using Microsoft.EntityFrameworkCore;

namespace MBSite.Application.Catalog.Admin;

public interface IAdminCatalogService
{
    Task<PagedResult<AdminProductListItem>> ListProductsAsync(int page, int pageSize, string? search, ProductStatus? status, CancellationToken ct = default);
    Task<AdminProductDetail> GetProductAsync(Guid id, CancellationToken ct = default);
    Task<AdminProductDetail> CreateProductAsync(UpsertProductRequest request, CancellationToken ct = default);
    Task<AdminProductDetail> UpdateProductAsync(Guid id, UpsertProductRequest request, CancellationToken ct = default);
    Task ArchiveProductAsync(Guid id, CancellationToken ct = default);

    Task<CategoryDto> CreateCategoryAsync(UpsertCategoryRequest request, CancellationToken ct = default);
    Task<CategoryDto> UpdateCategoryAsync(Guid id, UpsertCategoryRequest request, CancellationToken ct = default);
    Task DeleteCategoryAsync(Guid id, CancellationToken ct = default);
}

public class AdminCatalogService : IAdminCatalogService
{
    private readonly IAppDbContext _db;

    public AdminCatalogService(IAppDbContext db) => _db = db;

    public async Task<PagedResult<AdminProductListItem>> ListProductsAsync(
        int page, int pageSize, string? search, ProductStatus? status, CancellationToken ct = default)
    {
        page = page < 1 ? 1 : page;
        pageSize = pageSize is < 1 or > 100 ? 20 : pageSize;

        var q = _db.Products.AsNoTracking();
        if (status.HasValue) q = q.Where(p => p.Status == status.Value);
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            q = q.Where(p => p.Name.ToLower().Contains(term) || p.Slug.Contains(term));
        }

        var total = await q.CountAsync(ct);
        var page1 = await q.OrderByDescending(p => p.CreatedAt).ThenBy(p => p.Id)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Include(p => p.Images).Include(p => p.Variants)
            .ToListAsync(ct);

        var items = page1.Select(p => new AdminProductListItem(
            p.Id, p.Name, p.Slug, p.Status, p.BasePrice,
            p.Variants.Sum(v => v.StockQuantity),
            p.Variants.Count,
            (p.Images.FirstOrDefault(i => i.IsPrimary) ?? p.Images.OrderBy(i => i.SortOrder).FirstOrDefault())?.Url))
            .ToList();

        return new PagedResult<AdminProductListItem>(items, page, pageSize, total);
    }

    public async Task<AdminProductDetail> GetProductAsync(Guid id, CancellationToken ct = default)
    {
        var product = await LoadFull(id, ct) ?? throw new NotFoundException("Product not found.");
        return MapDetail(product);
    }

    public async Task<AdminProductDetail> CreateProductAsync(UpsertProductRequest request, CancellationToken ct = default)
    {
        var slug = await UniqueSlug(request.Slug, request.Name, null, ct);
        EnsureUniqueSkusWithin(request.Variants);

        var product = new Product
        {
            Name = request.Name.Trim(),
            Slug = slug,
            Description = request.Description,
            BasePrice = request.BasePrice,
            Status = request.Status,
        };

        await AttachCategories(product, request.CategoryIds, ct);
        foreach (var img in request.Images) product.Images.Add(NewImage(img));
        foreach (var v in request.Variants) product.Variants.Add(NewVariant(v));
        product.SizeGuide = MapSizeGuide(request.SizeGuide);

        await GuardSkuConflicts(request.Variants, null, ct);

        _db.Products.Add(product);
        await _db.SaveChangesAsync(ct);

        return MapDetail((await LoadFull(product.Id, ct))!);
    }

    public async Task<AdminProductDetail> UpdateProductAsync(Guid id, UpsertProductRequest request, CancellationToken ct = default)
    {
        var product = await LoadFull(id, ct) ?? throw new NotFoundException("Product not found.");
        EnsureUniqueSkusWithin(request.Variants);
        await GuardSkuConflicts(request.Variants, id, ct);

        product.Name = request.Name.Trim();
        product.Slug = await UniqueSlug(request.Slug, request.Name, id, ct);
        product.Description = request.Description;
        product.BasePrice = request.BasePrice;
        product.Status = request.Status;
        product.UpdatedAt = DateTime.UtcNow;

        SyncVariants(product, request.Variants);
        SyncImages(product, request.Images);
        product.SizeGuide = MapSizeGuide(request.SizeGuide);

        product.Categories.Clear();
        await AttachCategories(product, request.CategoryIds, ct);

        await _db.SaveChangesAsync(ct);
        return MapDetail((await LoadFull(id, ct))!);
    }

    public async Task ArchiveProductAsync(Guid id, CancellationToken ct = default)
    {
        var product = await _db.Products.FirstOrDefaultAsync(p => p.Id == id, ct)
            ?? throw new NotFoundException("Product not found.");
        // Archive, never hard-delete — historical orders reference this product.
        product.Status = ProductStatus.Archived;
        product.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
    }

    // ---- Categories ----

    public async Task<CategoryDto> CreateCategoryAsync(UpsertCategoryRequest request, CancellationToken ct = default)
    {
        var slug = Slug.From(string.IsNullOrWhiteSpace(request.Slug) ? request.Name : request.Slug!);
        if (await _db.Categories.AnyAsync(c => c.Slug == slug, ct))
            throw new ConflictException($"A category with slug '{slug}' already exists.");

        var category = new Category { Name = request.Name.Trim(), Slug = slug, ParentId = request.ParentId, SortOrder = request.SortOrder };
        _db.Categories.Add(category);
        await _db.SaveChangesAsync(ct);
        return new CategoryDto(category.Id, category.Name, category.Slug, category.ParentId, category.SortOrder);
    }

    public async Task<CategoryDto> UpdateCategoryAsync(Guid id, UpsertCategoryRequest request, CancellationToken ct = default)
    {
        var category = await _db.Categories.FirstOrDefaultAsync(c => c.Id == id, ct)
            ?? throw new NotFoundException("Category not found.");
        var slug = Slug.From(string.IsNullOrWhiteSpace(request.Slug) ? request.Name : request.Slug!);
        if (await _db.Categories.AnyAsync(c => c.Slug == slug && c.Id != id, ct))
            throw new ConflictException($"A category with slug '{slug}' already exists.");

        category.Name = request.Name.Trim();
        category.Slug = slug;
        category.ParentId = request.ParentId;
        category.SortOrder = request.SortOrder;
        category.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return new CategoryDto(category.Id, category.Name, category.Slug, category.ParentId, category.SortOrder);
    }

    public async Task DeleteCategoryAsync(Guid id, CancellationToken ct = default)
    {
        var category = await _db.Categories.FirstOrDefaultAsync(c => c.Id == id, ct)
            ?? throw new NotFoundException("Category not found.");
        _db.Categories.Remove(category);
        await _db.SaveChangesAsync(ct);
    }

    // ---- Helpers ----

    private Task<Product?> LoadFull(Guid id, CancellationToken ct) =>
        _db.Products
            .Include(p => p.Images)
            .Include(p => p.Variants)
            .Include(p => p.Categories)
            .FirstOrDefaultAsync(p => p.Id == id, ct);

    private async Task AttachCategories(Product product, IReadOnlyList<Guid> categoryIds, CancellationToken ct)
    {
        if (categoryIds.Count == 0) return;
        var categories = await _db.Categories.Where(c => categoryIds.Contains(c.Id)).ToListAsync(ct);
        foreach (var c in categories) product.Categories.Add(c);
    }

    private async Task<string> UniqueSlug(string? requested, string name, Guid? excludeId, CancellationToken ct)
    {
        var baseSlug = Slug.From(string.IsNullOrWhiteSpace(requested) ? name : requested!);
        var slug = baseSlug;
        var i = 2;
        while (await _db.Products.AnyAsync(p => p.Slug == slug && p.Id != excludeId, ct))
            slug = $"{baseSlug}-{i++}";
        return slug;
    }

    private static void EnsureUniqueSkusWithin(IReadOnlyList<UpsertVariantRequest> variants)
    {
        var dupSku = variants.GroupBy(v => v.Sku.Trim().ToUpperInvariant()).FirstOrDefault(g => g.Count() > 1);
        if (dupSku is not null)
            throw new ValidationException($"Duplicate SKU '{dupSku.Key}' within the product.");

        var dupCombo = variants.GroupBy(v => (v.Color.Trim().ToLower(), v.Size.Trim().ToLower())).FirstOrDefault(g => g.Count() > 1);
        if (dupCombo is not null)
            throw new ValidationException($"Duplicate color/size '{dupCombo.Key.Item1}/{dupCombo.Key.Item2}'.");
    }

    private async Task GuardSkuConflicts(IReadOnlyList<UpsertVariantRequest> variants, Guid? productId, CancellationToken ct)
    {
        var skus = variants.Select(v => v.Sku.Trim()).ToList();
        var conflict = await _db.ProductVariants
            .Where(v => skus.Contains(v.Sku) && (productId == null || v.ProductId != productId))
            .Select(v => v.Sku)
            .FirstOrDefaultAsync(ct);
        if (conflict is not null)
            throw new ConflictException($"SKU '{conflict}' is already used by another product.");
    }

    private void SyncVariants(Product product, IReadOnlyList<UpsertVariantRequest> requested)
    {
        var keepIds = requested.Where(r => r.Id.HasValue).Select(r => r.Id!.Value).ToHashSet();

        // Remove variants no longer present.
        foreach (var existing in product.Variants.Where(v => !keepIds.Contains(v.Id)).ToList())
            product.Variants.Remove(existing);

        foreach (var r in requested)
        {
            var existing = r.Id.HasValue ? product.Variants.FirstOrDefault(v => v.Id == r.Id.Value) : null;
            if (existing is null)
            {
                var variant = NewVariant(r);
                variant.ProductId = product.Id;
                // Add via the DbSet (not the tracked parent's collection): with
                // client-generated GUID keys, adding to the collection would be treated
                // as Modified, and adding to both would double-insert.
                _db.ProductVariants.Add(variant);
            }
            else
            {
                existing.Color = r.Color.Trim();
                existing.Size = r.Size.Trim();
                existing.Sku = r.Sku.Trim();
                existing.Price = r.Price;
                existing.StockQuantity = r.StockQuantity;
                existing.IsActive = r.IsActive;
                existing.UpdatedAt = DateTime.UtcNow;
            }
        }
    }

    private void SyncImages(Product product, IReadOnlyList<UpsertImageRequest> requested)
    {
        var keepIds = requested.Where(r => r.Id.HasValue).Select(r => r.Id!.Value).ToHashSet();
        foreach (var existing in product.Images.Where(i => !keepIds.Contains(i.Id)).ToList())
            product.Images.Remove(existing);

        foreach (var r in requested)
        {
            var existing = r.Id.HasValue ? product.Images.FirstOrDefault(i => i.Id == r.Id.Value) : null;
            if (existing is null)
            {
                var image = NewImage(r);
                image.ProductId = product.Id;
                _db.ProductImages.Add(image); // add via DbSet (client-generated key)
            }
            else
            {
                existing.Url = r.Url;
                existing.AltText = r.AltText;
                existing.SortOrder = r.SortOrder;
                existing.IsPrimary = r.IsPrimary;
            }
        }
    }

    private static ProductVariant NewVariant(UpsertVariantRequest r) => new()
    {
        Color = r.Color.Trim(),
        Size = r.Size.Trim(),
        Sku = r.Sku.Trim(),
        Price = r.Price,
        StockQuantity = r.StockQuantity,
        IsActive = r.IsActive
    };

    private static ProductImage NewImage(UpsertImageRequest r) => new()
    {
        Url = r.Url,
        AltText = r.AltText,
        SortOrder = r.SortOrder,
        IsPrimary = r.IsPrimary
    };

    private static List<SizeMeasurement> MapSizeGuide(IReadOnlyList<SizeMeasurementDto>? guide) =>
        (guide ?? Array.Empty<SizeMeasurementDto>())
            .Where(m => !string.IsNullOrWhiteSpace(m.Size) && !string.IsNullOrWhiteSpace(m.Dimension) && !string.IsNullOrWhiteSpace(m.Value))
            .Select(m => new SizeMeasurement
            {
                Size = m.Size.Trim(),
                Dimension = m.Dimension.Trim(),
                Value = m.Value.Trim(),
                Unit = string.IsNullOrWhiteSpace(m.Unit) ? "in" : m.Unit.Trim(),
                SortOrder = m.SortOrder
            })
            .ToList();

    private static AdminProductDetail MapDetail(Product p) => new(
        p.Id, p.Name, p.Slug, p.Description, p.BasePrice, p.Status,
        p.Categories.Select(c => c.Id).ToList(),
        p.Images.OrderByDescending(i => i.IsPrimary).ThenBy(i => i.SortOrder)
            .Select(i => new AdminImageDto(i.Id, i.Url, i.AltText, i.SortOrder, i.IsPrimary)).ToList(),
        p.Variants.OrderBy(v => v.Color).ThenBy(v => v.Size)
            .Select(v => new AdminVariantDto(v.Id, v.Color, v.Size, v.Sku, v.Price, v.StockQuantity, v.IsActive)).ToList(),
        p.SizeGuide.OrderBy(m => m.SortOrder)
            .Select(m => new SizeMeasurementDto(m.Size, m.Dimension, m.Value, m.Unit, m.SortOrder)).ToList());
}
