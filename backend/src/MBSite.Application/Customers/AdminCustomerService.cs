using MBSite.Application.Common;
using MBSite.Application.Common.Interfaces;
using MBSite.Domain.Customers;
using MBSite.Domain.Orders;
using Microsoft.EntityFrameworkCore;

namespace MBSite.Application.Customers;

public interface IAdminCustomerService
{
    Task<PagedResult<AdminCustomerListItem>> ListAsync(int page, int pageSize, string? search, CancellationToken ct = default);
    Task<AdminCustomerDetail> GetAsync(Guid id, CancellationToken ct = default);

    /// <summary>
    /// Upserts a customer record from a placed order (guest checkout path).
    /// Called by CheckoutService after the order is saved. Creates the record on
    /// first order; increments totals on subsequent ones.
    /// </summary>
    Task UpsertFromOrderAsync(Order order, CancellationToken ct = default);
}

public class AdminCustomerService : IAdminCustomerService
{
    private readonly IAppDbContext _db;

    public AdminCustomerService(IAppDbContext db) => _db = db;

    public async Task<PagedResult<AdminCustomerListItem>> ListAsync(int page, int pageSize, string? search, CancellationToken ct = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _db.Customers.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(c =>
                c.Email.ToLower().Contains(term) ||
                (c.FirstName + " " + c.LastName).ToLower().Contains(term));
        }

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(c => c.LastOrderAt ?? c.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(c => new AdminCustomerListItem(
                c.Id, c.Email, (c.FirstName + " " + c.LastName).Trim(),
                c.TotalOrders, c.TotalSpent, c.LastOrderAt, c.CreatedAt))
            .ToListAsync(ct);

        return new PagedResult<AdminCustomerListItem>(items, page, pageSize, total);
    }

    public async Task<AdminCustomerDetail> GetAsync(Guid id, CancellationToken ct = default)
    {
        var customer = await _db.Customers.AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == id, ct)
            ?? throw new NotFoundException("Customer not found.");

        var recentOrders = await _db.Orders.AsNoTracking()
            .Where(o => o.Email == customer.Email)
            .OrderByDescending(o => o.CreatedAt)
            .Take(20)
            .Select(o => new AdminCustomerOrderRow(
                o.Id, o.PublicReference, o.Status.ToString(), o.GrandTotal, o.Currency, o.CreatedAt))
            .ToListAsync(ct);

        return new AdminCustomerDetail(
            customer.Id, customer.Email, customer.FirstName, customer.LastName, customer.Phone,
            customer.TotalOrders, customer.TotalSpent, customer.LastOrderAt, customer.CreatedAt,
            recentOrders);
    }

    public async Task UpsertFromOrderAsync(Order order, CancellationToken ct = default)
    {
        var email = order.Email.Trim().ToLowerInvariant();
        var customer = await _db.Customers.FirstOrDefaultAsync(c => c.Email == email, ct);

        if (customer is null)
        {
            customer = new Customer
            {
                Email = email,
                FirstName = order.FirstName,
                LastName = order.LastName,
                Phone = order.Phone,
                TotalOrders = 1,
                TotalSpent = order.GrandTotal,
                LastOrderAt = DateTime.UtcNow
            };
            _db.Customers.Add(customer);
        }
        else
        {
            // Refresh contact from the most recent order, increment counters.
            customer.FirstName = order.FirstName;
            customer.LastName = order.LastName;
            customer.Phone = order.Phone;
            customer.TotalOrders += 1;
            customer.TotalSpent += order.GrandTotal;
            customer.LastOrderAt = DateTime.UtcNow;
            customer.UpdatedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync(ct);
    }
}
