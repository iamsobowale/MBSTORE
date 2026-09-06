using MBSite.Application.Checkout;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace MBSite.Api.Controllers;

[ApiController]
[Route("api/v1/orders")]
[AllowAnonymous]
public class OrdersController : ControllerBase
{
    private readonly ICheckoutService _checkout;

    public OrdersController(ICheckoutService checkout) => _checkout = checkout;

    /// <summary>
    /// Fetches an order by its secret tracking token (used by the confirmation and
    /// tracking pages). No sequential ids are ever exposed.
    /// </summary>
    /// <summary>
    /// Self-service tracking by public reference + email (the details on the
    /// customer's confirmation email). The literal "track" route takes precedence
    /// over the tracking-token route below.
    /// </summary>
    [HttpGet("track")]
    [EnableRateLimiting("tracking")]
    public async Task<ActionResult<OrderSummaryDto>> Track(
        [FromQuery] string reference, [FromQuery] string email, CancellationToken ct)
    {
        var order = await _checkout.GetByReferenceAndEmailAsync(reference, email, ct);
        return order is null ? NotFound() : Ok(order);
    }

    [HttpGet("{trackingToken}")]
    public async Task<ActionResult<OrderSummaryDto>> GetByToken(string trackingToken, CancellationToken ct)
    {
        var order = await _checkout.GetByTokenAsync(trackingToken, ct);
        return order is null ? NotFound() : Ok(order);
    }
}
