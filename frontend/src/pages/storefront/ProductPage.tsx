import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchProduct, type ProductVariant } from "../../features/catalog/api";
import { useCart } from "../../features/cart/CartContext";
import { formatMoney } from "../../lib/format";
import { SizeGuideModal } from "../../components/SizeGuide";
import { Placeholder } from "../Placeholder";

export function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { data: product, isLoading, isError } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => fetchProduct(slug!),
    enabled: !!slug,
    retry: false,
  });

  const [color, setColor] = useState<string | null>(null);
  const [size, setSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [adding, setAdding] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  // Sizes available for the currently selected color.
  const sizesForColor = useMemo<ProductVariant[]>(() => {
    if (!product || !color) return [];
    return product.variants.filter((v) => v.color === color);
  }, [product, color]);

  const selectedVariant = useMemo<ProductVariant | undefined>(() => {
    if (!product || !color || !size) return undefined;
    return product.variants.find((v) => v.color === color && v.size === size);
  }, [product, color, size]);

  // Measurements for the currently selected size (from the size guide).
  const sizeMeasurements = useMemo(() => {
    if (!product || !size) return [];
    return product.sizeGuide.filter((m) => m.size === size);
  }, [product, size]);

  if (isLoading) return <div className="container" style={{ padding: "var(--space-16) 0" }}>Loading…</div>;
  // Unpublished / removed products return 404 → graceful message.
  if (isError || !product) return <Placeholder title="Product not found" note="This product is unavailable." />;

  const canAdd = !!selectedVariant && selectedVariant.inStock && qty >= 1 && qty <= selectedVariant.availableQuantity;
  const price = selectedVariant?.price ?? product.basePrice;

  const handleAdd = async () => {
    if (!selectedVariant) return;
    setAdding(true);
    try {
      await addItem(selectedVariant.id, qty);
      navigate("/cart");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="container" style={{ padding: "var(--space-12) 0", display: "grid", gap: "var(--space-12)", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)" }}>
      {/* Gallery */}
      <div>
        <div style={{ aspectRatio: "4 / 5", background: "var(--color-surface)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
          {product.images[activeImage] && (
            <img src={product.images[activeImage].url} alt={product.images[activeImage].altText ?? product.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          )}
        </div>
        {product.images.length > 1 && (
          <div style={{ display: "flex", gap: "var(--space-2)", marginTop: "var(--space-3)" }}>
            {product.images.map((img, i) => (
              <button key={img.id} onClick={() => setActiveImage(i)}
                style={{ width: 64, height: 80, borderRadius: "var(--radius-sm)", overflow: "hidden", border: i === activeImage ? "2px solid var(--color-primary)" : "1px solid var(--color-border)", padding: 0, cursor: "pointer" }}>
                <img src={img.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Details */}
      <div>
        <h1 style={{ fontSize: "var(--text-2xl)", marginBottom: "var(--space-2)" }}>{product.name}</h1>
        <div style={{ fontSize: "var(--text-xl)", marginBottom: "var(--space-6)" }}>{formatMoney(price)}</div>
        <p style={{ color: "var(--color-muted)", lineHeight: 1.6 }}>{product.description}</p>

        {/* Color */}
        <div style={{ marginTop: "var(--space-8)" }}>
          <div style={label}>Color</div>
          <div style={{ display: "flex", gap: "var(--space-2)" }}>
            {product.colors.map((c) => (
              <button key={c} onClick={() => { setColor(c); setSize(null); setQty(1); }}
                style={{ ...chip, ...(c === color ? chipActive : {}) }}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Size */}
        <div style={{ marginTop: "var(--space-6)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div style={label}>Size</div>
            {product.sizeGuide.length > 0 && (
              <button type="button" onClick={() => setShowSizeGuide(true)}
                style={{ background: "none", border: "none", cursor: "pointer", textDecoration: "underline", fontSize: "var(--text-sm)", color: "var(--color-muted)" }}>
                Size guide
              </button>
            )}
          </div>
          <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
            {!color && <span style={{ color: "var(--color-muted)" }}>Select a color first</span>}
            {sizesForColor.map((v) => (
              <button key={v.id} disabled={!v.inStock}
                onClick={() => { setSize(v.size); setQty(1); }}
                title={v.inStock ? "" : "Out of stock"}
                style={{
                  ...chip,
                  ...(v.size === size ? chipActive : {}),
                  ...(v.inStock ? {} : chipDisabled),
                }}>
                {v.size}
              </button>
            ))}
          </div>
          {/* Inline measurements for the selected size */}
          {size && sizeMeasurements.length > 0 && (
            <div style={{ marginTop: "var(--space-3)", color: "var(--color-muted)", fontSize: "var(--text-sm)" }}>
              {sizeMeasurements.map((m) => `${m.dimension}: ${m.value}${m.unit ? ` ${m.unit}` : ""}`).join("  ·  ")}
            </div>
          )}
          {selectedVariant && !selectedVariant.inStock && (
            <div style={{ color: "var(--color-danger)", marginTop: "var(--space-2)" }}>This variant is sold out.</div>
          )}
          {selectedVariant?.inStock && selectedVariant.availableQuantity <= 5 && (
            <div style={{ color: "var(--color-muted)", marginTop: "var(--space-2)" }}>
              Only {selectedVariant.availableQuantity} left
            </div>
          )}
        </div>

        {/* Quantity */}
        <div style={{ marginTop: "var(--space-6)" }}>
          <div style={label}>Quantity</div>
          <input type="number" min={1} max={selectedVariant?.availableQuantity ?? 1} value={qty}
            disabled={!selectedVariant?.inStock}
            onChange={(e) => setQty(Math.max(1, Math.min(Number(e.target.value), selectedVariant?.availableQuantity ?? 1)))}
            style={{ width: 80, padding: "var(--space-2)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)" }} />
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "var(--space-3)", marginTop: "var(--space-8)" }}>
          <button disabled={!canAdd || adding} style={{ ...primaryBtn, ...(canAdd && !adding ? {} : chipDisabled) }}
            onClick={handleAdd}>
            {adding ? "Adding…" : "Add to cart"}
          </button>
        </div>
        {!product.inStock && <div style={{ color: "var(--color-danger)", marginTop: "var(--space-4)" }}>This product is currently out of stock.</div>}
      </div>

      {showSizeGuide && <SizeGuideModal guide={product.sizeGuide} onClose={() => setShowSizeGuide(false)} />}
    </div>
  );
}

const label = { fontSize: "var(--text-sm)", color: "var(--color-muted)", marginBottom: "var(--space-2)", textTransform: "uppercase", letterSpacing: "0.08em" } as const;
const chip = { padding: "var(--space-2) var(--space-4)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", background: "var(--color-bg)", cursor: "pointer" } as const;
const chipActive = { background: "var(--color-primary)", color: "var(--color-accent)", borderColor: "var(--color-primary)" } as const;
const chipDisabled = { opacity: 0.4, cursor: "not-allowed", textDecoration: "line-through" } as const;
const primaryBtn = { padding: "var(--space-3) var(--space-12)", background: "var(--color-primary)", color: "var(--color-accent)", border: "none", borderRadius: "var(--radius-sm)", fontWeight: 700, cursor: "pointer" } as const;
