import { ORDER_STATUS_LABEL } from "../features/admin/ordersApi";

// Semantic colour per status group (pending/neutral, positive, terminal-bad).
const COLOR: Record<string, string> = {
  PendingPayment: "var(--color-muted)",
  Paid: "var(--color-success)",
  Processing: "var(--color-primary)",
  ReadyForDispatch: "var(--color-primary)",
  Shipped: "var(--color-primary)",
  Delivered: "var(--color-success)",
  PaymentFailed: "var(--color-danger)",
  Cancelled: "var(--color-danger)",
  Refunded: "var(--color-danger)",
  PartiallyRefunded: "var(--color-danger)",
};

export function OrderStatusBadge({ status }: { status: string }) {
  const color = COLOR[status] ?? "var(--color-muted)";
  return (
    <span style={{ fontSize: "var(--text-xs)", padding: "2px 8px", borderRadius: "var(--radius-sm)", border: `1px solid ${color}`, color, whiteSpace: "nowrap" }}>
      {ORDER_STATUS_LABEL[status] ?? status}
    </span>
  );
}
