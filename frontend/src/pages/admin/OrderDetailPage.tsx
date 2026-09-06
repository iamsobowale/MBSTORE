import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getAdminOrder, ORDER_STATUS_LABEL, updateOrderStatus } from "../../features/admin/ordersApi";
import { formatMoney } from "../../lib/format";
import { OrderStatusBadge } from "../../components/OrderStatusBadge";
import { OrderTimeline } from "../../components/OrderTimeline";

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: order, isLoading } = useQuery({
    queryKey: ["admin-order", id],
    queryFn: () => getAdminOrder(id!),
    enabled: !!id,
  });

  const transition = useMutation({
    mutationFn: (status: string) => updateOrderStatus(id!, status, note || undefined),
    onSuccess: (updated) => {
      setNote("");
      setError(null);
      qc.setQueryData(["admin-order", id], updated);
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { detail?: string; title?: string } } })?.response?.data;
      setError(msg?.detail ?? msg?.title ?? "Could not update the order status.");
    },
  });

  if (isLoading) return <p>Loading…</p>;
  if (!order) return <p>Order not found. <Link to="/admin/orders">Back to orders</Link></p>;

  return (
    <div>
      <Link to="/admin/orders" style={{ color: "var(--color-muted)", fontSize: "var(--text-sm)" }}>← Orders</Link>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "var(--space-2) 0 var(--space-6)" }}>
        <h1 style={{ fontSize: "var(--text-2xl)", margin: 0 }}>{order.publicReference}</h1>
        <OrderStatusBadge status={order.status} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "var(--space-8)", alignItems: "start" }}>
        <div>
          <Section title="Items">
            {order.items.map((i, idx) => (
              <div key={idx} style={{ display: "flex", gap: "var(--space-4)", padding: "var(--space-3) 0", borderBottom: "1px solid var(--color-border)" }}>
                <div style={{ width: 48, height: 60, background: "var(--color-surface)", borderRadius: "var(--radius-sm)", overflow: "hidden", flexShrink: 0 }}>
                  {i.imageUrl && <img src={i.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{i.productName}</div>
                  <div style={{ color: "var(--color-muted)", fontSize: "var(--text-sm)" }}>
                    {[i.color, i.size].filter(Boolean).join(" · ")} × {i.quantity}
                  </div>
                </div>
                <div>{formatMoney(i.lineTotal)}</div>
              </div>
            ))}
            <div style={{ marginTop: "var(--space-4)", maxWidth: 280, marginLeft: "auto" }}>
              <Row label="Subtotal" value={formatMoney(order.subtotal)} />
              {order.discountTotal > 0 && <Row label={`Discount${order.discountCode ? ` (${order.discountCode})` : ""}`} value={`- ${formatMoney(order.discountTotal)}`} />}
              <Row label="Shipping" value={order.shippingTotal === 0 ? "Free" : formatMoney(order.shippingTotal)} />
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, marginTop: "var(--space-2)" }}>
                <span>Total</span><span>{formatMoney(order.grandTotal)}</span>
              </div>
            </div>
          </Section>

          <Section title="Customer">
            <p style={{ color: "var(--color-muted)", margin: 0, lineHeight: 1.7 }}>
              {order.firstName} {order.lastName}<br />
              {order.addressLine}, {order.city}, {order.state}<br />
              {order.phone} · {order.email}
              {order.deliveryInstructions && <><br /><em>“{order.deliveryInstructions}”</em></>}
            </p>
          </Section>
        </div>

        <div>
          <Section title="Update status">
            {order.nextStatuses.length === 0 ? (
              <p style={{ color: "var(--color-muted)", margin: 0 }}>This order is in a final state.</p>
            ) : (
              <>
                <textarea
                  placeholder="Optional note (shown in history)…"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  style={{ width: "100%", padding: "var(--space-2)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", marginBottom: "var(--space-3)", resize: "vertical", fontFamily: "inherit" }}
                />
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                  {order.nextStatuses.map((s) => (
                    <button
                      key={s}
                      disabled={transition.isPending}
                      onClick={() => { if (confirm(`Move order to "${ORDER_STATUS_LABEL[s] ?? s}"?`)) transition.mutate(s); }}
                      style={actionBtn}
                    >
                      → {ORDER_STATUS_LABEL[s] ?? s}
                    </button>
                  ))}
                </div>
                {error && <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", marginTop: "var(--space-3)" }}>{error}</p>}
              </>
            )}
          </Section>

          <Section title="History">
            <OrderTimeline entries={order.history.map((h) => ({ status: h.toStatus, note: h.note, at: h.at }))} />
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "var(--space-8)" }}>
      <h2 style={{ fontSize: "var(--text-lg)", marginBottom: "var(--space-3)" }}>{title}</h2>
      {children}
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

const actionBtn = {
  padding: "var(--space-2) var(--space-4)",
  background: "var(--color-primary)",
  color: "var(--color-accent)",
  borderRadius: "var(--radius-sm)",
  fontWeight: 600,
  border: "none",
  cursor: "pointer",
  textAlign: "left" as const,
};
