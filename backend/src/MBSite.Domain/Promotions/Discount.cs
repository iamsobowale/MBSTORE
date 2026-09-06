using MBSite.Domain.Common;

namespace MBSite.Domain.Promotions;

public enum DiscountType
{
    Percentage = 0,
    FixedAmount = 1
}

/// <summary>
/// A discount code. Validity (dates, usage limit, minimum order, active flag) is
/// always re-checked server-side at checkout — never trusted from the cart.
/// </summary>
public class Discount : BaseEntity
{
    public string Code { get; set; } = string.Empty;
    public DiscountType Type { get; set; }
    public decimal Value { get; set; }

    public decimal? MinOrderAmount { get; set; }
    public int? MaxUsage { get; set; }
    public int UsageCount { get; set; }

    public DateTime? StartsAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public bool IsActive { get; set; } = true;
}
