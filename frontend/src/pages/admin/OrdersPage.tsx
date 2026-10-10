import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { listAdminOrders, ORDER_STATUSES, ORDER_STATUS_LABEL } from "../../features/admin/ordersApi";
import { formatMoney } from "../../lib/format";
import { OrderStatusBadge } from "../../components/OrderStatusBadge";

export function OrdersPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders", { search, status, page }],
    queryFn: () => listAdminOrders({ search: search || undefined, status: status || undefined, page, pageSize: 20 }),
    placeholderData: keepPreviousData,
  });

  return (
    <div>
      <p className="eyebrow" style={{ marginBottom: "var(--space-1)" }}>Fulfilment</p>
      <h1 style={{ fontSize: "var(--text-2xl)", margin: "0 0 var(--space-6)" }}>Orders</h1>

      <div style={{ display: "flex", gap: "var(--space-3)", marginBottom: "var(--space-6)", flexWrap: "wrap" }}>
        <input
          className="mb-input"
          placeholder="Search reference, name or email…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={{ width: 340 }}
        />
        <select
          className="mb-select"
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
        >
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((s) => <option key={s} value={s}>{ORDER_STATUS_LABEL[s]}</option>)}
        </select>
      </div>

      {isLoading ? (
        <p style={{ color: "var(--color-muted)" }}>Loading…</p>
      ) : data && data.items.length === 0 ? (
        <p style={{ color: "var(--color-muted)" }}>No orders match your filters.</p>
      ) : (
        <div className="mb-panel" style={{ padding: 0, overflow: "hidden" }}>
          <table className="mb-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Items</th>
                <th style={{ textAlign: "right" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {data?.items.map((o) => (
                <tr key={o.id}>
                  <td><Link to={`/admin/orders/${o.id}`} style={{ fontWeight: 600 }}>{o.publicReference}</Link></td>
                  <td style={{ color: "var(--color-muted)" }}>{new Date(o.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div>{o.customerName || "—"}</div>
                    <div style={{ color: "var(--color-muted)", fontSize: "var(--text-xs)" }}>{o.email}</div>
                  </td>
                  <td><OrderStatusBadge status={o.status} /></td>
                  <td>{o.itemCount}</td>
                  <td style={{ textAlign: "right", fontWeight: 600 }}>{formatMoney(o.grandTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && data.totalPages > 1 && (
        <div style={{ display: "flex", gap: "var(--space-4)", marginTop: "var(--space-6)", alignItems: "center" }}>
          <button className="mb-btn mb-btn--ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
          <span className="eyebrow">Page {data.page} / {data.totalPages}</span>
          <button className="mb-btn mb-btn--ghost" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      )}
    </div>
  );
}
