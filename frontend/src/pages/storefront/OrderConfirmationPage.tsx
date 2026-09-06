import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { getOrderByToken } from "../../features/checkout/api";
import { formatMoney } from "../../lib/format";

const STATUS_LABEL: Record<string, string> = {
  PendingPayment: "Pending payment",
  Paid: "Paid",
  Processing: "Processing",
  ReadyForDispatch: "Ready for dispatch",
  Shipped: "Shipped",
  Delivered: "Delivered",
  PaymentFailed: "Payment failed",
  Cancelled: "Cancelled",
  Refunded: "Refunded",
  PartiallyRefunded: "Partially refunded",
};

export function OrderConfirmationPage() {
  const { token } = useParams<{ token: string }>();
  const { data: order, isLoading, isError } = useQuery({
    queryKey: ["order", token],
    queryFn: () => getOrderByToken(token!),
    enabled: !!token,
    retry: false,
  });

  if (isLoading) return <div className="container" style={{ padding: "var(--space-16) 0" }}>Loading…</div>;
  if (isError || !order) return <div className="container" style={{ padding: "var(--space-16) 0" }}>Order not found.</div>;

  return (
    <div className="container" style={{ padding: "var(--space-12) 0", maxWidth: 760 }}>
      <div style={{ background: "var(--color-surface)", borderRadius: "var(--radius-md)", padding: "var(--space-8)", textAlign: "center", marginBottom: "var(--space-8)" }}>
        <h1 style={{ fontSize: "var(--text-2xl)", margin: 0 }}>Thank you!</h1>
        <p style={{ color: "var(--color-muted)" }}>Your order <strong>{order.publicReference}</strong> has been placed.</p>
        <span style={{ display: "inline-block", padding: "4px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }}>
          {STATUS_LABEL[order.status] ?? order.status}
        </span>
        <p style={{ color: "var(--color-muted)", fontSize: "var(--text-sm)", marginTop: "var(--space-4)" }}>
          Payment integration arrives in the next phase — this order is awaiting payment.
        </p>
      </div>

      <h2 style={{ fontSize: "var(--text-lg)" }}>Items</h2>
      {order.items.map((i, idx) => (
        <div key={idx} style={{ display: "flex", gap: "var(--space-4)", padding: "var(--space-3) 0", borderBottom: "1px solid var(--color-border)" }}>
          <div style={{ width: 56, height: 70, background: "var(--color-surface)", borderRadius: "var(--radius-sm)", overflow: "hidden", flexShrink: 0 }}>
            {i.imageUrl && <img src={i.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600 }}>{i.productName}</div>
            <div style={{ color: "var(--color-muted)", fontSize: "var(--text-sm)" }}>{i.color} · {i.size} × {i.quantity}</div>
          </div>
          <div>{formatMoney(i.lineTotal)}</div>
        </div>
      ))}

      <div style={{ marginTop: "var(--space-6)", maxWidth: 320, marginLeft: "auto" }}>
        <Row label="Subtotal" value={formatMoney(order.subtotal)} />
        {order.discountTotal > 0 && <Row label={`Discount${order.discountCode ? ` (${order.discountCode})` : ""}`} value={`- ${formatMoney(order.discountTotal)}`} />}
        <Row label="Shipping" value={order.shippingTotal === 0 ? "Free" : formatMoney(order.shippingTotal)} />
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, marginTop: "var(--space-2)" }}>
          <span>Total</span><span>{formatMoney(order.grandTotal)}</span>
        </div>
      </div>

      <div style={{ marginTop: "var(--space-8)" }}>
        <h2 style={{ fontSize: "var(--text-lg)" }}>Delivery</h2>
        <p style={{ color: "var(--color-muted)", margin: 0 }}>
          {order.firstName} {order.lastName}<br />
          {order.addressLine}, {order.city}, {order.state}<br />
          {order.phone} · {order.email}
        </p>
      </div>

      <p style={{ marginTop: "var(--space-8)", color: "var(--color-muted)", fontSize: "var(--text-sm)" }}>
        Keep this link to track your order. <Link to="/shop">Continue shopping →</Link>
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-2)" }}>
      <span style={{ color: "var(--color-muted)" }}>{label}</span><span>{value}</span>
    </div>
  );
}
