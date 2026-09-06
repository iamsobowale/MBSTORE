using MBSite.Domain.Common;

namespace MBSite.Domain.Catalog;

/// <summary>
/// A sellable product. Pricing/stock detail lives on <see cref="ProductVariant"/> —
/// the parent only carries a base price used as a fallback and for display ranges.
/// Products are never hard-deleted (archive instead) so historical orders stay valid.
/// </summary>
public class Product : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal BasePrice { get; set; }
    public ProductStatus Status { get; set; } = ProductStatus.Draft;

    public List<ProductVariant> Variants { get; set; } = new();
    public List<ProductImage> Images { get; set; } = new();
    public List<Category> Categories { get; set; } = new();

    /// <summary>Optional per-size measurement estimates (size guide).</summary>
    public List<SizeMeasurement> SizeGuide { get; set; } = new();
}
