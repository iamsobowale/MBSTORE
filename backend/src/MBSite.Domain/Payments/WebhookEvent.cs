using MBSite.Domain.Common;

namespace MBSite.Domain.Payments;

/// <summary>
/// Idempotency ledger for provider webhooks. A unique (Provider, ProviderEventId)
/// guarantees a duplicated/retried webhook is processed at most once.
/// </summary>
public class WebhookEvent : BaseEntity
{
    public string Provider { get; set; } = string.Empty;
    public string ProviderEventId { get; set; } = string.Empty;
    public DateTime ReceivedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ProcessedAt { get; set; }
    public string Status { get; set; } = "received";
}
