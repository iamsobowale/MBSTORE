import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { trackOrder, type OrderSummary } from "../../features/checkout/api";
import { formatMoney } from "../../lib/format";
import { OrderStatusBadge } from "../../components/OrderStatusBadge";
import { OrderTimeline } from "../../components/OrderTimeline";

export function TrackOrderPage() {
  const [reference, setReference] = useState("");
  const [email, setEmail] = useState("");
  const [order, setOrder] = useState<OrderSummary | null>(null);
  const [notFound, setNotFound] = useState(false);

  const lookup = useMutation({
    mutationFn: () => trackOrder(reference.trim(), email.trim()),
    onSuccess: (o) => { setOrder(o); setNotFound(false); },
    onError: () => { setOrder(null); setNotFound(true); },
  });

  return (
    <div className="container" style={{ padding: "var(--space-12) 0", maxWidth: 720 }}>
      <h1 style={{ fontSize: "var(--text-2xl)" }}>Track your order</h1>
      <p style={{ color: "var(--color-muted)" }}>
        Enter your order reference and the email you used at checkout.
      </p>

      <form
        onSubmit={(e) => { e.preventDefault(); if (reference.trim() && email.trim()) lookup.mutate(); }}
        style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap", margin: "var(--space-6) 0" }}
      >
        <input
          placeholder="Order reference (e.g. MB-XXXXXX)"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          style={input}
          required
        />
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={input}
          required
        />
        <button type="submit" disabled={lookup.isPending} className="mb-btn" style={{ padding: "var(--space-2) var(--space-6)" }}>
          {lookup.isPending ? "Looking…" : "Track"}
        </button>
      </form>

      {notFound && (
        <p style={{ color: "var(--color-danger)" }}>
          We couldn’t find an order with that reference and email. Double-check both and try again.
        </p>
      )}

      {order && (
        <div style={{ background: "var(--color-surface)", borderRadius: "var(--radius-md)", padding: "var(--space-8)", marginTop: "var(--space-4)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-6)" }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: "var(--text-lg)" }}>{order.publicReference}</div>
              <div style={{ color: "var(--color-muted)", fontSize: "var(--text-sm)" }}>
                Placed {new Date(order.createdAt).toLocaleDateString()}
              </div>
            </div>
            <OrderStatusBadge status={order.status} />
          </div>

          <h2 style={{ fontSize: "var(--text-lg)", marginBottom: "var(--space-3)" }}>Progress</h2>
          <OrderTimeline entries={order.statusHistory} />

          <h2 style={{ fontSize: "var(--text-lg)", margin: "var(--space-6) 0 var(--space-3)" }}>Items</h2>
          {order.items.map((i, idx) => (
            <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
              <span>{i.productName} <span style={{ color: "var(--color-muted)" }}>· {[i.color, i.size].filter(Boolean).join(" / ")} × {i.quantity}</span></span>
              <span>{formatMoney(i.lineTotal)}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, marginTop: "var(--space-4)" }}>
            <span>Total</span><span>{formatMoney(order.grandTotal)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

const input = {
  flex: 1,
  minWidth: 220,
  padding: "var(--space-2) var(--space-3)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-sm)",
} as const;
