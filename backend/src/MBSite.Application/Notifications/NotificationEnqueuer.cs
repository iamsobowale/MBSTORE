using MBSite.Application.Common.Interfaces;
using MBSite.Domain.Notifications;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace MBSite.Application.Notifications;

/// <summary>
/// Order-event handler that enqueues a customer email when an order reaches a
/// notifiable status. Enqueue only — actual delivery is done by the background
/// <see cref="NotificationDispatcher"/>. Idempotent via the unique EventKey
/// "{orderId}:{status}", so duplicate events (e.g. a retried webhook) never enqueue
/// twice.
/// </summary>
public class NotificationEnqueuer : IOrderEventHandler
{
    private readonly IAppDbContext _db;
    private readonly ILogger<NotificationEnqueuer> _logger;

    public NotificationEnqueuer(IAppDbContext db, ILogger<NotificationEnqueuer> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task HandleAsync(OrderStatusChanged evt, CancellationToken ct = default)
    {
        if (!OrderEmailTemplates.IsNotifiable(evt.To)) return;

        var eventKey = $"{evt.OrderId}:{evt.To}";
        if (await _db.Notifications.AnyAsync(n => n.EventKey == eventKey, ct))
            return; // already enqueued for this order+status

        var order = await _db.Orders.AsNoTracking()
            .FirstOrDefaultAsync(o => o.Id == evt.OrderId, ct);
        if (order is null) return;

        _db.Notifications.Add(new Notification
        {
            Channel = NotificationChannel.Email,
            Recipient = order.Email,
            TemplateKey = OrderEmailTemplates.Notifiable[evt.To],
            OrderId = order.Id,
            EventKey = eventKey,
            Status = NotificationStatus.Pending
        });

        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException)
        {
            // Unique EventKey index lost a race with a concurrent handler — fine, it's queued.
            _logger.LogDebug("Notification {EventKey} already enqueued concurrently.", eventKey);
        }
    }
}
