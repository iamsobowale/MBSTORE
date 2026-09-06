using MBSite.Domain.Orders;

namespace MBSite.Application.Notifications;

/// <summary>
/// Renders customer-facing order emails. Only the statuses a customer should hear
/// about are templated; anything else is not notifiable (see <see cref="TryGet"/>).
/// </summary>
public static class OrderEmailTemplates
{
    /// <summary>The statuses that trigger a customer email, mapped to a template key.</summary>
    public static readonly IReadOnlyDictionary<OrderStatus, string> Notifiable = new Dictionary<OrderStatus, string>
    {
        [OrderStatus.PendingPayment] = "order.created",
        [OrderStatus.Paid] = "order.paid",
        [OrderStatus.Processing] = "order.processing",
        [OrderStatus.Shipped] = "order.shipped",
        [OrderStatus.Delivered] = "order.delivered",
        [OrderStatus.Cancelled] = "order.cancelled",
    };

    public static bool IsNotifiable(OrderStatus status) => Notifiable.ContainsKey(status);

    /// <summary>Builds the email for an order's current status, or null if not notifiable.</summary>
    public static EmailMessage? TryGet(Order order, OrderStatus status, string storeUrl)
    {
        if (!Notifiable.ContainsKey(status)) return null;

        var name = string.IsNullOrWhiteSpace(order.FirstName) ? "there" : order.FirstName;
        var reference = order.PublicReference;
        var trackUrl = $"{storeUrl.TrimEnd('/')}/track?ref={Uri.EscapeDataString(reference)}&email={Uri.EscapeDataString(order.Email)}";
        var total = $"{order.Currency} {order.GrandTotal:N2}";

        var (subject, headline, body) = status switch
        {
            OrderStatus.PendingPayment => (
                $"We received your order {reference}",
                "Thanks for your order!",
                $"We've received order <strong>{reference}</strong> ({total}) and are awaiting payment confirmation. We'll email you as soon as it's confirmed."),
            OrderStatus.Paid => (
                $"Payment confirmed for {reference}",
                "Your payment is confirmed",
                $"We've confirmed payment for order <strong>{reference}</strong> ({total}). It's now queued for processing."),
            OrderStatus.Processing => (
                $"Your order {reference} is being prepared",
                "We're preparing your order",
                $"Good news — order <strong>{reference}</strong> is now being prepared for dispatch."),
            OrderStatus.Shipped => (
                $"Your order {reference} has shipped",
                "Your order is on its way",
                $"Order <strong>{reference}</strong> has been shipped and is on its way to you."),
            OrderStatus.Delivered => (
                $"Your order {reference} was delivered",
                "Delivered — enjoy!",
                $"Order <strong>{reference}</strong> has been marked as delivered. We hope you love it."),
            OrderStatus.Cancelled => (
                $"Your order {reference} was cancelled",
                "Your order was cancelled",
                $"Order <strong>{reference}</strong> has been cancelled. If you were charged, a refund will follow. Reply to this email with any questions."),
            _ => ("", "", "")
        };

        var html = $"""
            <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;color:#111">
              <h2 style="margin:0 0 12px">{headline}</h2>
              <p>Hi {name},</p>
              <p>{body}</p>
              <p><a href="{trackUrl}" style="display:inline-block;padding:10px 18px;background:#111;color:#fff;text-decoration:none;border-radius:6px">Track your order</a></p>
              <p style="color:#666;font-size:13px">Reference: {reference}</p>
            </div>
            """;

        var text =
            $"{headline}\n\nHi {name},\n\n" +
            body.Replace("<strong>", "").Replace("</strong>", "") +
            $"\n\nTrack your order: {trackUrl}\nReference: {reference}\n";

        return new EmailMessage(order.Email, subject, html, text);
    }
}
