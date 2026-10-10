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
      <p className="eyebrow" style={{ marginBottom: "var(--space-1)" }}>People</p>
      <h1 style={{ fontSize: "var(--text-2xl)", margin: "0 0 var(--space-6)" }}>Customers</h1>

      <input
        className="mb-input"
        placeholder="Search name or email…"
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        style={{ marginBottom: "var(--space-6)", width: 340 }}
      />

      {isLoading ? <p style={{ color: "var(--color-muted)" }}>Loading…</p> : data?.items.length === 0 ? <p style={{ color: "var(--color-muted)" }}>No customers yet.</p> : (
        <div className="mb-panel" style={{ padding: 0, overflow: "hidden" }}>
          <table className="mb-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Orders</th>
                <th style={{ textAlign: "right" }}>Total spent</th>
                <th>Last order</th>
              </tr>
            </thead>
            <tbody>
              {data?.items.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link to={`/admin/customers/${c.id}`} style={{ fontWeight: 600 }}>{c.fullName || "—"}</Link>
                    <div style={{ color: "var(--color-muted)", fontSize: "var(--text-xs)" }}>{c.email}</div>
                  </td>
                  <td>{c.totalOrders}</td>
                  <td style={{ textAlign: "right", fontWeight: 600 }}>{formatMoney(c.totalSpent)}</td>
                  <td style={{ color: "var(--color-muted)" }}>
                    {c.lastOrderAt ? new Date(c.lastOrderAt).toLocaleDateString() : "—"}
                  </td>
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

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: customer, isLoading } = useQuery({
    queryKey: ["admin-customer", id],
    queryFn: () => getAdminCustomer(id!),
    enabled: !!id,
  });

  if (isLoading) return <p style={{ color: "var(--color-muted)" }}>Loading…</p>;
  if (!customer) return <p>Customer not found. <Link to="/admin/customers">Back</Link></p>;

  return (
    <div>
      <Link to="/admin/customers" className="eyebrow mb-nav-link" style={{ color: "var(--color-muted)" }}>← Customers</Link>
      <h1 style={{ fontSize: "var(--text-2xl)", margin: "var(--space-3) 0 var(--space-2)" }}>
        {[customer.firstName, customer.lastName].filter(Boolean).join(" ") || customer.email}
      </h1>
      <p style={{ color: "var(--color-muted)", marginBottom: "var(--space-6)" }}>
        {customer.email}{customer.phone ? ` · ${customer.phone}` : ""}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "var(--space-4)", marginBottom: "var(--space-8)" }}>
        <MetricCard label="Total orders" value={String(customer.totalOrders)} />
        <MetricCard label="Total spent" value={formatMoney(customer.totalSpent)} />
        <MetricCard label="Last order" value={customer.lastOrderAt ? new Date(customer.lastOrderAt).toLocaleDateString() : "—"} />
      </div>

      <div className="mb-panel">
        <h2 style={{ fontSize: "var(--text-lg)", marginBottom: "var(--space-4)" }}>Recent orders</h2>
        {customer.recentOrders.length === 0 ? (
          <p style={{ color: "var(--color-muted)" }}>No orders yet.</p>
        ) : (
          <table className="mb-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Date</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {customer.recentOrders.map((o) => (
                <tr key={o.orderId}>
                  <td><Link to={`/admin/orders/${o.orderId}`} style={{ fontWeight: 600 }}>{o.publicReference}</Link></td>
                  <td style={{ color: "var(--color-muted)" }}>{new Date(o.createdAt).toLocaleDateString()}</td>
                  <td><OrderStatusBadge status={o.status} /></td>
                  <td style={{ textAlign: "right", fontWeight: 600 }}>{formatMoney(o.grandTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-stat">
      <div className="mb-stat__label">{label}</div>
      <div className="mb-stat__value">{value}</div>
    </div>
  );
}
