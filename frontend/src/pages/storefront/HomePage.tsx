import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  fetchCategories,
  fetchProducts,
} from "../../features/catalog/api";
import { fetchStoreSettings } from "../../features/storeConfig/api";
import { ProductCard } from "../../components/ProductCard";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1920&q=80";

const CATEGORY_IMAGES: Record<string, string> = {
  men: "https://images.unsplash.com/photo-1483721310020-03333e577078?auto=format&fit=crop&w=800&q=80",
  women: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80",
  accessories: "https://images.unsplash.com/photo-1549060279-7e168fcee0c2?auto=format&fit=crop&w=800&q=80",
};

export function HomePage() {
  const { data: settings } = useQuery({ queryKey: ["store-settings"], queryFn: fetchStoreSettings });
  const { data: newArrivals } = useQuery({
    queryKey: ["products", "home-new"],
    queryFn: () => fetchProducts({ pageSize: 4, sort: "Newest" }),
  });
  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });
  const brand = settings?.brandName ?? "MB";

  return (
    <>
      {/* Hero with athletic imagery + dark overlay for legibility */}
      <section
        style={{
          position: "relative",
          minHeight: "70vh",
          display: "flex",
          alignItems: "center",
          background: "var(--color-primary)",
          color: "var(--color-accent)",
          overflow: "hidden",
        }}
      >
        <img
          src={HERO_IMAGE}
          alt=""
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.55 }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(90deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.35) 60%, rgba(0,0,0,0.1) 100%)",
          }}
        />
        <div className="container mb-rise" style={{ position: "relative", padding: "var(--space-16) 0" }}>
          <p className="eyebrow" style={{ color: "var(--color-accent)", opacity: 0.85 }}>
            {brand} — Premium Activewear
          </p>
          <h1 style={{ fontSize: "var(--text-3xl)", margin: "var(--space-6) 0", maxWidth: 900, textTransform: "uppercase" }}>
            Engineered for<br />performance.
          </h1>
          <p style={{ maxWidth: 460, opacity: 0.85, marginBottom: "var(--space-8)" }}>
            Second-skin fits and technical fabrics built for the gym and the street.
          </p>
          <Link to="/shop" className="mb-btn" style={{ background: "var(--color-accent)", color: "var(--color-primary)", borderColor: "var(--color-accent)" }}>
            Shop the collection
          </Link>
        </div>
      </section>

      {/* Shop by category */}
      {categories && categories.length > 0 && (
        <section className="container" style={{ padding: "var(--space-16) 0 var(--space-8)" }}>
          <p className="eyebrow" style={{ marginBottom: "var(--space-2)" }}>Collections</p>
          <h2 style={{ fontSize: "var(--text-2xl)", marginBottom: "var(--space-8)", textTransform: "uppercase" }}>Shop by Category</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "var(--space-6)" }}>
            {categories.map((c) => (
              <Link key={c.id} to={`/shop?category=${c.slug}`} style={{ position: "relative", display: "block", aspectRatio: "3 / 2", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
                <img
                  src={CATEGORY_IMAGES[c.slug] ?? HERO_IMAGE}
                  alt={c.name}
                  loading="lazy"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)" }} />
                <span style={{ position: "absolute", left: "var(--space-4)", bottom: "var(--space-4)", color: "#fff", fontWeight: 700, fontSize: "var(--text-xl)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {c.name}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* New arrivals — real product grid */}
      <section className="container" style={{ padding: "var(--space-8) 0 var(--space-16)" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "var(--space-8)" }}>
          <div>
            <p className="eyebrow" style={{ marginBottom: "var(--space-2)" }}>Just dropped</p>
            <h2 style={{ fontSize: "var(--text-2xl)", textTransform: "uppercase" }}>New Arrivals</h2>
          </div>
          <Link to="/shop" className="eyebrow" style={{ color: "var(--color-text)" }}>View all →</Link>
        </div>
        {newArrivals && newArrivals.items.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "var(--space-8)" }}>
            {newArrivals.items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <p style={{ color: "var(--color-muted)" }}>Products are on their way.</p>
        )}
      </section>

      {/* Dark brand-story band with imagery */}
      <section style={{ position: "relative", background: "var(--color-primary)", color: "var(--color-accent)", overflow: "hidden" }}>
        <img src="https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=1920&q=80"
          alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.3 }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(0,0,0,0.8), rgba(0,0,0,0.4))" }} />
        <div className="container" style={{ position: "relative", padding: "var(--space-16) 0", maxWidth: 720 }}>
          <p className="eyebrow" style={{ color: "var(--color-accent)", opacity: 0.8 }}>Our story</p>
          <h2 style={{ fontSize: "var(--text-2xl)", textTransform: "uppercase", margin: "var(--space-4) 0" }}>
            Built by athletes,<br />for everyday performance.
          </h2>
          <p style={{ opacity: 0.85, maxWidth: 520 }}>
            Every piece is tested in the gym and refined for the street — technical
            fabrics, considered fits, and a minimalist aesthetic that lasts.
          </p>
          <Link to="/shop" className="mb-btn" style={{ marginTop: "var(--space-6)", background: "var(--color-accent)", color: "var(--color-primary)", borderColor: "var(--color-accent)" }}>
            Explore the range
          </Link>
        </div>
      </section>

      {/* Promo strip (solid dark) */}
      <section style={{ background: "var(--color-secondary)", color: "var(--color-accent)" }}>
        <div className="container" style={{ padding: "var(--space-8) 0", display: "flex", flexWrap: "wrap", gap: "var(--space-8)", justifyContent: "space-around", textAlign: "center" }}>
          <div><div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "var(--text-xl)" }}>Free shipping</div><div className="eyebrow" style={{ color: "var(--color-accent)", opacity: 0.6 }}>On orders over ₦100k</div></div>
          <div><div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "var(--text-xl)" }}>Secure checkout</div><div className="eyebrow" style={{ color: "var(--color-accent)", opacity: 0.6 }}>Paystack protected</div></div>
          <div><div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "var(--text-xl)" }}>Guest friendly</div><div className="eyebrow" style={{ color: "var(--color-accent)", opacity: 0.6 }}>No account required</div></div>
        </div>
      </section>
    </>
  );
}
