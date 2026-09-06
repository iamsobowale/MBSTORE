using MBSite.Domain.Catalog;

namespace MBSite.Application.Catalog.Admin;

// ---- Read models ----

public record AdminProductListItem(
    Guid Id,
    string Name,
    string Slug,
    ProductStatus Status,
    decimal BasePrice,
    int TotalStock,
    int VariantCount,
    string? PrimaryImageUrl);

public record AdminVariantDto(
    Guid Id, string Color, string Size, string Sku, decimal? Price, int StockQuantity, bool IsActive);

public record AdminImageDto(
    Guid Id, string Url, string? AltText, int SortOrder, bool IsPrimary);

public record SizeMeasurementDto(string Size, string Dimension, string Value, string Unit, int SortOrder);

public record AdminProductDetail(
    Guid Id,
    string Name,
    string Slug,
    string Description,
    decimal BasePrice,
    ProductStatus Status,
    IReadOnlyList<Guid> CategoryIds,
    IReadOnlyList<AdminImageDto> Images,
    IReadOnlyList<AdminVariantDto> Variants,
    IReadOnlyList<SizeMeasurementDto> SizeGuide);

// ---- Write models ----

public record UpsertVariantRequest(
    Guid? Id, string Color, string Size, string Sku, decimal? Price, int StockQuantity, bool IsActive = true);

public record UpsertImageRequest(
    Guid? Id, string Url, string? AltText, int SortOrder, bool IsPrimary);

public record UpsertProductRequest(
    string Name,
    string? Slug,
    string Description,
    decimal BasePrice,
    ProductStatus Status,
    IReadOnlyList<Guid> CategoryIds,
    IReadOnlyList<UpsertImageRequest> Images,
    IReadOnlyList<UpsertVariantRequest> Variants,
    IReadOnlyList<SizeMeasurementDto>? SizeGuide = null);

public record UpsertCategoryRequest(string Name, string? Slug, Guid? ParentId, int SortOrder);
