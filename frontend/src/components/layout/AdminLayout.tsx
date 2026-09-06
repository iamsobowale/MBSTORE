import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";
import { MbLogo } from "../MbLogo";

const navItems = [
  { to: "/admin", label: "Dashboard", exact: true },
  { to: "/admin/products", label: "Products" },
  { to: "/admin/categories", label: "Categories" },
  { to: "/admin/orders", label: "Orders" },
  { to: "/admin/customers", label: "Customers" },
  { to: "/admin/discounts", label: "Discounts" },
  { to: "/admin/store-config", label: "Store Config" },
];

/** Admin shell: sidebar nav + content outlet. Operational, clean, not a generic template. */
export function AdminLayout() {
  const { email, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <aside style={{ width: 240, borderRight: "1px solid var(--color-border)", padding: "var(--space-6)", background: "var(--color-surface)", display: "flex", flexDirection: "column" }}>
        <div style={{ marginBottom: "var(--space-8)" }}>
          <MbLogo size="sm" />
          <div style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)", marginTop: 4, letterSpacing: "0.08em", textTransform: "uppercase" }}>Admin</div>
        </div>
        <nav style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)", flex: 1 }}>
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              style={{
                padding: "var(--space-2) var(--space-3)",
                borderRadius: "var(--radius-sm)",
                background: isActive(item.to, item.exact) ? "var(--color-primary)" : "transparent",
                color: isActive(item.to, item.exact) ? "var(--color-accent)" : "var(--color-text)",
                fontWeight: isActive(item.to, item.exact) ? 600 : 400,
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "var(--space-4)", fontSize: "var(--text-sm)" }}>
          <div style={{ color: "var(--color-muted)", marginBottom: "var(--space-2)", wordBreak: "break-all" }}>{email}</div>
          <button onClick={() => { logout(); navigate("/admin/login"); }}
            style={{ background: "none", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", padding: "var(--space-1) var(--space-3)", cursor: "pointer", width: "100%" }}>
            Sign out
          </button>
        </div>
      </aside>
      <main style={{ flex: 1, padding: "var(--space-8)" }}>
        <Outlet />
      </main>
    </div>
  );
}
