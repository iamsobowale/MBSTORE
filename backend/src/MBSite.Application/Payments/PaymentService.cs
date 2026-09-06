using MBSite.Application.Common;
using MBSite.Application.Common.Interfaces;
using MBSite.Application.Notifications;
using MBSite.Domain.Orders;
using MBSite.Domain.Payments;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace MBSite.Application.Payments;

public interface IPaymentService
{
    Task<PaymentInitResponse> InitiateAsync(string trackingToken, CancellationToken ct = default);
    Task<PaymentResultDto> VerifyAndConfirmAsync(string providerReference, CancellationToken ct = default);
    Task HandleWebhookAsync(string providerName, string rawBody, string? signature, CancellationToken ct = default);
}

public class PaymentService : IPaymentService
{
    private readonly IAppDbContext _db;
    private readonly IPaymentProvider _provider;
    private readonly IOrderEventPublisher _events;
    private readonly string _returnBaseUrl;

    public PaymentService(IAppDbContext db, IPaymentProvider provider, IOrderEventPublisher events, IConfiguration config)
    {
        _db = db;
        _provider = provider;
        _events = events;
        _returnBaseUrl = (config["Payments:ReturnBaseUrl"] ?? "http://localhost:5173").TrimEnd('/');
    }

    public async Task<PaymentInitResponse> InitiateAsync(string trackingToken, CancellationToken ct = default)
    {
        var order = await _db.Orders.FirstOrDefaultAsync(o => o.TrackingToken == trackingToken, ct)
            ?? throw new NotFoundException("Order not found.");
        if (order.Status != OrderStatus.PendingPayment)
            throw new ValidationException("This order is not awaiting payment.");

        var callbackUrl = $"{_returnBaseUrl}/payment/callback";
        var init = await _provider.InitializeAsync(order, callbackUrl, ct);

        _db.Payments.Add(new Payment
        {
            OrderId = order.Id,
            Provider = _provider.Name,
            ProviderReference = init.ProviderReference,
            Amount = order.GrandTotal,
            Currency = order.Currency,
            Status = PaymentStatus.Initiated
        });
        await _db.SaveChangesAsync(ct);

        return new PaymentInitResponse(init.AuthorizationUrl, init.ProviderReference);
    }

    public async Task<PaymentResultDto> VerifyAndConfirmAsync(string providerReference, CancellationToken ct = default)
    {
        var outcome = await _provider.VerifyAsync(providerReference, ct);

        if (outcome.Success)
            await ConfirmAsync(outcome, ct);
        else
            await MarkFailedAsync(providerReference, ct);

        var payment = await _db.Payments.AsNoTracking().FirstOrDefaultAsync(p => p.ProviderReference == providerReference, ct)
            ?? throw new NotFoundException("Payment not found.");
        var order = await _db.Orders.AsNoTracking().FirstAsync(o => o.Id == payment.OrderId, ct);

        return new PaymentResultDto(
            outcome.Success,
            order.Status.ToString(),
            order.TrackingToken,
            order.PublicReference,
            outcome.Success ? null : "Payment was not completed.");
    }

    public async Task HandleWebhookAsync(string providerName, string rawBody, string? signature, CancellationToken ct = default)
    {
        if (!_provider.VerifyWebhookSignature(rawBody, signature))
            throw new UnauthorizedException("Invalid webhook signature.");

        var outcome = _provider.ParseWebhook(rawBody);
        var eventId = string.IsNullOrWhiteSpace(outcome.EventId) ? outcome.ProviderReference : outcome.EventId;

        // Idempotency: a given provider event is processed at most once.
        if (await _db.WebhookEvents.AnyAsync(w => w.Provider == providerName && w.ProviderEventId == eventId, ct))
            return;

        _db.WebhookEvents.Add(new WebhookEvent { Provider = providerName, ProviderEventId = eventId, Status = "processing" });
        try
        {
            await _db.SaveChangesAsync(ct); // unique index guards concurrent duplicates
        }
        catch (DbUpdateException)
        {
            return; // another delivery won the race
        }

        if (outcome.Success)
            await ConfirmAsync(outcome, ct);

        var evt = await _db.WebhookEvents.FirstAsync(w => w.Provider == providerName && w.ProviderEventId == eventId, ct);
        evt.ProcessedAt = DateTime.UtcNow;
        evt.Status = "processed";
        await _db.SaveChangesAsync(ct);
    }

    /// <summary>
    /// Idempotently confirms a payment: atomically claims the order's
    /// PendingPayment→Paid transition, then decrements variant stock with a
    /// conditional UPDATE so concurrent buyers can never oversell.
    /// </summary>
    private async Task ConfirmAsync(PaymentOutcome outcome, CancellationToken ct)
    {
        var payment = await _db.Payments.FirstOrDefaultAsync(p => p.ProviderReference == outcome.ProviderReference, ct);
        if (payment is null) return; // unknown reference — nothing to confirm

        var now = DateTime.UtcNow;

        // Atomically claim the transition. If another path already confirmed, this
        // affects 0 rows and we skip the stock decrement (idempotent).
        var claimed = await _db.Orders
            .Where(o => o.Id == payment.OrderId && o.Status == OrderStatus.PendingPayment)
            .ExecuteUpdateAsync(s => s
                .SetProperty(o => o.Status, OrderStatus.Paid)
                .SetProperty(o => o.PlacedAt, o => o.PlacedAt ?? now), ct);

        if (claimed == 0)
        {
            if (payment.Status != PaymentStatus.Succeeded)
            {
                payment.Status = PaymentStatus.Succeeded;
                payment.ConfirmedAt = now;
                payment.RawPayload = outcome.RawPayload;
                await _db.SaveChangesAsync(ct);
            }
            return;
        }

        var items = await _db.OrderItems.Where(i => i.OrderId == payment.OrderId).ToListAsync(ct);
        var shortfall = false;
        foreach (var item in items)
        {
            var affected = await _db.ProductVariants
                .Where(v => v.Id == item.ProductVariantId && v.StockQuantity >= item.Quantity)
                .ExecuteUpdateAsync(s => s.SetProperty(v => v.StockQuantity, v => v.StockQuantity - item.Quantity), ct);
            if (affected == 0) shortfall = true;
        }

        _db.OrderStatusHistory.Add(new OrderStatusHistory
        {
            OrderId = payment.OrderId,
            FromStatus = OrderStatus.PendingPayment,
            ToStatus = OrderStatus.Paid,
            Note = shortfall ? "Payment confirmed (stock shortfall — review)" : "Payment confirmed"
        });

        payment.Status = PaymentStatus.Succeeded;
        payment.ConfirmedAt = now;
        payment.RawPayload = outcome.RawPayload;
        await _db.SaveChangesAsync(ct);

        // We won the transition claim — notify exactly once (idempotent downstream too).
        await _events.PublishStatusChangedAsync(
            new OrderStatusChanged(payment.OrderId, OrderStatus.PendingPayment, OrderStatus.Paid, null), ct);
    }

    private async Task MarkFailedAsync(string providerReference, CancellationToken ct)
    {
        var payment = await _db.Payments.FirstOrDefaultAsync(p => p.ProviderReference == providerReference, ct);
        if (payment is not null && payment.Status == PaymentStatus.Initiated)
        {
            payment.Status = PaymentStatus.Failed;
            await _db.SaveChangesAsync(ct);
        }
    }
}
