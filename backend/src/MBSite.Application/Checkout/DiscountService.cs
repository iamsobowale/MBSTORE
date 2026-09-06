using MBSite.Application.Common.Interfaces;
using MBSite.Domain.Promotions;
using Microsoft.EntityFrameworkCore;

namespace MBSite.Application.Checkout;

/// <summary>Outcome of validating a discount code against a subtotal.</summary>
public record DiscountResult(bool IsValid, string? Error, decimal Amount, Discount? Discount)
{
    public static DiscountResult Fail(string error) => new(false, error, 0m, null);
    public static DiscountResult Ok(decimal amount, Discount d) => new(true, null, amount, d);
}

public interface IDiscountService
{
    /// <summary>
    /// Validates a code and computes the discount amount for the given subtotal.
    /// Always called server-side at checkout — cart-time results are never trusted.
    /// </summary>
    Task<DiscountResult> ValidateAsync(string code, decimal subtotal, CancellationToken ct = default);
}

public class DiscountService : IDiscountService
{
    private readonly IAppDbContext _db;

    public DiscountService(IAppDbContext db) => _db = db;

    public async Task<DiscountResult> ValidateAsync(string code, decimal subtotal, CancellationToken ct = default)
    {
        var normalized = code.Trim().ToUpperInvariant();
        var discount = await _db.Discounts.FirstOrDefaultAsync(d => d.Code == normalized, ct);

        if (discount is null) return DiscountResult.Fail("Discount code not found.");
        if (!discount.IsActive) return DiscountResult.Fail("This discount code is no longer active.");

        var now = DateTime.UtcNow;
        if (discount.StartsAt.HasValue && now < discount.StartsAt.Value) return DiscountResult.Fail("This discount code is not yet valid.");
        if (discount.ExpiresAt.HasValue && now > discount.ExpiresAt.Value) return DiscountResult.Fail("This discount code has expired.");
        if (discount.MaxUsage.HasValue && discount.UsageCount >= discount.MaxUsage.Value) return DiscountResult.Fail("This discount code has reached its usage limit.");
        if (discount.MinOrderAmount.HasValue && subtotal < discount.MinOrderAmount.Value)
            return DiscountResult.Fail($"Add more to reach the minimum order of {discount.MinOrderAmount.Value:N0} for this code.");

        var amount = discount.Type == DiscountType.Percentage
            ? Math.Round(subtotal * discount.Value / 100m, 2)
            : discount.Value;

        // Never let a discount exceed the order value.
        amount = Math.Min(amount, subtotal);
        return DiscountResult.Ok(amount, discount);
    }
}
