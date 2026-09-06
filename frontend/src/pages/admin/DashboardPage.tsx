import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getDashboardMetrics } from "../../features/admin/dashboardApi";
import { formatMoney } from "../../lib/format";
import { OrderStatusBadge } from "../../components/OrderStatusBadge";

export function DashboardPage() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: getDashboardMetrics,
    staleTime: 30_000,
  });

  if (isLoading) return <p>Loading…</p>;
  if (!metrics) return null;

  const maxRevenue = Math.max(...metrics.salesTimeSeries.map((d) => d.revenue), 1);

  return (
    <div>
      <h1 style={{ fontSize: "var(--text-2xl)", margin: "0 0 var(--space-6)" }}>Dashboard</h1>

      {/* Metric cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--space-4)", marginBottom: "var(--space-8)" }}>
        <MetricCard label="Total revenue" value={formatMoney(metrics.totalRevenue)} />
        <MetricCard label="Total orders" value={String(metrics.totalOrders)} />
        <MetricCard label="Awaiting processing" value={String(metrics.awaitingProcessing)} accent={metrics.awaitingProcessing > 0} />
        <MetricCard label="Low stock variants" value={String(metrics.lowStockVariants)} accent={metrics.lowStockVariants > 0} />
      </div>

      {/* Revenue bar chart (pure CSS, no library) */}
      <div style={{ background: "var(--color-surface)", borderRadius: "var(--radius-md)", padding: "var(--space-6)", marginBottom: "var(--space-8)" }}>
        <h2 style={{ fontSize: "var(--text-lg)", margin: "0 0 var(--space-4)" }}>Revenue — last 30 days</h2>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 120 }}>
          {metrics.salesTimeSeries.map((d) => {
            const pct = maxRevenue > 0 ? (d.revenue / maxRevenue) * 100 : 0;
            return (
              <div
                key={d.date}
                title={`${d.date}\n${formatMoney(d.revenue)} · ${d.orders} order${d.orders !== 1 ? "s" : ""}`}
                style={{
                  flex: 1,
                  height: `${Math.max(pct, d.revenue > 0 ? 2 : 0)}%`,
                  background: d.revenue > 0 ? "var(--color-primary)" : "var(--color-border)",
                  borderRadius: "2px 2px 0 0",
                  minHeight: d.revenue > 0 ? 4 : 1,
                }}
              />
            );
          })}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", color: "var(--color-muted)", fontSize: "var(--text-xs)", marginTop: "var(--space-1)" }}>
          <span>{metrics.salesTimeSeries[0]?.date}</span>
          <span>{metrics.salesTimeSeries[metrics.salesTimeSeries.length - 1]?.date}</span>
        </div>
      </div>

      {/* Recent orders */}
      <h2 style={{ fontSize: "var(--text-lg)", marginBottom: "var(--space-3)" }}>Recent orders</h2>
      {metrics.recentOrders.length === 0 ? (
        <p style={{ color: "var(--color-muted)" }}>No orders yet.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid var(--color-border)", color: "var(--color-muted)", fontSize: "var(--text-sm)" }}>
              <th style={th}>Reference</th>
              <th style={th}>Customer</th>
              <th style={th}>Status</th>
              <th style={{ ...th, textAlign: "right" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {metrics.recentOrders.map((o) => (
              <tr key={o.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                <td style={td}><Link to={`/admin/orders/${o.id}`} style={{ fontWeight: 600 }}>{o.publicReference}</Link></td>
                <td style={{ ...td, color: "var(--color-muted)" }}>{o.customerName || "—"}</td>
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

function MetricCard({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{ background: "var(--color-surface)", borderRadius: "var(--radius-md)", padding: "var(--space-4)" }}>
      <div style={{ color: "var(--color-muted)", fontSize: "var(--text-sm)", marginBottom: "var(--space-1)" }}>{label}</div>
      <div style={{ fontSize: "var(--text-xl)", fontWeight: 700, color: accent ? "var(--color-primary)" : "inherit" }}>{value}</div>
    </div>
  );
}

const th = { padding: "var(--space-2)" } as const;
const td = { padding: "var(--space-2)", verticalAlign: "middle" } as const;
