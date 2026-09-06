using MBSite.Domain.Common;

namespace MBSite.Domain.Orders;

/// <summary>
/// A line in an order. Stores snapshots of the product/variant at purchase time so
/// later catalog edits never alter historical orders. Variant/product ids are kept
/// for reference only (they may be archived).
/// </summary>
public class OrderItem : BaseEntity
{
    public Guid OrderId { get; set; }

    public Guid ProductId { get; set; }
    public Guid ProductVariantId { get; set; }

    public string ProductNameSnapshot { get; set; } = string.Empty;
    public string ColorSnapshot { get; set; } = string.Empty;
    public string SizeSnapshot { get; set; } = string.Empty;
    public string SkuSnapshot { get; set; } = string.Empty;
    public string? ImageUrlSnapshot { get; set; }

    public decimal UnitPriceSnapshot { get; set; }
    public int Quantity { get; set; }
    public decimal LineTotalSnapshot { get; set; }
}
