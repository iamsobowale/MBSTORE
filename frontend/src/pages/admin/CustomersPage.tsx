import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getAdminCustomer, listAdminCustomers } from "../../features/admin/customersApi";
import { formatMoney } from "../../lib/format";
import { OrderStatusBadge } from "../../components/OrderStatusBadge";

export function CustomersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-customers", { search, page }],
    queryFn: () => listAdminCustomers({ search: search || undefined, page, pageSize: 20 }),
    placeholderData: keepPreviousData,
  });

  return (
    <div>
      <h1 style={{ fontSize: "var(--text-2xl)", margin: "0 0 var(--space-6)" }}>Customers</h1>

      <input
        placeholder="Search name or email…"
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        style={{ padding: "var(--space-2) var(--space-3)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", marginBottom: "var(--space-6)", width: 320 }}
      />

      {isLoading ? <p>Loading…</p> : data?.items.length === 0 ? <p style={{ color: "var(--color-muted)" }}>No customers yet.</p> : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid var(--color-border)", color: "var(--color-muted)", fontSize: "var(--text-sm)" }}>
              <th style={th}>Customer</th>
              <th style={th}>Orders</th>
              <th style={{ ...th, textAlign: "right" }}>Total spent</th>
              <th style={th}>Last order</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((c) => (
              <tr key={c.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                <td style={td}>
                  <Link to={`/admin/customers/${c.id}`} style={{ fontWeight: 600 }}>{c.fullName || "—"}</Link>
                  <div style={{ color: "var(--color-muted)", fontSize: "var(--text-sm)" }}>{c.email}</div>
                </td>
                <td style={td}>{c.totalOrders}</td>
                <td style={{ ...td, textAlign: "right" }}>{formatMoney(c.totalSpent)}</td>
                <td style={{ ...td, color: "var(--color-muted)", fontSize: "var(--text-sm)" }}>
                  {c.lastOrderAt ? new Date(c.lastOrderAt).toLocaleDateString() : "—"}
                </td>
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

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: customer, isLoading } = useQuery({
    queryKey: ["admin-customer", id],
    queryFn: () => getAdminCustomer(id!),
    enabled: !!id,
  });

  if (isLoading) return <p>Loading…</p>;
  if (!customer) return <p>Customer not found. <Link to="/admin/customers">Back</Link></p>;

  return (
    <div>
      <Link to="/admin/customers" style={{ color: "var(--color-muted)", fontSize: "var(--text-sm)" }}>← Customers</Link>
      <h1 style={{ fontSize: "var(--text-2xl)", margin: "var(--space-2) 0 var(--space-6)" }}>
        {[customer.firstName, customer.lastName].filter(Boolean).join(" ") || customer.email}
      </h1>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--space-4)", marginBottom: "var(--space-8)" }}>
        <MetricCard label="Total orders" value={String(customer.totalOrders)} />
        <MetricCard label="Total spent" value={formatMoney(customer.totalSpent)} />
        <MetricCard label="Last order" value={customer.lastOrderAt ? new Date(customer.lastOrderAt).toLocaleDateString() : "—"} />
      </div>

      <p style={{ color: "var(--color-muted)", marginBottom: "var(--space-6)" }}>
        {customer.email} · {customer.phone}
      </p>

      <h2 style={{ fontSize: "var(--text-lg)", marginBottom: "var(--space-3)" }}>Recent orders</h2>
      {customer.recentOrders.length === 0 ? (
        <p style={{ color: "var(--color-muted)" }}>No orders yet.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid var(--color-border)", color: "var(--color-muted)", fontSize: "var(--text-sm)" }}>
              <th style={th}>Reference</th>
              <th style={th}>Date</th>
              <th style={th}>Status</th>
              <th style={{ ...th, textAlign: "right" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {customer.recentOrders.map((o) => (
              <tr key={o.orderId} style={{ borderBottom: "1px solid var(--color-border)" }}>
                <td style={td}><Link to={`/admin/orders/${o.orderId}`} style={{ fontWeight: 600 }}>{o.publicReference}</Link></td>
                <td style={{ ...td, color: "var(--color-muted)", fontSize: "var(--text-sm)" }}>{new Date(o.createdAt).toLocaleDateString()}</td>
                <td style={td}><OrderStatusBadge status={o.status} /></td>
                <td style={{ ...td, textAlign: "right" }}>{formatMoney(o.grandTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: "var(--color-surface)", borderRadius: "var(--radius-md)", padding: "var(--space-4)" }}>
      <div style={{ color: "var(--color-muted)", fontSize: "var(--text-sm)", marginBottom: "var(--space-1)" }}>{label}</div>
      <div style={{ fontSize: "var(--text-xl)", fontWeight: 700 }}>{value}</div>
    </div>
  );
}

const th = { padding: "var(--space-2)" } as const;
const td = { padding: "var(--space-2)", verticalAlign: "middle" } as const;
const pageBtn = { padding: "var(--space-2) var(--space-4)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", background: "var(--color-bg)", cursor: "pointer" } as const;
