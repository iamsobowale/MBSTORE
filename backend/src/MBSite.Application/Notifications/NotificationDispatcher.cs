using MBSite.Application.Common.Interfaces;
using MBSite.Domain.Notifications;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace MBSite.Application.Notifications;

/// <summary>
/// Delivers queued notifications. Called on a schedule by a background hosted
/// service. Picks up Pending rows and Failed rows whose backoff window has elapsed,
/// renders the template, sends via <see cref="IEmailSender"/>, and records the
/// outcome. Delivery is decoupled from the request that raised the event so a slow
/// or flaky mail provider never affects checkout, payment, or admin actions.
/// </summary>
public class NotificationDispatcher
{
    public const int MaxAttempts = 5;
    private const int BatchSize = 20;

    private readonly IAppDbContext _db;
    private readonly IEmailSender _email;
    private readonly ILogger<NotificationDispatcher> _logger;
    private readonly string _storeUrl;

    public NotificationDispatcher(IAppDbContext db, IEmailSender email, IConfiguration config,
        ILogger<NotificationDispatcher> logger)
    {
        _db = db;
        _email = email;
        _logger = logger;
        _storeUrl = config["Notifications:StoreUrl"] ?? config["Payments:ReturnBaseUrl"] ?? "http://localhost:5173";
    }

    /// <summary>Sends everything currently due. Returns the number of successful sends.</summary>
    public async Task<int> DispatchDueAsync(CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;

        var candidates = await _db.Notifications
            .Where(n => n.Status == NotificationStatus.Pending
                     || (n.Status == NotificationStatus.Failed && n.Attempts < MaxAttempts))
            .OrderBy(n => n.CreatedAt)
            .Take(BatchSize)
            .ToListAsync(ct);

        // Skip failed rows still inside their exponential backoff window.
        var due = candidates.Where(n => n.Status == NotificationStatus.Pending || BackoffElapsed(n, now)).ToList();
        if (due.Count == 0) return 0;

        var orderIds = due.Where(n => n.OrderId.HasValue).Select(n => n.OrderId!.Value).Distinct().ToList();
        var orders = await _db.Orders.AsNoTracking()
            .Where(o => orderIds.Contains(o.Id))
            .ToDictionaryAsync(o => o.Id, ct);

        var sent = 0;
        foreach (var n in due)
        {
            n.Attempts += 1;
            n.UpdatedAt = now;
            try
            {
                if (n.OrderId is null || !orders.TryGetValue(n.OrderId.Value, out var order))
                    throw new InvalidOperationException("Notification has no resolvable order.");

                var status = OrderEmailTemplates.Notifiable.First(kv => kv.Value == n.TemplateKey).Key;
                var message = OrderEmailTemplates.TryGet(order, status, _storeUrl)
                    ?? throw new InvalidOperationException($"No template rendered for {n.TemplateKey}.");

                await _email.SendAsync(message, ct);

                n.Status = NotificationStatus.Sent;
                n.SentAt = now;
                sent++;
            }
            catch (Exception ex)
            {
                n.Status = NotificationStatus.Failed;
                _logger.LogWarning(ex, "Notification {EventKey} send failed (attempt {Attempts}/{Max}).",
                    n.EventKey, n.Attempts, MaxAttempts);
            }
        }

        await _db.SaveChangesAsync(ct);
        return sent;
    }

    // Exponential backoff between retries: ~1, 2, 4, 8 minutes after each failure.
    private static bool BackoffElapsed(Notification n, DateTime now)
    {
        var delay = TimeSpan.FromMinutes(Math.Pow(2, Math.Max(0, n.Attempts - 1)));
        return n.UpdatedAt + delay <= now;
    }
}
