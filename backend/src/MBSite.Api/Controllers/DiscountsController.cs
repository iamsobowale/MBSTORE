using MBSite.Application.Checkout;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MBSite.Api.Controllers;

[ApiController]
[Route("api/v1/discounts")]
[AllowAnonymous]
public class DiscountsController : ControllerBase
{
    private readonly IDiscountService _discounts;

    public DiscountsController(IDiscountService discounts) => _discounts = discounts;

    public record ValidateRequest(string Code, decimal Subtotal);
    public record ValidateResponse(bool Valid, string? Error, decimal Amount);

    /// <summary>
    /// Previews a discount for the cart. Non-authoritative — checkout re-validates
    /// the code against the server-computed subtotal.
    /// </summary>
    [HttpPost("validate")]
    public async Task<ActionResult<ValidateResponse>> Validate(ValidateRequest request, CancellationToken ct)
    {
        var result = await _discounts.ValidateAsync(request.Code, request.Subtotal, ct);
        return Ok(new ValidateResponse(result.IsValid, result.Error, result.Amount));
    }
}
