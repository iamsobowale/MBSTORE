using MBSite.Application.Common.Interfaces;
using MBSite.Domain.Catalog;
using MBSite.Domain.Orders;
using Microsoft.EntityFrameworkCore;

namespace MBSite.Application.Dashboard;

public interface IDashboardService
{
    Task<DashboardMetrics> GetMetricsAsync(CancellationToken ct = default);
}

public class DashboardService : IDashboardService
{
    private const int LowStockThreshold = 5;
    private const int RecentOrderCount = 10;
    private const int TimeSeriesDays = 30;

    private readonly IAppDbContext _db;

    public DashboardService(IAppDbContext db) => _db = db;

    public async Task<DashboardMetrics> GetMetricsAsync(CancellationToken ct = default)
    {
        var paidStatuses = new[]
        {
            OrderStatus.Paid, OrderStatus.Processing, OrderStatus.ReadyForDispatch,
            OrderStatus.Shipped, OrderStatus.Delivered
        };

        var totalRevenue = await _db.Orders.AsNoTracking()
            .Where(o => paidStatuses.Contains(o.Status))
            .SumAsync(o => (decimal?)o.GrandTotal ?? 0m, ct);

        var totalOrders = await _db.Orders.AsNoTracking().CountAsync(ct);

        var awaitingProcessing = await _db.Orders.AsNoTracking()
            .CountAsync(o => o.Status == OrderStatus.Paid, ct);

        var lowStockVariants = await _db.ProductVariants.AsNoTracking()
            .CountAsync(v => v.IsActive && v.StockQuantity <= LowStockThreshold, ct);

        var recentOrders = await _db.Orders.AsNoTracking()
            .Where(o => o.Status != OrderStatus.PendingPayment)
            .OrderByDescending(o => o.CreatedAt)
            .Take(RecentOrderCount)
            .Select(o => new RecentOrderRow(
                o.Id,
                o.PublicReference,
                o.Status.ToString(),
                (o.FirstName + " " + o.LastName).Trim(),
                o.GrandTotal,
                o.CreatedAt))
            .ToListAsync(ct);

        var since = DateTime.UtcNow.Date.AddDays(-TimeSeriesDays + 1);
        var dailyOrders = await _db.Orders.AsNoTracking()
            .Where(o => paidStatuses.Contains(o.Status) && o.PlacedAt >= since)
            .Select(o => new { Date = o.PlacedAt!.Value.Date, o.GrandTotal })
            .ToListAsync(ct);

        var timeSeries = Enumerable.Range(0, TimeSeriesDays)
            .Select(i => since.AddDays(i))
            .Select(date =>
            {
                var dayOrders = dailyOrders.Where(o => o.Date == date).ToList();
                return new SalesDataPoint(
                    date.ToString("yyyy-MM-dd"),
                    dayOrders.Sum(o => o.GrandTotal),
                    dayOrders.Count);
            })
            .ToList();

        return new DashboardMetrics(totalRevenue, totalOrders, awaitingProcessing, lowStockVariants, recentOrders, timeSeries);
    }
}
