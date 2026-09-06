using MBSite.Application.Checkout;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MBSite.Api.Controllers;

[ApiController]
[Route("api/v1/checkout")]
[AllowAnonymous]
public class CheckoutController : ControllerBase
{
    private readonly ICheckoutService _checkout;

    public CheckoutController(ICheckoutService checkout) => _checkout = checkout;

    /// <summary>Places a pending order after server-side revalidation of the cart.</summary>
    [HttpPost]
    public async Task<ActionResult<OrderSummaryDto>> Place(CheckoutRequest request, CancellationToken ct)
        => Ok(await _checkout.PlaceOrderAsync(request, ct));
}
