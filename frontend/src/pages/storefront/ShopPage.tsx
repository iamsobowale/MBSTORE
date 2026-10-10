import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import {
  fetchCategories,
  fetchProducts,
  type ProductSort,
} from "../../features/catalog/api";
import { ProductCard } from "../../components/ProductCard";

const SORT_OPTIONS: { value: ProductSort; label: string }[] = [
  { value: "Newest", label: "Newest" },
  { value: "PriceAsc", label: "Price: Low to High" },
  { value: "PriceDesc", label: "Price: High to Low" },
  { value: "BestSelling", label: "Best Selling" },
];

const PAGE_SIZE = 12;

export function ShopPage() {
  const [params, setParams] = useSearchParams();

  const page = Number(params.get("page") ?? "1");
  const search = params.get("search") ?? "";
  const category = params.get("category") ?? "";
  const size = params.get("size") ?? "";
  const sort = (params.get("sort") as ProductSort) ?? "Newest";
  const inStock = params.get("inStock") === "true";

  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["products", { page, search, category, size, sort, inStock }],
    queryFn: () =>
      fetchProducts({
        page,
        pageSize: PAGE_SIZE,
        search: search || undefined,
        category: category || undefined,
        size: size || undefined,
        sort,
        inStock: inStock || undefined,
      }),
    placeholderData: keepPreviousData,
  });

  // Merge a partial patch into the URL params; reset to page 1 on any filter change.
  const patch = (next: Record<string, string | null>) => {
    const merged = new URLSearchParams(params);
    for (const [k, v] of Object.entries(next)) {
      if (v === null || v === "") merged.delete(k);
      else merged.set(k, v);
    }
    if (!("page" in next)) merged.set("page", "1");
    setParams(merged);
  };

  return (
    <>
    {/* Dark image banner */}
    <section style={{ position: "relative", background: "var(--color-primary)", color: "var(--color-accent)", overflow: "hidden" }}>
      <img src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1920&q=80"
        alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.35 }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.4), rgba(0,0,0,0.7))" }} />
      <div className="container" style={{ position: "relative", padding: "var(--space-16) 0" }}>
        <p className="eyebrow" style={{ color: "var(--color-accent)", opacity: 0.8 }}>{category || "All"} collection</p>
        <h1 style={{ fontSize: "var(--text-3xl)", textTransform: "uppercase", marginTop: "var(--space-2)" }}>Shop</h1>
      </div>
    </section>

    <div className="container" style={{ padding: "var(--space-12) 0" }}>
      {/* Controls — search on the left, filters on the right */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "var(--space-3)",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "var(--space-8)",
          paddingBottom: "var(--space-6)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <input
          className="mb-input"
          placeholder="Search products…"
          defaultValue={search}
          onKeyDown={(e) => {
            if (e.key === "Enter") patch({ search: (e.target as HTMLInputElement).value });
          }}
          style={{ flex: "1 1 240px", maxWidth: 360 }}
        />
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3)", alignItems: "center" }}>
          <select className="mb-select" value={category} onChange={(e) => patch({ category: e.target.value })}>
            <option value="">All categories</option>
            {categories?.map((c) => (
              <option key={c.id} value={c.slug}>{c.name}</option>
            ))}
          </select>
          <select className="mb-select" value={size} onChange={(e) => patch({ size: e.target.value })}>
            <option value="">All sizes</option>
            {["XS", "S", "M", "L", "XL"].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select className="mb-select" value={sort} onChange={(e) => patch({ sort: e.target.value })}>
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <label className="mb-check">
            <input
              type="checkbox"
              checked={inStock}
              onChange={(e) => patch({ inStock: e.target.checked ? "true" : null })}
            />
            In stock
          </label>
        </div>
      </div>

      {/* Result count */}
      {data && (
        <p className="eyebrow" style={{ marginBottom: "var(--space-6)" }}>
          {data.totalCount} {data.totalCount === 1 ? "product" : "products"}
        </p>
      )}

      {/* Grid */}
      {isLoading && <p style={{ color: "var(--color-muted)" }}>Loading products…</p>}
      {isError && <p style={{ color: "var(--color-danger)" }}>Failed to load products.</p>}
      {data && data.items.length === 0 && <p style={{ color: "var(--color-muted)" }}>No products match your filters.</p>}

      {data && data.items.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: "var(--space-8)",
          }}
        >
          {data.items.map((p, i) => (
            <div key={p.id} className="mb-fade-up" style={{ animationDelay: `${Math.min(i * 0.05, 0.4)}s` }}>
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div style={{ display: "flex", gap: "var(--space-4)", justifyContent: "center", alignItems: "center", marginTop: "var(--space-16)" }}>
          <button className="mb-btn mb-btn--ghost" disabled={page <= 1} onClick={() => patch({ page: String(page - 1) })}>
            Previous
          </button>
          <span className="eyebrow">
            Page {data.page} / {data.totalPages}
          </span>
          <button className="mb-btn mb-btn--ghost" disabled={page >= data.totalPages} onClick={() => patch({ page: String(page + 1) })}>
            Next
          </button>
        </div>
      )}
    </div>
    </>
  );
}
