import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { getDashboardMetrics } from "../../features/admin/dashboardApi";
import { formatMoney } from "../../lib/format";
import { OrderStatusBadge } from "../../components/OrderStatusBadge";

const ic = (path: ReactNode) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{path}</svg>
);

export function DashboardPage() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: getDashboardMetrics,
    staleTime: 30_000,
  });

  if (isLoading) return <p style={{ color: "var(--color-muted)" }}>Loading…</p>;
  if (!metrics) return null;

  const series = metrics.salesTimeSeries;
  const maxRevenue = Math.max(...series.map((d) => d.revenue), 1);

  // Derived metrics from available data (no fabricated numbers).
  const revenue30 = series.reduce((sum, d) => sum + d.revenue, 0);
  const orders30 = series.reduce((sum, d) => sum + d.orders, 0);
  const avgOrderValue = metrics.totalOrders > 0 ? metrics.totalRevenue / metrics.totalOrders : 0;
  const peak = series.reduce((best, d) => (d.revenue > best.revenue ? d : best), series[0] ?? { date: "—", revenue: 0, orders: 0 });

  return (
    <div>
      <div className="mb-section-head" style={{ marginBottom: "var(--space-6)" }}>
        <div>
          <p className="eyebrow" style={{ marginBottom: "var(--space-1)" }}>Overview</p>
          <h1 style={{ fontSize: "var(--text-2xl)" }}>Dashboard</h1>
        </div>
        <Link to="/admin/orders" className="mb-btn" style={{ padding: "var(--space-2) var(--space-6)" }}>
          View all orders
        </Link>
      </div>

      {/* Primary stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "var(--space-4)", marginBottom: "var(--space-4)" }}>
        <Stat accent icon={ic(<><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></>)}
          label="Total revenue" value={formatMoney(metrics.totalRevenue)} sub={`${formatMoney(revenue30)} in last 30 days`} />
        <Stat icon={ic(<><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><path d="M3 6h18M16 10a4 4 0 0 1-8 0" /></>)}
          label="Total orders" value={String(metrics.totalOrders)} sub={`${orders30} in last 30 days`} />
        <Stat icon={ic(<><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" /><path d="M4 6v12c0 1.1.9 2 2 2h14v-4" /><path d="M18 12a2 2 0 0 0 0 4h4v-4z" /></>)}
          label="Avg. order value" value={formatMoney(avgOrderValue)} sub="Across all paid orders" />
        <Stat icon={ic(<><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>)}
          label="Peak day" value={formatMoney(peak.revenue)} sub={peak.date} />
      </div>

      {/* Attention cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "var(--space-4)", marginBottom: "var(--space-8)" }}>
        <Stat accent={metrics.awaitingProcessing > 0}
          icon={ic(<><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></>)}
          label="Awaiting processing" value={String(metrics.awaitingProcessing)} sub={metrics.awaitingProcessing > 0 ? "Needs your attention" : "All caught up"} />
        <Stat accent={metrics.lowStockVariants > 0}
          icon={ic(<><path d="M12 9v4M12 17h.01" /><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /></>)}
          label="Low stock variants" value={String(metrics.lowStockVariants)} sub={metrics.lowStockVariants > 0 ? "Restock soon" : "Inventory healthy"} />
      </div>

      {/* Revenue chart */}
      <div className="mb-panel" style={{ marginBottom: "var(--space-8)" }}>
        <div className="mb-section-head" style={{ marginBottom: "var(--space-6)" }}>
          <h2 style={{ fontSize: "var(--text-lg)" }}>Revenue — last 30 days</h2>
          <span className="eyebrow">{formatMoney(revenue30)} total</span>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 160 }}>
          {series.map((d) => {
            const pct = maxRevenue > 0 ? (d.revenue / maxRevenue) * 100 : 0;
            return (
              <div
                key={d.date}
                className={`mb-bar ${d.revenue > 0 ? "mb-bar--filled" : ""}`}
                title={`${d.date}\n${formatMoney(d.revenue)} · ${d.orders} order${d.orders !== 1 ? "s" : ""}`}
                style={{ height: `${Math.max(pct, d.revenue > 0 ? 3 : 1)}%` }}
              />
            );
          })}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", color: "var(--color-muted)", fontSize: "var(--text-xs)", marginTop: "var(--space-2)" }}>
          <span>{series[0]?.date}</span>
          <span>{series[series.length - 1]?.date}</span>
        </div>
      </div>

      {/* Quick actions */}
      <h2 style={{ fontSize: "var(--text-lg)", marginBottom: "var(--space-3)" }}>Quick actions</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "var(--space-3)", marginBottom: "var(--space-8)" }}>
        <Link to="/admin/products/new" className="mb-quick">
          {ic(<><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>)} Add product
        </Link>
        <Link to="/admin/orders" className="mb-quick">
          {ic(<><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><path d="M3 6h18" /></>)} Manage orders
        </Link>
        <Link to="/admin/discounts" className="mb-quick">
          {ic(<><path d="M9 9h.01M15 15h.01M21 11.5V6a2 2 0 0 0-2-2h-5.5L4 13.5a2 2 0 0 0 0 2.83l3.67 3.67a2 2 0 0 0 2.83 0L21 11.5z" /></>)} Create discount
        </Link>
        <Link to="/admin/store-config" className="mb-quick">
          {ic(<><circle cx="12" cy="12" r="3" /><path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6" /></>)} Store settings
        </Link>
      </div>

      {/* Recent orders */}
      <div className="mb-panel">
        <div className="mb-section-head" style={{ marginBottom: "var(--space-4)" }}>
          <h2 style={{ fontSize: "var(--text-lg)" }}>Recent orders</h2>
          <Link to="/admin/orders" className="eyebrow mb-nav-link" style={{ color: "var(--color-text)" }}>View all →</Link>
        </div>
        {metrics.recentOrders.length === 0 ? (
          <p style={{ color: "var(--color-muted)" }}>No orders yet.</p>
        ) : (
          <table className="mb-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Customer</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {metrics.recentOrders.map((o) => (
                <tr key={o.id}>
                  <td><Link to={`/admin/orders/${o.id}`} style={{ fontWeight: 600 }}>{o.publicReference}</Link></td>
                  <td style={{ color: "var(--color-muted)" }}>{o.customerName || "—"}</td>
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

function Stat({ label, value, sub, icon, accent = false }: { label: string; value: string; sub?: string; icon: ReactNode; accent?: boolean }) {
  return (
    <div className={`mb-stat ${accent ? "mb-stat--accent" : ""}`}>
      <span className="mb-stat__icon">{icon}</span>
      <div className="mb-stat__label">{label}</div>
      <div className="mb-stat__value">{value}</div>
      {sub && <div className="mb-stat__sub">{sub}</div>}
    </div>
  );
}
