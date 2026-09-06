using MBSite.Domain.Common;

namespace MBSite.Domain.Orders;

/// <summary>An audit entry recorded on every order status transition.</summary>
public class OrderStatusHistory : BaseEntity
{
    public Guid OrderId { get; set; }
    public OrderStatus? FromStatus { get; set; }
    public OrderStatus ToStatus { get; set; }
    public string? Note { get; set; }
    public Guid? ChangedByUserId { get; set; } // null = system
}
