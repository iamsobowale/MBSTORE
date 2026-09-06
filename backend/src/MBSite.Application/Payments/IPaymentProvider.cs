using MBSite.Domain.Orders;

namespace MBSite.Application.Payments;

public record PaymentInitResult(string AuthorizationUrl, string ProviderReference);

/// <summary>Normalized result of verifying a transaction or parsing a webhook.</summary>
public record PaymentOutcome(
    bool Success,
    string ProviderReference,
    decimal Amount,
    string Currency,
    string? EventId,
    string RawPayload);

/// <summary>
/// Provider-agnostic payment gateway. Concrete providers (Fake, Paystack, …) implement
/// this so the order/payment domain is never coupled to a specific gateway.
/// </summary>
public interface IPaymentProvider
{
    string Name { get; }

    /// <summary>Starts a transaction and returns the URL to redirect the customer to.</summary>
    Task<PaymentInitResult> InitializeAsync(Order order, string callbackUrl, CancellationToken ct = default);

    /// <summary>Server-to-server verification of a transaction (redirect return path).</summary>
    Task<PaymentOutcome> VerifyAsync(string providerReference, CancellationToken ct = default);

    /// <summary>Verifies a webhook payload's signature.</summary>
    bool VerifyWebhookSignature(string rawBody, string? signatureHeader);

    /// <summary>Parses a webhook payload into a normalized outcome.</summary>
    PaymentOutcome ParseWebhook(string rawBody);
}
