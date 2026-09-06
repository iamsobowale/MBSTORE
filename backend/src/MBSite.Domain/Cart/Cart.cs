using MBSite.Domain.Common;

namespace MBSite.Domain.Cart;

/// <summary>
/// A shopping cart. Guests are identified by <see cref="AnonymousToken"/> (stored
/// client-side); registered customers may later attach one. Prices/availability are
/// always recomputed from the catalog — the cart never stores authoritative prices.
/// </summary>
public class Cart : BaseEntity
{
    public Guid? CustomerId { get; set; }
    public string AnonymousToken { get; set; } = string.Empty;
    public DateTime? ExpiresAt { get; set; }

    public List<CartItem> Items { get; set; } = new();
}
