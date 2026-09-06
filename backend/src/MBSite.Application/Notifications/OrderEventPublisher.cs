using Microsoft.Extensions.Logging;

namespace MBSite.Application.Notifications;

/// <summary>
/// Fans an <see cref="OrderStatusChanged"/> event out to every registered handler.
/// A failing handler is logged and swallowed so a notification problem can never
/// roll back or block the order/payment transition that raised it.
/// </summary>
public class OrderEventPublisher : IOrderEventPublisher
{
    private readonly IEnumerable<IOrderEventHandler> _handlers;
    private readonly ILogger<OrderEventPublisher> _logger;

    public OrderEventPublisher(IEnumerable<IOrderEventHandler> handlers, ILogger<OrderEventPublisher> logger)
    {
        _handlers = handlers;
        _logger = logger;
    }

    public async Task PublishStatusChangedAsync(OrderStatusChanged evt, CancellationToken ct = default)
    {
        foreach (var handler in _handlers)
        {
            try
            {
                await handler.HandleAsync(evt, ct);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Order event handler {Handler} failed for order {OrderId} → {Status}",
                    handler.GetType().Name, evt.OrderId, evt.To);
            }
        }
    }
}
