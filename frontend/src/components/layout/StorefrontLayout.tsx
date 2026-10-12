import { Link, Outlet, useLocation } from "react-router-dom";
import { useCart } from "../../features/cart/CartContext";
import { MbLogo } from "../MbLogo";
import { AnnouncementBar } from "../AnnouncementBar";

const NAV = [
  { to: "/shop", label: "Shop" },
  { to: "/track", label: "Track" },
];

/** Public storefront shell: announcement bar, header, page outlet, footer. */
export function StorefrontLayout() {
  const { itemCount } = useCart();
  const { pathname } = useLocation();

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <AnnouncementBar />

      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          borderBottom: "1px solid var(--color-border)",
          background: "color-mix(in srgb, var(--color-bg) 85%, transparent)",
          backdropFilter: "saturate(140%) blur(12px)",
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
          <nav
            className="mb-nav-compact"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-8)",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              fontSize: "var(--text-xs)",
              fontWeight: 600,
            }}
          >
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="mb-nav-link"
                data-active={pathname.startsWith(item.to)}
              >
                {item.label}
              </Link>
            ))}
            <Link to="/cart" className="mb-cart mb-nav-link" data-active={pathname.startsWith("/cart")}>
              Cart
              {itemCount > 0 && <span className="mb-cart__count">{itemCount}</span>}
            </Link>
          </nav>
        </div>
      </header>

      <main style={{ flex: 1 }}>
        <Outlet />
      </main>

      {/* Newsletter band */}
      <section style={{ background: "var(--color-secondary)", color: "var(--color-accent)" }}>
        <div
          className="container"
          style={{
            padding: "var(--space-16) 0",
            display: "flex",
            flexWrap: "wrap",
            gap: "var(--space-8)",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ maxWidth: 420 }}>
            <p className="eyebrow" style={{ color: "var(--color-accent)", opacity: 0.6 }}>
              Stay in the loop
            </p>
            <h2 style={{ fontSize: "var(--text-2xl)", textTransform: "uppercase", marginTop: "var(--space-3)" }}>
              Join the movement
            </h2>
            <p style={{ opacity: 0.75, marginTop: "var(--space-3)" }}>
              Early access to drops, members-only offers, and training tips — straight to your inbox.
            </p>
          </div>
          <form
            onSubmit={(e) => e.preventDefault()}
            style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3)", flex: "1 1 320px", maxWidth: 480 }}
          >
            <input className="mb-newsletter-input" type="email" placeholder="Enter your email" required />
            <button
              type="submit"
              className="mb-btn"
              style={{ background: "var(--color-accent)", color: "var(--color-primary)", borderColor: "var(--color-accent)" }}
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>

      <footer style={{ background: "var(--color-primary)", color: "var(--color-accent)", padding: "var(--space-16) 0 var(--space-8)" }}>
        <div className="container">
          <div className="mb-footer-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "var(--space-8)", alignItems: "start" }}>
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
