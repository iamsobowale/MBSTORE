using MBSite.Application.Common;
using MBSite.Application.Common.Interfaces;
using MBSite.Application.Notifications;
using MBSite.Domain.Orders;
using Microsoft.EntityFrameworkCore;

namespace MBSite.Application.Orders;

public interface IAdminOrderService
{
    Task<PagedResult<AdminOrderListItem>> ListAsync(
        int page, int pageSize, string? search, OrderStatus? status, CancellationToken ct = default);
    Task<AdminOrderDetail> GetAsync(Guid id, CancellationToken ct = default);
    Task<AdminOrderDetail> UpdateStatusAsync(
        Guid id, OrderStatus to, string? note, Guid? byUserId, CancellationToken ct = default);
}

/// <summary>
/// Admin order operations: search/list, detail, and status transitions. Transitions
/// are validated against <see cref="OrderStatusTransitions"/>, record history, are
/// idempotent (moving to the current status is a no-op), and raise an
/// <see cref="OrderStatusChanged"/> event so notifications fire without this service
/// knowing about email.
/// </summary>
public class AdminOrderService : IAdminOrderService
{
    private readonly IAppDbContext _db;
    private readonly IOrderEventPublisher _events;

    public AdminOrderService(IAppDbContext db, IOrderEventPublisher events)
    {
        _db = db;
        _events = events;
    }

    public async Task<PagedResult<AdminOrderListItem>> ListAsync(
        int page, int pageSize, string? search, OrderStatus? status, CancellationToken ct = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _db.Orders.AsNoTracking();

        if (status is not null)
            query = query.Where(o => o.Status == status);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(o =>
                o.PublicReference.ToLower().Contains(term) ||
                o.Email.ToLower().Contains(term) ||
                (o.FirstName + " " + o.LastName).ToLower().Contains(term));
        }

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(o => o.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(o => new AdminOrderListItem(
                o.Id,
                o.PublicReference,
                o.Status.ToString(),
                (o.FirstName + " " + o.LastName).Trim(),
                o.Email,
                o.GrandTotal,
                o.Currency,
                o.Items.Count,
                o.CreatedAt))
            .ToListAsync(ct);

        return new PagedResult<AdminOrderListItem>(items, page, pageSize, total);
    }

    public async Task<AdminOrderDetail> GetAsync(Guid id, CancellationToken ct = default)
    {
        var order = await _db.Orders.AsNoTracking()
            .Include(o => o.Items)
            .Include(o => o.StatusHistory)
            .FirstOrDefaultAsync(o => o.Id == id, ct)
            ?? throw new NotFoundException("Order not found.");
        return Map(order);
    }

    public async Task<AdminOrderDetail> UpdateStatusAsync(
        Guid id, OrderStatus to, string? note, Guid? byUserId, CancellationToken ct = default)
    {
        var order = await _db.Orders
            .Include(o => o.Items)
            .Include(o => o.StatusHistory)
            .FirstOrDefaultAsync(o => o.Id == id, ct)
            ?? throw new NotFoundException("Order not found.");

        // Idempotent: already there — return as-is without a duplicate history/event.
        if (order.Status == to)
            return Map(order);

        if (!OrderStatusTransitions.CanTransition(order.Status, to))
            throw new ValidationException($"Cannot move an order from {order.Status} to {to}.");

        var from = order.Status;
        order.Status = to;
        order.UpdatedAt = DateTime.UtcNow;
        _db.OrderStatusHistory.Add(new OrderStatusHistory
        {
            OrderId = order.Id,
            FromStatus = from,
            ToStatus = to,
            Note = string.IsNullOrWhiteSpace(note) ? null : note.Trim(),
            ChangedByUserId = byUserId
        });

        await _db.SaveChangesAsync(ct);
        await _events.PublishStatusChangedAsync(new OrderStatusChanged(order.Id, from, to, byUserId), ct);

        return await GetAsync(id, ct);
    }

    private static AdminOrderDetail Map(Order o) => new(
        o.Id,
        o.PublicReference,
        o.TrackingToken,
        o.Status.ToString(),
        OrderStatusTransitions.NextStatuses(o.Status).Select(s => s.ToString()).ToList(),
        o.Email, o.FirstName, o.LastName, o.Phone,
        o.AddressLine, o.City, o.State, o.DeliveryInstructions,
        o.DiscountCode,
        o.Subtotal, o.DiscountTotal, o.ShippingTotal, o.GrandTotal, o.Currency,
        o.PlacedAt, o.CreatedAt,
        o.Items.Select(i => new AdminOrderItemDto(
            i.ProductNameSnapshot, i.ColorSnapshot, i.SizeSnapshot, i.SkuSnapshot,
            i.ImageUrlSnapshot, i.UnitPriceSnapshot, i.Quantity, i.LineTotalSnapshot)).ToList(),
        o.StatusHistory.OrderBy(h => h.CreatedAt)
            .Select(h => new AdminOrderStatusEntry(
                h.FromStatus?.ToString(), h.ToStatus.ToString(), h.Note, h.CreatedAt)).ToList());
}
