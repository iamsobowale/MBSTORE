import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createAdminProduct,
  getAdminProduct,
  listAdminCategories,
  ProductStatus,
  updateAdminProduct,
  uploadImage,
  type AdminImage,
  type AdminVariant,
  type UpsertProductRequest,
} from "../../features/admin/catalogApi";

const emptyVariant = (): AdminVariant => ({ id: null, color: "", size: "", sku: "", price: null, stockQuantity: 0, isActive: true });

export function ProductEditPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === "new";
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: categories } = useQuery({ queryKey: ["admin-categories"], queryFn: listAdminCategories });
  const { data: existing } = useQuery({
    queryKey: ["admin-product", id],
    queryFn: () => getAdminProduct(id!),
    enabled: !isNew,
  });

  const [form, setForm] = useState<UpsertProductRequest>({
    name: "", slug: null, description: "", basePrice: 0, status: ProductStatus.Draft,
    categoryIds: [], images: [], variants: [emptyVariant()],
  });
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Size guide editor state (dimensions = columns, values keyed by `size|dimension`).
  const [sgDims, setSgDims] = useState<string[]>([]);
  const [sgUnit, setSgUnit] = useState("in");
  const [sgValues, setSgValues] = useState<Record<string, string>>({});
  const [newDim, setNewDim] = useState("");

  useEffect(() => {
    if (existing) {
      setForm({
        name: existing.name, slug: existing.slug, description: existing.description,
        basePrice: existing.basePrice, status: existing.status,
        categoryIds: existing.categoryIds, images: existing.images,
        variants: existing.variants.length ? existing.variants : [emptyVariant()],
      });
      // Seed the size-guide grid from existing measurements.
      const dims: string[] = [];
      const values: Record<string, string> = {};
      for (const m of existing.sizeGuide) {
        if (!dims.includes(m.dimension)) dims.push(m.dimension);
        values[`${m.size}|${m.dimension}`] = m.value;
      }
      setSgDims(dims);
      setSgValues(values);
      if (existing.sizeGuide[0]?.unit) setSgUnit(existing.sizeGuide[0].unit);
    }
  }, [existing]);

  // Sizes come from the variants the admin has defined.
  const sizes = Array.from(new Set(form.variants.map((v) => v.size.trim()).filter(Boolean)));

  const buildSizeGuide = () => {
    const out: { size: string; dimension: string; value: string; unit: string; sortOrder: number }[] = [];
    let order = 0;
    for (const size of sizes) {
      for (const dim of sgDims) {
        const value = (sgValues[`${size}|${dim}`] ?? "").trim();
        if (value) out.push({ size, dimension: dim, value, unit: sgUnit, sortOrder: order++ });
      }
    }
    return out;
  };

  const addDimension = () => {
    const name = newDim.trim();
    if (name && !sgDims.includes(name)) setSgDims([...sgDims, name]);
    setNewDim("");
  };

  const removeDimension = (dim: string) => {
    setSgDims(sgDims.filter((d) => d !== dim));
    setSgValues((v) => {
      const next = { ...v };
      for (const key of Object.keys(next)) if (key.endsWith(`|${dim}`)) delete next[key];
      return next;
    });
  };

  const save = useMutation({
    mutationFn: (req: UpsertProductRequest) =>
      isNew ? createAdminProduct(req) : updateAdminProduct(id!, req),
    onSuccess: (saved) => {
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["admin-product", saved.id] });
      navigate("/admin/products");
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { title?: string } } })?.response?.data?.title;
      setError(msg ?? "Could not save the product.");
    },
  });

  const set = <K extends keyof UpsertProductRequest>(key: K, val: UpsertProductRequest[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const setVariant = (i: number, patch: Partial<AdminVariant>) =>
    setForm((f) => ({ ...f, variants: f.variants.map((v, idx) => (idx === i ? { ...v, ...patch } : v)) }));

  const handleUpload = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const url = await uploadImage(file);
      const img: AdminImage = { id: null, url, altText: form.name, sortOrder: form.images.length, isPrimary: form.images.length === 0 };
      set("images", [...form.images, img]);
    } catch {
      setError("Image upload failed (check type/size).");
    } finally {
      setUploading(false);
    }
  };

  const setPrimary = (idx: number) =>
    set("images", form.images.map((im, i) => ({ ...im, isPrimary: i === idx })));

  const removeImage = (idx: number) =>
    set("images", form.images.filter((_, i) => i !== idx));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    save.mutate({ ...form, sizeGuide: buildSizeGuide() });
  };

  return (
    <form onSubmit={submit} style={{ maxWidth: 900 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-6)" }}>
        <h1 style={{ fontSize: "var(--text-2xl)", margin: 0 }}>{isNew ? "New product" : "Edit product"}</h1>
        <div style={{ display: "flex", gap: "var(--space-3)" }}>
          <button type="button" onClick={() => navigate("/admin/products")} style={ghostBtn}>Cancel</button>
          <button type="submit" disabled={save.isPending} style={primaryBtn}>{save.isPending ? "Saving…" : "Save"}</button>
        </div>
      </div>

      {error && <div style={{ color: "var(--color-danger)", marginBottom: "var(--space-4)" }}>{error}</div>}

      <Section title="Details">
        <label style={lbl}>Name</label>
        <input style={inp} value={form.name} onChange={(e) => set("name", e.target.value)} required />
        <label style={lbl}>Description</label>
        <textarea style={{ ...inp, minHeight: 90 }} value={form.description} onChange={(e) => set("description", e.target.value)} />
        <div style={{ display: "flex", gap: "var(--space-6)" }}>
          <div style={{ flex: 1 }}>
            <label style={lbl}>Base price (₦)</label>
            <input style={inp} type="number" min={0} value={form.basePrice} onChange={(e) => set("basePrice", Number(e.target.value))} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={lbl}>Status</label>
            <select style={inp} value={form.status} onChange={(e) => set("status", Number(e.target.value))}>
              <option value={ProductStatus.Draft}>Draft</option>
              <option value={ProductStatus.Published}>Published</option>
              <option value={ProductStatus.Archived}>Archived</option>
            </select>
          </div>
        </div>
      </Section>

      <Section title="Categories">
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-4)" }}>
          {categories?.length ? categories.map((c) => (
            <label key={c.id} style={{ display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
              <input
                type="checkbox"
                checked={form.categoryIds.includes(c.id)}
                onChange={(e) =>
                  set("categoryIds", e.target.checked
                    ? [...form.categoryIds, c.id]
                    : form.categoryIds.filter((x) => x !== c.id))
                }
              />
              {c.name}
            </label>
          )) : <span style={{ color: "var(--color-muted)" }}>No categories yet — create some under Categories.</span>}
        </div>
      </Section>

      <Section title="Images">
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-4)", marginBottom: "var(--space-4)" }}>
          {form.images.map((img, i) => (
            <div key={i} style={{ width: 110 }}>
              <div style={{ position: "relative", width: 110, height: 138, borderRadius: "var(--radius-sm)", overflow: "hidden", border: img.isPrimary ? "2px solid var(--color-primary)" : "1px solid var(--color-border)" }}>
                <img src={img.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: "var(--text-xs)" }}>
                <button type="button" onClick={() => setPrimary(i)} style={miniBtn}>{img.isPrimary ? "Primary" : "Make primary"}</button>
                <button type="button" onClick={() => removeImage(i)} style={{ ...miniBtn, color: "var(--color-danger)" }}>Remove</button>
              </div>
            </div>
          ))}
        </div>
        <input type="file" accept="image/*" disabled={uploading}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ""; }} />
        {uploading && <span style={{ marginLeft: "var(--space-3)", color: "var(--color-muted)" }}>Uploading…</span>}
      </Section>

      <Section title="Variants (inventory)">
        {/* datalist provides common size suggestions; admin can still type anything custom */}
        <datalist id="size-options">
          {["XS","S","M","L","XL","XXL","3XL","4XL",
            "26","28","30","32","34","36","38","40","42",
            "One Size"].map(s => <option key={s} value={s} />)}
        </datalist>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--text-sm)" }}>
          <thead>
            <tr style={{ textAlign: "left", color: "var(--color-muted)" }}>
              <th style={vth}>Color</th><th style={vth}>Size</th><th style={vth}>SKU</th>
              <th style={vth}>Price override</th><th style={vth}>Stock</th><th style={vth}>Active</th><th style={vth}></th>
            </tr>
          </thead>
          <tbody>
            {form.variants.map((v, i) => (
              <tr key={i}>
                <td style={vtd}><input style={vinp} value={v.color} onChange={(e) => setVariant(i, { color: e.target.value })} required /></td>
                <td style={vtd}><input style={vinp} list="size-options" value={v.size} onChange={(e) => setVariant(i, { size: e.target.value })} placeholder="e.g. M" required /></td>
                <td style={vtd}><input style={vinp} value={v.sku} onChange={(e) => setVariant(i, { sku: e.target.value })} required /></td>
                <td style={vtd}><input style={vinp} type="number" min={0} value={v.price ?? ""} placeholder="base"
                  onChange={(e) => setVariant(i, { price: e.target.value === "" ? null : Number(e.target.value) })} /></td>
                <td style={vtd}><input style={{ ...vinp, width: 70 }} type="number" min={0} value={v.stockQuantity}
                  onChange={(e) => setVariant(i, { stockQuantity: Number(e.target.value) })} /></td>
                <td style={vtd}><input type="checkbox" checked={v.isActive} onChange={(e) => setVariant(i, { isActive: e.target.checked })} /></td>
                <td style={vtd}>
                  <button type="button" onClick={() => set("variants", form.variants.filter((_, idx) => idx !== i))}
                    style={{ ...miniBtn, color: "var(--color-danger)" }} disabled={form.variants.length === 1}>✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button type="button" onClick={() => set("variants", [...form.variants, emptyVariant()])} style={{ ...ghostBtn, marginTop: "var(--space-3)" }}>
          + Add variant
        </button>
      </Section>

      <Section title="Size guide (measurements)">
        <p style={{ color: "var(--color-muted)", fontSize: "var(--text-sm)", marginTop: 0 }}>
          Add measurement dimensions (e.g. Chest, Waist, Hips) and fill values per size.
          Sizes come from your variants above. Leave a cell blank to omit it.
        </p>

        <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "center", marginBottom: "var(--space-4)", flexWrap: "wrap" }}>
          <input placeholder="Add dimension (e.g. Chest)" value={newDim}
            onChange={(e) => setNewDim(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addDimension(); } }}
            style={{ ...inp, width: 220 }} />
          <button type="button" onClick={addDimension} style={ghostBtn}>+ Add dimension</button>
          <label style={{ marginLeft: "auto", fontSize: "var(--text-sm)", color: "var(--color-muted)" }}>
            Unit{" "}
            <select value={sgUnit} onChange={(e) => setSgUnit(e.target.value)} style={{ ...inp, width: 80, display: "inline-block" }}>
              <option value="in">in</option>
              <option value="cm">cm</option>
            </select>
          </label>
        </div>

        {sizes.length === 0 ? (
          <p style={{ color: "var(--color-muted)" }}>Add variants first to define sizes.</p>
        ) : sgDims.length === 0 ? (
          <p style={{ color: "var(--color-muted)" }}>No dimensions yet — add one above.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--text-sm)" }}>
            <thead>
              <tr style={{ textAlign: "left", color: "var(--color-muted)" }}>
                <th style={vth}>Size</th>
                {sgDims.map((d) => (
                  <th key={d} style={vth}>
                    {d}{" "}
                    <button type="button" onClick={() => removeDimension(d)} style={{ ...miniBtn, color: "var(--color-danger)" }}>✕</button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sizes.map((size) => (
                <tr key={size}>
                  <td style={{ ...vtd, fontWeight: 600 }}>{size}</td>
                  {sgDims.map((dim) => (
                    <td key={dim} style={vtd}>
                      <input style={vinp} placeholder={`e.g. 42`}
                        value={sgValues[`${size}|${dim}`] ?? ""}
                        onChange={(e) => setSgValues((v) => ({ ...v, [`${size}|${dim}`]: e.target.value }))} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "var(--space-6)", marginBottom: "var(--space-6)" }}>
      <h2 style={{ fontSize: "var(--text-lg)", marginTop: 0 }}>{title}</h2>
      {children}
    </section>
  );
}

const lbl = { display: "block", marginTop: "var(--space-3)", marginBottom: "var(--space-1)", fontSize: "var(--text-sm)", color: "var(--color-muted)" } as const;
const inp = { width: "100%", padding: "var(--space-2)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)" } as const;
const vth = { padding: "var(--space-1) var(--space-2)" } as const;
const vtd = { padding: "2px var(--space-2)" } as const;
const vinp = { width: "100%", padding: "var(--space-1) var(--space-2)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)" } as const;
const primaryBtn = { padding: "var(--space-2) var(--space-6)", background: "var(--color-primary)", color: "var(--color-accent)", border: "none", borderRadius: "var(--radius-sm)", fontWeight: 700, cursor: "pointer" } as const;
const ghostBtn = { padding: "var(--space-2) var(--space-6)", background: "var(--color-bg)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", cursor: "pointer" } as const;
const miniBtn = { background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: "var(--text-xs)" } as const;
