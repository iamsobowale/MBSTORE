namespace MBSite.Domain.Orders;

public enum OrderStatus
{
    PendingPayment = 0,
    Paid = 1,
    Processing = 2,
    ReadyForDispatch = 3,
    Shipped = 4,
    Delivered = 5,
    PaymentFailed = 6,
    Cancelled = 7,
    Refunded = 8,
    PartiallyRefunded = 9
}
