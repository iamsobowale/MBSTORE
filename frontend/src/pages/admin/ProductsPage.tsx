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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-6)" }}>
        <h1 style={{ fontSize: "var(--text-2xl)", margin: 0 }}>Products</h1>
        <Link to="/admin/products/new" style={primaryBtn}>+ New product</Link>
      </div>

      <input
        placeholder="Search…"
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        style={{ padding: "var(--space-2) var(--space-3)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", marginBottom: "var(--space-6)", width: 280 }}
      />

      {isLoading ? (
        <p>Loading…</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid var(--color-border)", color: "var(--color-muted)", fontSize: "var(--text-sm)" }}>
              <th style={th}></th>
              <th style={th}>Name</th>
              <th style={th}>Status</th>
              <th style={th}>Price</th>
              <th style={th}>Stock</th>
              <th style={th}>Variants</th>
              <th style={th}></th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((p) => (
              <tr key={p.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                <td style={td}>
                  <div style={{ width: 44, height: 55, background: "var(--color-surface)", borderRadius: "var(--radius-sm)", overflow: "hidden" }}>
                    {p.primaryImageUrl && <img src={p.primaryImageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                  </div>
                </td>
                <td style={td}><Link to={`/admin/products/${p.id}`} style={{ fontWeight: 600 }}>{p.name}</Link></td>
                <td style={td}><StatusBadge status={p.status} /></td>
                <td style={td}>{formatMoney(p.basePrice)}</td>
                <td style={td}>{p.totalStock}</td>
                <td style={td}>{p.variantCount}</td>
                <td style={{ ...td, textAlign: "right" }}>
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
      )}

      {data && data.totalPages > 1 && (
        <div style={{ display: "flex", gap: "var(--space-4)", marginTop: "var(--space-6)", alignItems: "center" }}>
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} style={pageBtn}>Previous</button>
          <span style={{ color: "var(--color-muted)" }}>Page {data.page} of {data.totalPages}</span>
          <button disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)} style={pageBtn}>Next</button>
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

const th = { padding: "var(--space-2)" } as const;
const td = { padding: "var(--space-2)", verticalAlign: "middle" } as const;
const primaryBtn = { padding: "var(--space-2) var(--space-6)", background: "var(--color-primary)", color: "var(--color-accent)", borderRadius: "var(--radius-sm)", fontWeight: 700 } as const;
const linkBtn = { marginLeft: "var(--space-3)", fontSize: "var(--text-sm)" } as const;
const pageBtn = { padding: "var(--space-2) var(--space-4)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", background: "var(--color-bg)", cursor: "pointer" } as const;
