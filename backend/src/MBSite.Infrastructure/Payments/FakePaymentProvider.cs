using System.Text.Json;
using MBSite.Application.Payments;
using MBSite.Domain.Orders;
using Microsoft.Extensions.Configuration;

namespace MBSite.Infrastructure.Payments;

/// <summary>
/// Development payment provider — no external gateway or API keys. It redirects to a
/// local mock page where the flow can be simulated, while exercising the exact same
/// initialize → redirect → verify/webhook → confirm architecture as a real provider.
/// </summary>
public class FakePaymentProvider : IPaymentProvider
{
    private readonly string _returnBaseUrl;

    public FakePaymentProvider(IConfiguration config) =>
        _returnBaseUrl = (config["Payments:ReturnBaseUrl"] ?? "http://localhost:5173").TrimEnd('/');

    public string Name => "Fake";

    public Task<PaymentInitResult> InitializeAsync(Order order, string callbackUrl, CancellationToken ct = default)
    {
        var reference = $"FAKE-{Guid.NewGuid():N}";
        // Redirect to the local mock page, passing where to return afterwards.
        var url = $"{_returnBaseUrl}/payment/mock?reference={reference}&amount={order.GrandTotal}&callback={Uri.EscapeDataString(callbackUrl)}";
        return Task.FromResult(new PaymentInitResult(url, reference));
    }

    public Task<PaymentOutcome> VerifyAsync(string providerReference, CancellationToken ct = default) =>
        Task.FromResult(new PaymentOutcome(true, providerReference, 0m, "NGN", providerReference, "{\"provider\":\"fake\",\"status\":\"success\"}"));

    public bool VerifyWebhookSignature(string rawBody, string? signatureHeader) => true;

    public PaymentOutcome ParseWebhook(string rawBody)
    {
        using var doc = JsonDocument.Parse(rawBody);
        var root = doc.RootElement;
        var reference = root.TryGetProperty("reference", out var r) ? r.GetString() ?? "" : "";
        var status = root.TryGetProperty("status", out var s) ? s.GetString() ?? "" : "";
        return new PaymentOutcome(status == "success", reference, 0m, "NGN", reference, rawBody);
    }
}
