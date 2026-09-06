using MBSite.Domain.Common;

namespace MBSite.Domain.Promotions;

/// <summary>Records each application of a discount to an order (enforces usage limits).</summary>
public class DiscountUsage : BaseEntity
{
    public Guid DiscountId { get; set; }
    public Guid OrderId { get; set; }
    public string CustomerEmail { get; set; } = string.Empty;
    public decimal AmountApplied { get; set; }
}
