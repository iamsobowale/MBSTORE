using MBSite.Domain.Common;

namespace MBSite.Domain.Customers;

/// <summary>
/// A customer record keyed by email. Created (or updated) when a guest places an
/// order. Not required for checkout — guest checkout captures contact on the Order.
/// The record lets admin view order history per email without requiring an account.
/// </summary>
public class Customer : BaseEntity
{
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;

    public int TotalOrders { get; set; }
    public decimal TotalSpent { get; set; }
    public DateTime? LastOrderAt { get; set; }
}
