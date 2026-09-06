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
      <h1 style={{ fontSize: "var(--text-2xl)", margin: "0 0 var(--space-6)" }}>Orders</h1>

      <div style={{ display: "flex", gap: "var(--space-3)", marginBottom: "var(--space-6)", flexWrap: "wrap" }}>
        <input
          placeholder="Search reference, name or email…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={{ padding: "var(--space-2) var(--space-3)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", width: 320 }}
        />
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          style={{ padding: "var(--space-2) var(--space-3)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)" }}
        >
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((s) => <option key={s} value={s}>{ORDER_STATUS_LABEL[s]}</option>)}
        </select>
      </div>

      {isLoading ? (
        <p>Loading…</p>
      ) : data && data.items.length === 0 ? (
        <p style={{ color: "var(--color-muted)" }}>No orders match your filters.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid var(--color-border)", color: "var(--color-muted)", fontSize: "var(--text-sm)" }}>
              <th style={th}>Reference</th>
              <th style={th}>Date</th>
              <th style={th}>Customer</th>
              <th style={th}>Status</th>
              <th style={th}>Items</th>
              <th style={{ ...th, textAlign: "right" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((o) => (
              <tr key={o.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                <td style={td}><Link to={`/admin/orders/${o.id}`} style={{ fontWeight: 600 }}>{o.publicReference}</Link></td>
                <td style={{ ...td, color: "var(--color-muted)", fontSize: "var(--text-sm)" }}>{new Date(o.createdAt).toLocaleDateString()}</td>
                <td style={td}>
                  <div>{o.customerName || "—"}</div>
                  <div style={{ color: "var(--color-muted)", fontSize: "var(--text-sm)" }}>{o.email}</div>
                </td>
                <td style={td}><OrderStatusBadge status={o.status} /></td>
                <td style={td}>{o.itemCount}</td>
                <td style={{ ...td, textAlign: "right" }}>{formatMoney(o.grandTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {data && data.totalPages > 1 && (
        <div style={{ display: "flex", gap: "var(--space-4)", marginTop: "var(--space-6)", alignItems: "center" }}>
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} style={pageBtn}>Previous</button>
          <span style={{ color: "var(--color-muted)" }}>Page {data.page} of {data.totalPages}</span>
          <button disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)} style={pageBtn}>Next</button>
        </div>
      )}
    </div>
  );
}

const th = { padding: "var(--space-2)" } as const;
const td = { padding: "var(--space-2)", verticalAlign: "middle" } as const;
const pageBtn = { padding: "var(--space-2) var(--space-4)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", background: "var(--color-bg)", cursor: "pointer" } as const;
