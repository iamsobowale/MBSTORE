using MBSite.Application.Cart;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MBSite.Api.Controllers;

[ApiController]
[Route("api/v1/cart")]
[AllowAnonymous]
public class CartController : ControllerBase
{
    private readonly ICartService _cart;

    public CartController(ICartService cart) => _cart = cart;

    /// <summary>Returns the cart for the given token (or an empty cart if none).</summary>
    [HttpGet]
    public async Task<ActionResult<CartDto>> Get([FromQuery] string? token, CancellationToken ct)
        => Ok(await _cart.GetAsync(token, ct));

    /// <summary>Adds an item; creates a cart (new token) if none is supplied.</summary>
    [HttpPost("items")]
    public async Task<ActionResult<CartDto>> Add([FromQuery] string? token, AddCartItemRequest request, CancellationToken ct)
        => Ok(await _cart.AddItemAsync(token, request, ct));

    [HttpPut("items/{variantId:guid}")]
    public async Task<ActionResult<CartDto>> Update(string token, Guid variantId, UpdateCartItemRequest request, CancellationToken ct)
        => Ok(await _cart.UpdateItemAsync(token, variantId, request.Quantity, ct));

    [HttpDelete("items/{variantId:guid}")]
    public async Task<ActionResult<CartDto>> Remove(string token, Guid variantId, CancellationToken ct)
        => Ok(await _cart.RemoveItemAsync(token, variantId, ct));
}
