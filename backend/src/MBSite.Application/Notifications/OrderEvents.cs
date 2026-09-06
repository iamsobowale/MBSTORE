using MBSite.Domain.Orders;

namespace MBSite.Application.Notifications;

/// <summary>
/// Raised whenever an order reaches a new status (creation, payment confirmation, or
/// an admin fulfilment transition). Side effects (notifications) react to this event
/// so order/payment services never call the notification layer directly.
/// </summary>
public record OrderStatusChanged(Guid OrderId, OrderStatus? From, OrderStatus To, Guid? ByUserId);

/// <summary>Publishes order events to all registered handlers.</summary>
public interface IOrderEventPublisher
{
    Task PublishStatusChangedAsync(OrderStatusChanged evt, CancellationToken ct = default);
}

/// <summary>A subscriber to order events. Handlers must not throw into the publisher.</summary>
public interface IOrderEventHandler
{
    Task HandleAsync(OrderStatusChanged evt, CancellationToken ct = default);
}
