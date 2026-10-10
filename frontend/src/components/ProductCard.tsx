import { Link } from "react-router-dom";
import type { ProductListItem } from "../features/catalog/api";
import { formatMoney } from "../lib/format";

/** Clean product card: image, name, price, colors, out-of-stock state. */
export function ProductCard({ product }: { product: ProductListItem }) {
  const onSale = !!product.compareAtPrice && product.compareAtPrice > product.price;
  return (
    <Link to={`/product/${product.slug}`} className="mb-card">
      <div className="mb-card__media">
        {product.primaryImageUrl ? (
          <img src={product.primaryImageUrl} alt={product.name} loading="lazy" />
        ) : (
          <div style={{ width: "100%", height: "100%" }} />
        )}
        {onSale && (
          <span className="mb-badge" style={{ position: "absolute", top: "var(--space-3)", left: "var(--space-3)" }}>
            Sale
          </span>
        )}
        {!product.inStock && (
          <span
            className="mb-badge"
            style={{ position: "absolute", top: "var(--space-3)", right: "var(--space-3)", background: "var(--color-secondary)" }}
          >
            Sold out
          </span>
        )}
        {product.inStock && <span className="mb-card__peek">View product</span>}
      </div>

      <div style={{ marginTop: "var(--space-4)" }}>
        <div className="mb-card__name">{product.name}</div>
        <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "baseline", marginTop: 2 }}>
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <span style={{ color: "var(--color-muted)", textDecoration: "line-through", fontSize: "var(--text-sm)" }}>
              {formatMoney(product.compareAtPrice)}
            </span>
          )}
          <span style={{ fontWeight: 500 }}>{formatMoney(product.price)}</span>
        </div>
        {product.colors.length > 0 && (
          <div className="eyebrow" style={{ marginTop: "var(--space-2)" }}>
            {product.colors.length} color{product.colors.length > 1 ? "s" : ""}
          </div>
        )}
      </div>
    </Link>
  );
}
