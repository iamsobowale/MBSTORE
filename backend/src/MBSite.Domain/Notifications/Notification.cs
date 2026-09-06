using MBSite.Domain.Common;

namespace MBSite.Domain.Notifications;

public enum NotificationChannel
{
    Email = 0,
    Sms = 1,
    WhatsApp = 2
}

public enum NotificationStatus
{
    Pending = 0,
    Sent = 1,
    Failed = 2
}

/// <summary>
/// A record of a notification. <see cref="EventKey"/> (e.g. "{orderId}:Shipped") is
/// unique so retries, duplicate webhooks, or repeated status saves never send twice.
/// </summary>
public class Notification : BaseEntity
{
    public NotificationChannel Channel { get; set; } = NotificationChannel.Email;
    public string Recipient { get; set; } = string.Empty;
    public string TemplateKey { get; set; } = string.Empty;
    public Guid? OrderId { get; set; }
    public string EventKey { get; set; } = string.Empty;
    public NotificationStatus Status { get; set; } = NotificationStatus.Pending;
    public int Attempts { get; set; }
    public DateTime? SentAt { get; set; }
}
