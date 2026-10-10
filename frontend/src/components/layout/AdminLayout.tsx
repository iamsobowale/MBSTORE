import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../../features/auth/AuthContext";
import { MbLogo } from "../MbLogo";

// Minimal line icons (inherit currentColor)
const icon = (path: ReactNode) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {path}
  </svg>
);

const ICONS: Record<string, ReactNode> = {
  dashboard: icon(<><rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" /></>),
  products: icon(<><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><path d="m3.3 7 8.7 5 8.7-5M12 22V12" /></>),
  categories: icon(<><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>),
  orders: icon(<><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><path d="M3 6h18M16 10a4 4 0 0 1-8 0" /></>),
  customers: icon(<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>),
  discounts: icon(<><path d="M9 9h.01M15 15h.01M21 11.5V6a2 2 0 0 0-2-2h-5.5L4 13.5a2 2 0 0 0 0 2.83l3.67 3.67a2 2 0 0 0 2.83 0L21 11.5z" /></>),
  config: icon(<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></>),
  store: icon(<><path d="M3 9l1-5h16l1 5M4 9v11a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9M3 9h18" /></>),
};

const navItems = [
  { to: "/admin", label: "Dashboard", icon: "dashboard", exact: true },
  { to: "/admin/products", label: "Products", icon: "products" },
  { to: "/admin/categories", label: "Categories", icon: "categories" },
  { to: "/admin/orders", label: "Orders", icon: "orders" },
  { to: "/admin/customers", label: "Customers", icon: "customers" },
  { to: "/admin/discounts", label: "Discounts", icon: "discounts" },
  { to: "/admin/store-config", label: "Store Config", icon: "config" },
];

/** Admin shell: sidebar nav + content outlet. Operational, clean, not a generic template. */
export function AdminLayout() {
  const { email, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--color-surface)" }}>
      <aside
        style={{
          width: 248,
          borderRight: "1px solid var(--color-border)",
          padding: "var(--space-6)",
          background: "var(--color-bg)",
          display: "flex",
          flexDirection: "column",
          position: "sticky",
          top: 0,
          height: "100vh",
        }}
      >
        <div style={{ marginBottom: "var(--space-8)" }}>
          <MbLogo size="sm" />
          <div style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)", marginTop: 4, letterSpacing: "0.14em", textTransform: "uppercase" }}>
            Admin Console
          </div>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)", flex: 1 }}>
          {navItems.map((item) => (
            <Link key={item.to} to={item.to} className="mb-admin-nav" data-active={isActive(item.to, item.exact)}>
              {ICONS[item.icon]}
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          to="/"
          className="mb-admin-nav"
          style={{ color: "var(--color-muted)", marginBottom: "var(--space-2)" }}
        >
          {icon(<><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" /></>)}
          View storefront
        </Link>

        <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "var(--space-4)", fontSize: "var(--text-sm)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-3)" }}>
            <div
              style={{
                width: 32, height: 32, borderRadius: "var(--radius-pill)", flexShrink: 0,
                background: "var(--color-primary)", color: "var(--color-accent)",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                fontWeight: 700, fontSize: 13,
              }}
            >
              {(email ?? "A").charAt(0).toUpperCase()}
            </div>
            <div style={{ color: "var(--color-muted)", wordBreak: "break-all", fontSize: "var(--text-xs)" }}>{email}</div>
          </div>
          <button
            onClick={() => { logout(); navigate("/admin/login"); }}
            className="mb-btn mb-btn--ghost"
            style={{ width: "100%", padding: "var(--space-2)" }}
          >
            Sign out
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, padding: "var(--space-8)", maxWidth: "100%", overflow: "auto" }}>
        <Outlet />
      </main>
    </div>
  );
}
