using MBSite.Application.Common;
using MBSite.Application.Common.Interfaces;
using MBSite.Application.Customers;
using MBSite.Application.Notifications;
using MBSite.Domain.Catalog;
using MBSite.Domain.Orders;
using MBSite.Domain.Promotions;
using Microsoft.EntityFrameworkCore;

namespace MBSite.Application.Checkout;

public interface ICheckoutService
{
    Task<OrderSummaryDto> PlaceOrderAsync(CheckoutRequest request, CancellationToken ct = default);
    Task<OrderSummaryDto?> GetByTokenAsync(string trackingToken, CancellationToken ct = default);
    Task<OrderSummaryDto?> GetByReferenceAndEmailAsync(string reference, string email, CancellationToken ct = default);
}

public class CheckoutService : ICheckoutService
{
    // Flat shipping policy for MVP (configurable in a later iteration).
    private const decimal FlatShipping = 2500m;
    private const decimal FreeShippingThreshold = 100_000m;
    private static readonly TimeSpan PendingOrderTtl = TimeSpan.FromMinutes(30);

    private readonly IAppDbContext _db;
    private readonly IDiscountService _discounts;
    private readonly IOrderEventPublisher _events;
    private readonly IAdminCustomerService _customers;

    public CheckoutService(IAppDbContext db, IDiscountService discounts, IOrderEventPublisher events, IAdminCustomerService customers)
    {
        _db = db;
        _discounts = discounts;
        _events = events;
        _customers = customers;
    }

    public async Task<OrderSummaryDto> PlaceOrderAsync(CheckoutRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Email)) throw new ValidationException("Email is required.");

        var cart = await _db.Carts.Include(c => c.Items)
            .FirstOrDefaultAsync(c => c.AnonymousToken == request.CartToken, ct)
            ?? throw new NotFoundException("Cart not found.");
        if (cart.Items.Count == 0) throw new ValidationException("Your cart is empty.");

        // Re-load catalog data as the source of truth (never trust cart prices).
        var variantIds = cart.Items.Select(i => i.ProductVariantId).ToList();
        var variants = await _db.ProductVariants.Where(v => variantIds.Contains(v.Id)).ToListAsync(ct);
        var productIds = variants.Select(v => v.ProductId).Distinct().ToList();
        var products = await _db.Products.Where(p => productIds.Contains(p.Id)).Include(p => p.Images).ToListAsync(ct);
        var productMap = products.ToDictionary(p => p.Id);

        var order = new Order
        {
            PublicReference = await UniqueReference(ct),
            TrackingToken = TokenGenerator.UrlSafe(32),
            Email = request.Email.Trim().ToLowerInvariant(),
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            Phone = request.Phone.Trim(),
            AddressLine = request.AddressLine.Trim(),
            State = request.State.Trim(),
            City = request.City.Trim(),
            DeliveryInstructions = request.DeliveryInstructions,
            Status = OrderStatus.PendingPayment,
            Currency = "NGN",
            ExpiresAt = DateTime.UtcNow.Add(PendingOrderTtl),
            PlacedAt = DateTime.UtcNow
        };

        decimal subtotal = 0m;
        foreach (var ci in cart.Items)
        {
            var variant = variants.FirstOrDefault(v => v.Id == ci.ProductVariantId);
            var product = variant is not null && productMap.TryGetValue(variant.ProductId, out var p) ? p : null;

            // Backend availability revalidation — the authoritative check.
            if (variant is null || product is null || product.Status != ProductStatus.Published || !variant.IsActive)
                throw new ValidationException($"An item in your cart is no longer available. Please review your cart.");
            if (variant.StockQuantity < ci.Quantity)
                throw new ValidationException($"'{product.Name}' ({variant.Color}/{variant.Size}) only has {variant.StockQuantity} left. Please update your cart.");

            var unitPrice = variant.Price ?? product.BasePrice;
            var lineTotal = unitPrice * ci.Quantity;
            subtotal += lineTotal;

            var image = product.Images.FirstOrDefault(i => i.IsPrimary) ?? product.Images.OrderBy(i => i.SortOrder).FirstOrDefault();
            order.Items.Add(new OrderItem
            {
                OrderId = order.Id,
                ProductId = product.Id,
                ProductVariantId = variant.Id,
                ProductNameSnapshot = product.Name,
                ColorSnapshot = variant.Color,
                SizeSnapshot = variant.Size,
                SkuSnapshot = variant.Sku,
                ImageUrlSnapshot = image?.Url,
                UnitPriceSnapshot = unitPrice,
                Quantity = ci.Quantity,
                LineTotalSnapshot = lineTotal
            });
        }

        // Discount (re-validated against the server-computed subtotal).
        decimal discountTotal = 0m;
        Discount? appliedDiscount = null;
        if (!string.IsNullOrWhiteSpace(request.DiscountCode))
        {
            var result = await _discounts.ValidateAsync(request.DiscountCode, subtotal, ct);
            if (!result.IsValid) throw new ValidationException(result.Error!);
            discountTotal = result.Amount;
            appliedDiscount = result.Discount;
            order.DiscountCode = appliedDiscount!.Code;
        }

        var shipping = subtotal - discountTotal >= FreeShippingThreshold ? 0m : FlatShipping;

        order.Subtotal = subtotal;
        order.DiscountTotal = discountTotal;
        order.ShippingTotal = shipping;
        order.GrandTotal = subtotal - discountTotal + shipping;

        order.StatusHistory.Add(new OrderStatusHistory
        {
            OrderId = order.Id,
            FromStatus = null,
            ToStatus = OrderStatus.PendingPayment,
            Note = "Order created"
        });

        _db.Orders.Add(order);

        if (appliedDiscount is not null)
        {
            appliedDiscount.UsageCount += 1;
            _db.DiscountUsages.Add(new DiscountUsage
            {
                DiscountId = appliedDiscount.Id,
                OrderId = order.Id,
                CustomerEmail = order.Email,
                AmountApplied = discountTotal
            });
        }

        // Clear the cart now that it's been converted to an order.
        _db.CartItems.RemoveRange(cart.Items);

        await _db.SaveChangesAsync(ct);

        // Upsert customer record (fire-and-forget errors — checkout must not fail for this).
        try { await _customers.UpsertFromOrderAsync(order, ct); }
        catch { /* non-critical — customer record will be created on next order */ }

        // Order created — notify (event-driven; checkout doesn't touch the email layer).
        await _events.PublishStatusChangedAsync(
            new OrderStatusChanged(order.Id, null, OrderStatus.PendingPayment, null), ct);

        return Map(order);
    }

    public async Task<OrderSummaryDto?> GetByTokenAsync(string trackingToken, CancellationToken ct = default)
    {
        var order = await _db.Orders.AsNoTracking()
            .Include(o => o.Items)
            .Include(o => o.StatusHistory)
            .FirstOrDefaultAsync(o => o.TrackingToken == trackingToken, ct);
        return order is null ? null : Map(order);
    }

    public async Task<OrderSummaryDto?> GetByReferenceAndEmailAsync(string reference, string email, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(reference) || string.IsNullOrWhiteSpace(email))
            return null;

        var normalizedRef = reference.Trim().ToUpperInvariant();
        var normalizedEmail = email.Trim().ToLowerInvariant();

        var order = await _db.Orders.AsNoTracking()
            .Include(o => o.Items)
            .Include(o => o.StatusHistory)
            .FirstOrDefaultAsync(o => o.PublicReference == normalizedRef && o.Email == normalizedEmail, ct);
        return order is null ? null : Map(order);
    }

    private async Task<string> UniqueReference(CancellationToken ct)
    {
        for (var attempt = 0; attempt < 10; attempt++)
        {
            var reference = TokenGenerator.OrderReference();
            if (!await _db.Orders.AnyAsync(o => o.PublicReference == reference, ct))
                return reference;
        }
        throw new InvalidOperationException("Could not generate a unique order reference.");
    }

    private static OrderSummaryDto Map(Order o) => new(
        o.PublicReference, o.TrackingToken, o.Status.ToString(),
        o.Email, o.FirstName, o.LastName, o.Phone, o.AddressLine, o.State, o.City,
        o.Subtotal, o.DiscountTotal, o.ShippingTotal, o.GrandTotal, o.Currency, o.DiscountCode,
        o.CreatedAt,
        o.Items.Select(i => new OrderItemDto(
            i.ProductNameSnapshot, i.ColorSnapshot, i.SizeSnapshot, i.SkuSnapshot,
            i.ImageUrlSnapshot, i.UnitPriceSnapshot, i.Quantity, i.LineTotalSnapshot)).ToList(),
        o.StatusHistory.OrderBy(h => h.CreatedAt)
            .Select(h => new OrderStatusEntryDto(h.ToStatus.ToString(), h.Note, h.CreatedAt)).ToList());
}
