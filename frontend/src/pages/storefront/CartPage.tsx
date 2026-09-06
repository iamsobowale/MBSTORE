import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../../features/cart/CartContext";
import { formatMoney } from "../../lib/format";

export function CartPage() {
  const { cart, updateItem, removeItem } = useCart();
  const navigate = useNavigate();

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container" style={{ padding: "var(--space-16) 0", textAlign: "center" }}>
        <h1 style={{ fontSize: "var(--text-2xl)" }}>Your cart is empty</h1>
        <Link to="/shop" style={{ ...primaryBtn, display: "inline-block", marginTop: "var(--space-4)" }}>Continue shopping</Link>
      </div>
    );
  }

  const hasIssues = cart.items.some((i) => !i.available);

  return (
    <div className="container" style={{ padding: "var(--space-12) 0", display: "grid", gridTemplateColumns: "minmax(0, 2fr) minmax(280px, 1fr)", gap: "var(--space-12)" }}>
      <div>
        <h1 style={{ fontSize: "var(--text-2xl)", marginTop: 0 }}>Cart</h1>
        {cart.items.map((item) => (
          <div key={item.productVariantId} style={{ display: "flex", gap: "var(--space-4)", padding: "var(--space-4) 0", borderBottom: "1px solid var(--color-border)" }}>
            <div style={{ width: 80, height: 100, background: "var(--color-surface)", borderRadius: "var(--radius-sm)", overflow: "hidden", flexShrink: 0 }}>
              {item.imageUrl && <img src={item.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
            </div>
            <div style={{ flex: 1 }}>
              <Link to={`/product/${item.slug}`} style={{ fontWeight: 600 }}>{item.productName}</Link>
              <div style={{ color: "var(--color-muted)", fontSize: "var(--text-sm)" }}>{item.color} · {item.size}</div>
              <div style={{ marginTop: "var(--space-2)" }}>{formatMoney(item.unitPrice)}</div>
              {item.issue && <div style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", marginTop: 4 }}>{item.issue}</div>}
              <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "center", marginTop: "var(--space-3)" }}>
                <input
                  type="number" min={1} max={item.availableQuantity || 1} value={item.quantity}
                  onChange={(e) => updateItem(item.productVariantId, Math.max(1, Number(e.target.value)))}
                  style={{ width: 64, padding: "var(--space-1) var(--space-2)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)" }}
                />
                <button onClick={() => removeItem(item.productVariantId)} style={{ background: "none", border: "none", color: "var(--color-danger)", cursor: "pointer" }}>Remove</button>
              </div>
            </div>
            <div style={{ fontWeight: 600 }}>{formatMoney(item.lineTotal)}</div>
          </div>
        ))}
      </div>

      <aside style={{ alignSelf: "start", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "var(--space-6)" }}>
        <h2 style={{ fontSize: "var(--text-lg)", marginTop: 0 }}>Summary</h2>
        <Row label="Subtotal" value={formatMoney(cart.subtotal)} />
        <p style={{ color: "var(--color-muted)", fontSize: "var(--text-sm)" }}>Shipping & discounts calculated at checkout.</p>
        {hasIssues && <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)" }}>Resolve the flagged items before checking out.</p>}
        <button disabled={hasIssues} onClick={() => navigate("/checkout")} style={{ ...primaryBtn, width: "100%", opacity: hasIssues ? 0.5 : 1 }}>
          Checkout
        </button>
        <Link to="/shop" style={{ display: "block", textAlign: "center", marginTop: "var(--space-3)", color: "var(--color-muted)" }}>Continue shopping</Link>
      </aside>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-2)" }}>
      <span style={{ color: "var(--color-muted)" }}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

const primaryBtn = { padding: "var(--space-3) var(--space-8)", background: "var(--color-primary)", color: "var(--color-accent)", border: "none", borderRadius: "var(--radius-sm)", fontWeight: 700, cursor: "pointer", marginTop: "var(--space-4)" } as const;
