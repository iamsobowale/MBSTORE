namespace MBSite.Application.Dashboard;

public record DashboardMetrics(
    decimal TotalRevenue,
    int TotalOrders,
    int AwaitingProcessing,
    int LowStockVariants,
    IReadOnlyList<RecentOrderRow> RecentOrders,
    IReadOnlyList<SalesDataPoint> SalesTimeSeries);

public record RecentOrderRow(
    Guid Id,
    string PublicReference,
    string Status,
    string CustomerName,
    decimal GrandTotal,
    DateTime CreatedAt);

public record SalesDataPoint(string Date, decimal Revenue, int Orders);
