using MBSite.Domain.Common;

namespace MBSite.Domain.Cart;

public class CartItem : BaseEntity
{
    public Guid CartId { get; set; }
    public Guid ProductVariantId { get; set; }
    public int Quantity { get; set; }
}
