namespace MBSite.Domain.Orders;

/// <summary>
/// The allowed order status transitions. Payment confirmation drives
/// PendingPayment→Paid; admins drive fulfilment and cancellation/refunds. Anything
/// not listed is rejected.
/// </summary>
public static class OrderStatusTransitions
{
    private static readonly Dictionary<OrderStatus, OrderStatus[]> Allowed = new()
    {
        [OrderStatus.PendingPayment] = new[] { OrderStatus.Paid, OrderStatus.PaymentFailed, OrderStatus.Cancelled },
        [OrderStatus.PaymentFailed] = new[] { OrderStatus.PendingPayment, OrderStatus.Cancelled },
        [OrderStatus.Paid] = new[] { OrderStatus.Processing, OrderStatus.Cancelled, OrderStatus.Refunded },
        [OrderStatus.Processing] = new[] { OrderStatus.ReadyForDispatch, OrderStatus.Cancelled, OrderStatus.Refunded },
        [OrderStatus.ReadyForDispatch] = new[] { OrderStatus.Shipped, OrderStatus.Cancelled, OrderStatus.Refunded },
        [OrderStatus.Shipped] = new[] { OrderStatus.Delivered, OrderStatus.Refunded },
        [OrderStatus.Delivered] = new[] { OrderStatus.Refunded, OrderStatus.PartiallyRefunded },
        [OrderStatus.PartiallyRefunded] = new[] { OrderStatus.Refunded },
        [OrderStatus.Cancelled] = Array.Empty<OrderStatus>(),
        [OrderStatus.Refunded] = Array.Empty<OrderStatus>(),
    };

    public static bool CanTransition(OrderStatus from, OrderStatus to) =>
        Allowed.TryGetValue(from, out var targets) && targets.Contains(to);

    /// <summary>Next statuses an admin can move an order to from its current status.</summary>
    public static IReadOnlyList<OrderStatus> NextStatuses(OrderStatus from) =>
        Allowed.TryGetValue(from, out var targets) ? targets : Array.Empty<OrderStatus>();
}
