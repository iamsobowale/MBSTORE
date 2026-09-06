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
      {/* Controls */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3)", marginBottom: "var(--space-8)" }}>
        <input
          placeholder="Search products…"
          defaultValue={search}
          onKeyDown={(e) => {
            if (e.key === "Enter") patch({ search: (e.target as HTMLInputElement).value });
          }}
          style={ctrl}
        />
        <select value={category} onChange={(e) => patch({ category: e.target.value })} style={ctrl}>
          <option value="">All categories</option>
          {categories?.map((c) => (
            <option key={c.id} value={c.slug}>{c.name}</option>
          ))}
        </select>
        <select value={size} onChange={(e) => patch({ size: e.target.value })} style={ctrl}>
          <option value="">All sizes</option>
          {["XS", "S", "M", "L", "XL"].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select value={sort} onChange={(e) => patch({ sort: e.target.value })} style={ctrl}>
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <label style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          <input
            type="checkbox"
            checked={inStock}
            onChange={(e) => patch({ inStock: e.target.checked ? "true" : null })}
          />
          In stock only
        </label>
      </div>

      {/* Grid */}
      {isLoading && <p>Loading products…</p>}
      {isError && <p style={{ color: "var(--color-danger)" }}>Failed to load products.</p>}
      {data && data.items.length === 0 && <p style={{ color: "var(--color-muted)" }}>No products match your filters.</p>}

      {data && data.items.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: "var(--space-8)",
          }}
        >
          {data.items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div style={{ display: "flex", gap: "var(--space-4)", justifyContent: "center", marginTop: "var(--space-12)" }}>
          <button disabled={page <= 1} onClick={() => patch({ page: String(page - 1) })} style={pageBtn}>
            Previous
          </button>
          <span style={{ alignSelf: "center", color: "var(--color-muted)" }}>
            Page {data.page} of {data.totalPages}
          </span>
          <button disabled={page >= data.totalPages} onClick={() => patch({ page: String(page + 1) })} style={pageBtn}>
            Next
          </button>
        </div>
      )}
    </div>
    </>
  );
}

const ctrl = {
  padding: "var(--space-2) var(--space-3)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-sm)",
  background: "var(--color-bg)",
} as const;

const pageBtn = {
  padding: "var(--space-2) var(--space-6)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-sm)",
  background: "var(--color-bg)",
  cursor: "pointer",
} as const;
