namespace MBSite.Application.Orders;

/// <summary>Row in the admin order list.</summary>
public record AdminOrderListItem(
    Guid Id,
    string PublicReference,
    string Status,
    string CustomerName,
    string Email,
    decimal GrandTotal,
    string Currency,
    int ItemCount,
    DateTime CreatedAt);

public record AdminOrderItemDto(
    string ProductName, string? Color, string? Size, string? Sku,
    string? ImageUrl, decimal UnitPrice, int Quantity, decimal LineTotal);

public record AdminOrderStatusEntry(string? FromStatus, string ToStatus, string? Note, DateTime At);

/// <summary>Full order view for the admin detail page.</summary>
public record AdminOrderDetail(
    Guid Id,
    string PublicReference,
    string TrackingToken,
    string Status,
    IReadOnlyList<string> NextStatuses,
    string Email,
    string FirstName,
    string LastName,
    string Phone,
    string AddressLine,
    string City,
    string State,
    string? DeliveryInstructions,
    string? DiscountCode,
    decimal Subtotal,
    decimal DiscountTotal,
    decimal ShippingTotal,
    decimal GrandTotal,
    string Currency,
    DateTime? PlacedAt,
    DateTime CreatedAt,
    IReadOnlyList<AdminOrderItemDto> Items,
    IReadOnlyList<AdminOrderStatusEntry> History);

/// <summary>Admin request to move an order to a new status.</summary>
public record UpdateOrderStatusRequest(string Status, string? Note);
