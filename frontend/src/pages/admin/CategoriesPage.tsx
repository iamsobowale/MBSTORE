import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  createAdminCategory,
  deleteAdminCategory,
  listAdminCategories,
  updateAdminCategory,
} from "../../features/admin/catalogApi";
import type { Category } from "../../features/catalog/api";

export function CategoriesPage() {
  const qc = useQueryClient();
  const { data: categories } = useQuery({ queryKey: ["admin-categories"], queryFn: listAdminCategories });

  const [name, setName] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-categories"] });
    qc.invalidateQueries({ queryKey: ["categories"] });
  };

  const create = useMutation({
    mutationFn: () => createAdminCategory({ name, slug: null, parentId: null, sortOrder }),
    onSuccess: () => { setName(""); setSortOrder(0); setError(null); invalidate(); },
    onError: (e: unknown) => setError((e as { response?: { data?: { title?: string } } })?.response?.data?.title ?? "Could not create category."),
  });

  const update = useMutation({
    mutationFn: (c: Category) => updateAdminCategory(c.id, { name: c.name, slug: null, parentId: c.parentId, sortOrder: c.sortOrder }),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteAdminCategory(id),
    onSuccess: invalidate,
  });

  return (
    <div style={{ maxWidth: 680 }}>
      <p className="eyebrow" style={{ marginBottom: "var(--space-1)" }}>Catalog</p>
      <h1 style={{ fontSize: "var(--text-2xl)", marginBottom: "var(--space-6)" }}>Categories</h1>

      <div className="mb-panel" style={{ marginBottom: "var(--space-6)" }}>
        <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <label style={lbl}>New category name</label>
            <input className="mb-input" style={{ width: "100%" }} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Outerwear" />
          </div>
          <div style={{ width: 100 }}>
            <label style={lbl}>Sort</label>
            <input className="mb-input" style={{ width: "100%" }} type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} />
          </div>
          <button onClick={() => name.trim() && create.mutate()} disabled={create.isPending} className="mb-btn">Add</button>
        </div>
        {error && <div style={{ color: "var(--color-danger)", marginTop: "var(--space-3)" }}>{error}</div>}
      </div>

      <div className="mb-panel" style={{ padding: 0, overflow: "hidden" }}>
        <table className="mb-table">
          <thead>
            <tr>
              <th>Name</th><th>Slug</th><th>Sort</th><th></th>
            </tr>
          </thead>
          <tbody>
            {categories?.map((c) => (
              <tr key={c.id}>
                <td>
                  <input className="mb-input" style={{ width: "100%" }} defaultValue={c.name}
                    onBlur={(e) => e.target.value !== c.name && update.mutate({ ...c, name: e.target.value })} />
                </td>
                <td><code style={{ color: "var(--color-muted)" }}>{c.slug}</code></td>
                <td>
                  <input className="mb-input" style={{ width: 80 }} type="number" defaultValue={c.sortOrder}
                    onBlur={(e) => Number(e.target.value) !== c.sortOrder && update.mutate({ ...c, sortOrder: Number(e.target.value) })} />
                </td>
                <td style={{ textAlign: "right" }}>
                  <button onClick={() => confirm(`Delete "${c.name}"?`) && remove.mutate(c.id)}
                    style={{ background: "none", border: "none", color: "var(--color-danger)", cursor: "pointer", fontSize: "var(--text-sm)" }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const lbl = { display: "block", marginBottom: "var(--space-1)", fontSize: "var(--text-sm)", color: "var(--color-muted)" } as const;
