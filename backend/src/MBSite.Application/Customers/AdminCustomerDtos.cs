namespace MBSite.Application.Customers;

public record AdminCustomerListItem(
    Guid Id,
    string Email,
    string FullName,
    int TotalOrders,
    decimal TotalSpent,
    DateTime? LastOrderAt,
    DateTime CreatedAt);

public record AdminCustomerOrderRow(
    Guid OrderId,
    string PublicReference,
    string Status,
    decimal GrandTotal,
    string Currency,
    DateTime CreatedAt);

public record AdminCustomerDetail(
    Guid Id,
    string Email,
    string FirstName,
    string LastName,
    string Phone,
    int TotalOrders,
    decimal TotalSpent,
    DateTime? LastOrderAt,
    DateTime CreatedAt,
    IReadOnlyList<AdminCustomerOrderRow> RecentOrders);
