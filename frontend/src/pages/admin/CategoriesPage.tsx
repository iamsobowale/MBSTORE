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
    <div style={{ maxWidth: 640 }}>
      <h1 style={{ fontSize: "var(--text-2xl)" }}>Categories</h1>

      <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "flex-end", marginBottom: "var(--space-6)" }}>
        <div style={{ flex: 1 }}>
          <label style={lbl}>New category name</label>
          <input style={inp} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Outerwear" />
        </div>
        <div style={{ width: 100 }}>
          <label style={lbl}>Sort</label>
          <input style={inp} type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} />
        </div>
        <button onClick={() => name.trim() && create.mutate()} disabled={create.isPending} style={primaryBtn}>Add</button>
      </div>
      {error && <div style={{ color: "var(--color-danger)", marginBottom: "var(--space-4)" }}>{error}</div>}

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", color: "var(--color-muted)", fontSize: "var(--text-sm)", borderBottom: "1px solid var(--color-border)" }}>
            <th style={cell}>Name</th><th style={cell}>Slug</th><th style={cell}>Sort</th><th style={cell}></th>
          </tr>
        </thead>
        <tbody>
          {categories?.map((c) => (
            <tr key={c.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
              <td style={cell}>
                <input style={inp} defaultValue={c.name}
                  onBlur={(e) => e.target.value !== c.name && update.mutate({ ...c, name: e.target.value })} />
              </td>
              <td style={cell}><code style={{ color: "var(--color-muted)" }}>{c.slug}</code></td>
              <td style={cell}>
                <input style={{ ...inp, width: 70 }} type="number" defaultValue={c.sortOrder}
                  onBlur={(e) => Number(e.target.value) !== c.sortOrder && update.mutate({ ...c, sortOrder: Number(e.target.value) })} />
              </td>
              <td style={{ ...cell, textAlign: "right" }}>
                <button onClick={() => confirm(`Delete "${c.name}"?`) && remove.mutate(c.id)}
                  style={{ background: "none", border: "none", color: "var(--color-danger)", cursor: "pointer" }}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const lbl = { display: "block", marginBottom: "var(--space-1)", fontSize: "var(--text-sm)", color: "var(--color-muted)" } as const;
const inp = { width: "100%", padding: "var(--space-2)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)" } as const;
const cell = { padding: "var(--space-2)" } as const;
const primaryBtn = { padding: "var(--space-2) var(--space-6)", background: "var(--color-primary)", color: "var(--color-accent)", border: "none", borderRadius: "var(--radius-sm)", fontWeight: 700, cursor: "pointer", height: 38 } as const;
