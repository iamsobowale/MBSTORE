using MBSite.Domain.Common;

namespace MBSite.Domain.Payments;

public enum PaymentStatus
{
    Initiated = 0,
    Succeeded = 1,
    Failed = 2,
    Refunded = 3,
    PartiallyRefunded = 4
}

/// <summary>
/// A payment attempt against an order. The provider reference links our record to
/// the gateway transaction; the webhook is the authoritative confirmation.
/// </summary>
public class Payment : BaseEntity
{
    public Guid OrderId { get; set; }
    public string Provider { get; set; } = string.Empty;
    public string ProviderReference { get; set; } = string.Empty;
    public PaymentStatus Status { get; set; } = PaymentStatus.Initiated;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "NGN";
    public string? RawPayload { get; set; }
    public DateTime? ConfirmedAt { get; set; }
}
