using MBSite.Domain.Common;

namespace MBSite.Domain.Catalog;

/// <summary>
/// A purchasable color/size combination. Inventory lives here, never on the parent
/// product. <see cref="RowVersion"/> is an optimistic-concurrency token so two
/// buyers cannot oversell the last unit.
/// </summary>
public class ProductVariant : BaseEntity
{
    public Guid ProductId { get; set; }
    public string Color { get; set; } = string.Empty;
    public string Size { get; set; } = string.Empty;
    public string Sku { get; set; } = string.Empty;

    /// <summary>Optional per-variant price override; falls back to Product.BasePrice.</summary>
    public decimal? Price { get; set; }

    public int StockQuantity { get; set; }
    public bool IsActive { get; set; } = true;

    // Optimistic concurrency uses the Postgres system column xmin, configured as a
    // shadow property in the EF mapping (see ProductVariantConfiguration) so two
    // buyers cannot oversell the last unit.

    public bool IsAvailable => IsActive && StockQuantity > 0;
}
