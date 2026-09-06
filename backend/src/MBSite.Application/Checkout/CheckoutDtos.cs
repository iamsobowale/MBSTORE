namespace MBSite.Application.Checkout;

public record CheckoutRequest(
    string CartToken,
    string FirstName,
    string LastName,
    string Email,
    string Phone,
    string AddressLine,
    string State,
    string City,
    string? DeliveryInstructions,
    string? DiscountCode);

public record OrderItemDto(
    string ProductName,
    string Color,
    string Size,
    string Sku,
    string? ImageUrl,
    decimal UnitPrice,
    int Quantity,
    decimal LineTotal);

public record OrderSummaryDto(
    string PublicReference,
    string TrackingToken,
    string Status,
    string Email,
    string FirstName,
    string LastName,
    string Phone,
    string AddressLine,
    string State,
    string City,
    decimal Subtotal,
    decimal DiscountTotal,
    decimal ShippingTotal,
    decimal GrandTotal,
    string Currency,
    string? DiscountCode,
    DateTime createdAt,
    IReadOnlyList<OrderItemDto> Items,
    IReadOnlyList<OrderStatusEntryDto> StatusHistory);

public record OrderStatusEntryDto(string Status, string? Note, DateTime At);
