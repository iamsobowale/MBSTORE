import { Link, Outlet } from "react-router-dom";
import { useCart } from "../../features/cart/CartContext";
import { MbLogo } from "../MbLogo";

/** Public storefront shell: header, page outlet, footer. Themed via CSS variables. */
export function StorefrontLayout() {
  const { itemCount } = useCart();
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          borderBottom: "1px solid var(--color-border)",
          background: "color-mix(in srgb, var(--color-bg) 88%, transparent)",
          backdropFilter: "saturate(140%) blur(10px)",
        }}
      >
        <div
          className="container"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: 76,
          }}
        >
          <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
            <MbLogo size="md" />
          </Link>
          <nav style={{ display: "flex", gap: "var(--space-8)", textTransform: "uppercase", letterSpacing: "0.12em", fontSize: "var(--text-xs)", fontWeight: 600 }}>
            <Link to="/shop">Shop</Link>
            <Link to="/track">Track</Link>
            <Link to="/cart">Cart{itemCount > 0 ? ` (${itemCount})` : ""}</Link>
          </nav>
        </div>
      </header>

      <main style={{ flex: 1 }}>
        <Outlet />
      </main>

      <footer style={{ background: "var(--color-primary)", color: "var(--color-accent)", padding: "var(--space-16) 0 var(--space-8)" }}>
        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "var(--space-8)", alignItems: "start" }}>
            <div>
              <MbLogo size="md" inverted />
              <p style={{ opacity: 0.6, maxWidth: 320, marginTop: "var(--space-3)" }}>
                Premium activewear engineered for performance and built for the street.
              </p>
            </div>
            <div>
              <p className="eyebrow" style={{ color: "var(--color-accent)", opacity: 0.6, marginBottom: "var(--space-3)" }}>Shop</p>
              <nav style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", opacity: 0.85 }}>
                <Link to="/shop">All products</Link>
                <Link to="/shop?category=men">Men</Link>
                <Link to="/shop?category=women">Women</Link>
                <Link to="/shop?category=accessories">Accessories</Link>
              </nav>
            </div>
            <div>
              <p className="eyebrow" style={{ color: "var(--color-accent)", opacity: 0.6, marginBottom: "var(--space-3)" }}>Support</p>
              <nav style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", opacity: 0.85 }}>
                <Link to="/track">Track order</Link>
                <Link to="/cart">Cart</Link>
              </nav>
            </div>
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.15)", marginTop: "var(--space-12)", paddingTop: "var(--space-6)", opacity: 0.5, fontSize: "var(--text-sm)" }}>
            © {new Date().getFullYear()} MB Fitness. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
