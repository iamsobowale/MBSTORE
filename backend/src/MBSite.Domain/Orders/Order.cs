using MBSite.Domain.Common;

namespace MBSite.Domain.Orders;

/// <summary>
/// A customer order. Exposed publicly only via <see cref="PublicReference"/> and the
/// secret <see cref="TrackingToken"/> — never by sequential id. Totals are computed
/// server-side at checkout; order items keep price/product snapshots so historical
/// orders never change when a product is later edited.
/// </summary>
public class Order : BaseEntity
{
    public string PublicReference { get; set; } = string.Empty;
    public string TrackingToken { get; set; } = string.Empty;

    public Guid? CustomerId { get; set; }

    // Contact + shipping snapshot (guest checkout captures these directly).
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string AddressLine { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string? DeliveryInstructions { get; set; }

    public OrderStatus Status { get; set; } = OrderStatus.PendingPayment;

    public decimal Subtotal { get; set; }
    public decimal DiscountTotal { get; set; }
    public decimal ShippingTotal { get; set; }
    public decimal GrandTotal { get; set; }
    public string Currency { get; set; } = "NGN";

    public string? DiscountCode { get; set; }

    public DateTime? ExpiresAt { get; set; }   // pending-payment expiry
    public DateTime? PlacedAt { get; set; }

    public List<OrderItem> Items { get; set; } = new();
    public List<OrderStatusHistory> StatusHistory { get; set; } = new();
}
