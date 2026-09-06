using MBSite.Application.Payments;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace MBSite.Api.Controllers;

[ApiController]
[Route("api/v1/payments")]
[AllowAnonymous]
public class PaymentsController : ControllerBase
{
    private readonly IPaymentService _payments;

    public PaymentsController(IPaymentService payments) => _payments = payments;

    /// <summary>Starts payment for a pending order; returns the gateway redirect URL.</summary>
    [HttpPost("initiate")]
    public async Task<ActionResult<PaymentInitResponse>> Initiate(InitiatePaymentRequest request, CancellationToken ct)
        => Ok(await _payments.InitiateAsync(request.TrackingToken, ct));

    /// <summary>
    /// Redirect-return verification. Confirms via server-to-server check; the webhook
    /// remains the authoritative path, so this is safe to call and idempotent.
    /// </summary>
    [HttpPost("verify")]
    public async Task<ActionResult<PaymentResultDto>> Verify(VerifyPaymentRequest request, CancellationToken ct)
        => Ok(await _payments.VerifyAndConfirmAsync(request.Reference, ct));

    /// <summary>
    /// Provider webhook (authoritative). Reads the raw body for signature verification
    /// and processes idempotently.
    /// </summary>
    [HttpPost("webhook/{provider}")]
    [EnableRateLimiting("webhook")]
    public async Task<IActionResult> Webhook(string provider, CancellationToken ct)
    {
        using var reader = new StreamReader(Request.Body);
        var rawBody = await reader.ReadToEndAsync(ct);

        var signature = Request.Headers.TryGetValue("x-paystack-signature", out var sig)
            ? sig.ToString()
            : null;

        await _payments.HandleWebhookAsync(provider, rawBody, signature, ct);
        return Ok();
    }
}
