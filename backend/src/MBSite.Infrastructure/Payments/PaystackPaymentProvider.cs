using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using MBSite.Application.Common;
using MBSite.Application.Payments;
using MBSite.Domain.Orders;
using Microsoft.Extensions.Configuration;

namespace MBSite.Infrastructure.Payments;

/// <summary>
/// Paystack payment provider (NGN). Initializes a transaction, verifies it
/// server-to-server, and validates webhook signatures (HMAC-SHA512 of the raw body
/// with the secret key). Webhooks remain the authoritative confirmation.
/// </summary>
public class PaystackPaymentProvider : IPaymentProvider
{
    private readonly HttpClient _http;
    private readonly string _secretKey;

    public PaystackPaymentProvider(HttpClient http, IConfiguration config)
    {
        _http = http;
        _secretKey = config["Payments:Paystack:SecretKey"]
            ?? throw new InvalidOperationException("Payments:Paystack:SecretKey is not configured.");
        _http.BaseAddress ??= new Uri(config["Payments:Paystack:BaseUrl"] ?? "https://api.paystack.co");
        _http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _secretKey);
    }

    public string Name => "Paystack";

    public async Task<PaymentInitResult> InitializeAsync(Order order, string callbackUrl, CancellationToken ct = default)
    {
        var reference = $"{order.PublicReference}-{Guid.NewGuid():N}"[..Math.Min(60, order.PublicReference.Length + 33)];
        var body = new
        {
            email = order.Email,
            amount = (long)Math.Round(order.GrandTotal * 100), // kobo
            reference,
            callback_url = callbackUrl,
            currency = order.Currency
        };

        var resp = await _http.PostAsJsonAsync("/transaction/initialize", body, ct);
        var json = await resp.Content.ReadAsStringAsync(ct);
        if (!resp.IsSuccessStatusCode)
            throw new ValidationException($"Payment provider error: {json}");

        using var doc = JsonDocument.Parse(json);
        var data = doc.RootElement.GetProperty("data");
        return new PaymentInitResult(data.GetProperty("authorization_url").GetString()!, reference);
    }

    public async Task<PaymentOutcome> VerifyAsync(string providerReference, CancellationToken ct = default)
    {
        var resp = await _http.GetAsync($"/transaction/verify/{Uri.EscapeDataString(providerReference)}", ct);
        var json = await resp.Content.ReadAsStringAsync(ct);
        if (!resp.IsSuccessStatusCode)
            return new PaymentOutcome(false, providerReference, 0m, "NGN", providerReference, json);

        using var doc = JsonDocument.Parse(json);
        var data = doc.RootElement.GetProperty("data");
        var status = data.GetProperty("status").GetString();
        var amount = data.TryGetProperty("amount", out var a) ? a.GetInt64() / 100m : 0m;
        var currency = data.TryGetProperty("currency", out var c) ? c.GetString() ?? "NGN" : "NGN";
        return new PaymentOutcome(status == "success", providerReference, amount, currency, providerReference, json);
    }

    public bool VerifyWebhookSignature(string rawBody, string? signatureHeader)
    {
        if (string.IsNullOrEmpty(signatureHeader)) return false;
        using var hmac = new HMACSHA512(Encoding.UTF8.GetBytes(_secretKey));
        var hash = Convert.ToHexString(hmac.ComputeHash(Encoding.UTF8.GetBytes(rawBody))).ToLowerInvariant();
        // Constant-time comparison.
        return CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(hash), Encoding.UTF8.GetBytes(signatureHeader.Trim().ToLowerInvariant()));
    }

    public PaymentOutcome ParseWebhook(string rawBody)
    {
        using var doc = JsonDocument.Parse(rawBody);
        var root = doc.RootElement;
        var eventType = root.TryGetProperty("event", out var e) ? e.GetString() : null;
        var data = root.GetProperty("data");
        var reference = data.GetProperty("reference").GetString() ?? "";
        var amount = data.TryGetProperty("amount", out var a) ? a.GetInt64() / 100m : 0m;
        var currency = data.TryGetProperty("currency", out var c) ? c.GetString() ?? "NGN" : "NGN";
        // Use the transaction reference as the idempotency key.
        return new PaymentOutcome(eventType == "charge.success", reference, amount, currency, reference, rawBody);
    }
}
