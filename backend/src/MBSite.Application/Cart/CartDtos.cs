namespace MBSite.Application.Cart;

/// <summary>A cart line with live pricing + availability recomputed from the catalog.</summary>
public record CartItemDto(
    Guid ProductVariantId,
    Guid ProductId,
    string ProductName,
    string Slug,
    string Color,
    string Size,
    decimal UnitPrice,
    int Quantity,
    decimal LineTotal,
    string? ImageUrl,
    bool Available,
    int AvailableQuantity,
    string? Issue);

public record CartDto(
    string Token,
    IReadOnlyList<CartItemDto> Items,
    decimal Subtotal,
    int ItemCount,
    string Currency);

public record AddCartItemRequest(Guid ProductVariantId, int Quantity);
public record UpdateCartItemRequest(int Quantity);
