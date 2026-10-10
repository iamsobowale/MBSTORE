import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  archiveAdminProduct,
  listAdminProducts,
  STATUS_LABEL,
} from "../../features/admin/catalogApi";
import { formatMoney } from "../../lib/format";

export function ProductsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-products", { search, page }],
    queryFn: () => listAdminProducts({ search: search || undefined, page, pageSize: 20 }),
    placeholderData: keepPreviousData,
  });

  const archive = useMutation({
    mutationFn: (id: string) => archiveAdminProduct(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-products"] }),
  });

  return (
    <div>
      <div className="mb-section-head" style={{ marginBottom: "var(--space-6)" }}>
        <div>
          <p className="eyebrow" style={{ marginBottom: "var(--space-1)" }}>Catalog</p>
          <h1 style={{ fontSize: "var(--text-2xl)" }}>Products</h1>
        </div>
        <Link to="/admin/products/new" className="mb-btn" style={{ padding: "var(--space-2) var(--space-6)" }}>+ New product</Link>
      </div>

      <input
        className="mb-input"
        placeholder="Search products…"
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        style={{ marginBottom: "var(--space-6)", width: 320 }}
      />

      {isLoading ? (
        <p style={{ color: "var(--color-muted)" }}>Loading…</p>
      ) : (
        <div className="mb-panel" style={{ padding: 0, overflow: "hidden" }}>
          <table className="mb-table">
            <thead>
              <tr>
                <th></th>
                <th>Name</th>
                <th>Status</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Variants</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data?.items.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div style={{ width: 44, height: 55, background: "var(--color-surface)", borderRadius: "var(--radius-sm)", overflow: "hidden" }}>
                      {p.primaryImageUrl && <img src={p.primaryImageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                    </div>
                  </td>
                  <td><Link to={`/admin/products/${p.id}`} style={{ fontWeight: 600 }}>{p.name}</Link></td>
                  <td><StatusBadge status={p.status} /></td>
                  <td>{formatMoney(p.basePrice)}</td>
                  <td>{p.totalStock}</td>
                  <td>{p.variantCount}</td>
                  <td style={{ textAlign: "right" }}>
                    <Link to={`/admin/products/${p.id}`} style={linkBtn}>Edit</Link>
                    {p.status !== 2 && (
                      <button
                        onClick={() => { if (confirm(`Archive "${p.name}"?`)) archive.mutate(p.id); }}
                        style={{ ...linkBtn, color: "var(--color-danger)", background: "none", border: "none", cursor: "pointer" }}
                      >
                        Archive
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && data.totalPages > 1 && (
        <div style={{ display: "flex", gap: "var(--space-4)", marginTop: "var(--space-6)", alignItems: "center" }}>
          <button className="mb-btn mb-btn--ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
          <span className="eyebrow">Page {data.page} / {data.totalPages}</span>
          <button className="mb-btn mb-btn--ghost" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: number }) {
  const colors: Record<number, string> = { 0: "var(--color-muted)", 1: "var(--color-success)", 2: "var(--color-danger)" };
  return (
    <span style={{ fontSize: "var(--text-xs)", padding: "2px 8px", borderRadius: "var(--radius-sm)", border: `1px solid ${colors[status]}`, color: colors[status] }}>
      {STATUS_LABEL[status]}
    </span>
  );
}

const linkBtn = { marginLeft: "var(--space-3)", fontSize: "var(--text-sm)" } as const;
