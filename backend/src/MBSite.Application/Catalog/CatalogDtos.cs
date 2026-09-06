namespace MBSite.Application.Catalog;

/// <summary>Card-level product data for listing pages.</summary>
public record ProductListItemDto(
    Guid Id,
    string Name,
    string Slug,
    decimal Price,
    decimal? CompareAtPrice,
    string? PrimaryImageUrl,
    IReadOnlyList<string> Colors,
    bool InStock);

public record ProductImageDto(Guid Id, string Url, string? AltText, bool IsPrimary, int SortOrder);

/// <summary>
/// Public variant view. Exposes availability + a bounded quantity for the quantity
/// selector, but never internal fields. Exact stock is shown so the storefront can
/// cap quantity and surface "only N left".
/// </summary>
public record ProductVariantDto(
    Guid Id,
    string Color,
    string Size,
    decimal Price,
    bool InStock,
    int AvailableQuantity);

public record SizeMeasurementDto(string Size, string Dimension, string Value, string Unit);

public record ProductDetailDto(
    Guid Id,
    string Name,
    string Slug,
    string Description,
    decimal BasePrice,
    bool InStock,
    IReadOnlyList<ProductImageDto> Images,
    IReadOnlyList<ProductVariantDto> Variants,
    IReadOnlyList<string> Colors,
    IReadOnlyList<string> Sizes,
    IReadOnlyList<SizeMeasurementDto> SizeGuide);

public record CategoryDto(Guid Id, string Name, string Slug, Guid? ParentId, int SortOrder);
