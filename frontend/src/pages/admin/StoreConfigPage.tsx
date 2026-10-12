import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  fetchStoreSettings,
  updateStoreSettings,
  type StoreSettings,
} from "../../features/storeConfig/api";
import { uploadImage } from "../../features/admin/catalogApi";

const colorFields: { key: keyof StoreSettings; label: string }[] = [
  { key: "primaryColor", label: "Primary" },
  { key: "secondaryColor", label: "Secondary" },
  { key: "backgroundColor", label: "Background" },
  { key: "textColor", label: "Text" },
  { key: "accentColor", label: "Accent" },
];

/**
 * Admin store branding + theme editor. Saving updates the backend singleton; the
 * ThemeProvider re-applies CSS variables everywhere (invalidated query).
 */
export function StoreConfigPage() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["store-settings"], queryFn: fetchStoreSettings });
  const [form, setForm] = useState<StoreSettings | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const mutation = useMutation({
    mutationFn: (payload: StoreSettings) => updateStoreSettings(payload),
    onSuccess: (saved) => {
      qc.setQueryData(["store-settings"], saved);
      qc.invalidateQueries({ queryKey: ["store-settings"] });
    },
  });

  if (!form) return <p>Loading…</p>;

  const set = (key: keyof StoreSettings, value: string | null) =>
    setForm({ ...form, [key]: value });

  const handleLogoUpload = async (file: File) => {
    setUploading(true);
    setUploadError(null);
    try {
      const url = await uploadImage(file);
      setForm((f) => (f ? { ...f, logoUrl: url } : f));
    } catch {
      setUploadError("Upload failed — check the file type and size.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600 }}>
      <p className="eyebrow" style={{ marginBottom: "var(--space-1)" }}>Branding</p>
      <h1 style={{ fontSize: "var(--text-2xl)", marginBottom: "var(--space-6)" }}>Store Configuration</h1>

      <div className="mb-panel" style={{ marginBottom: "var(--space-6)" }}>
        <h2 style={{ fontSize: "var(--text-lg)", marginBottom: "var(--space-4)" }}>Identity</h2>
        <label style={labelStyle}>Brand name</label>
        <input className="mb-input" style={inputStyle} value={form.brandName} onChange={(e) => set("brandName", e.target.value)} />

        <label style={labelStyle}>Logo</label>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)", flexWrap: "wrap" }}>
          {/* Preview on a neutral surface so transparent logos are visible */}
          <div style={{ width: 140, height: 56, border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", background: "var(--color-surface)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
            {form.logoUrl ? (
              <img src={form.logoUrl} alt="Logo preview" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
            ) : (
              <span style={{ color: "var(--color-muted)", fontSize: "var(--text-xs)" }}>No logo</span>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            <label className="mb-btn mb-btn--ghost" style={{ cursor: uploading ? "wait" : "pointer" }}>
              {uploading ? "Uploading…" : form.logoUrl ? "Replace logo" : "Upload logo"}
              <input
                type="file"
                accept="image/*"
                disabled={uploading}
                style={{ display: "none" }}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); e.target.value = ""; }}
              />
            </label>
            {form.logoUrl && (
              <button type="button" onClick={() => set("logoUrl", null)} style={{ background: "none", border: "none", color: "var(--color-danger)", cursor: "pointer", fontSize: "var(--text-sm)", textAlign: "left", padding: 0 }}>
                Remove logo
              </button>
            )}
          </div>
        </div>
        {uploadError && <div style={{ color: "var(--color-danger)", marginTop: "var(--space-2)", fontSize: "var(--text-sm)" }}>{uploadError}</div>}
        <p style={{ color: "var(--color-muted)", fontSize: "var(--text-xs)", marginTop: "var(--space-2)" }}>
          PNG or SVG with a transparent background works best. Remember to Save changes below.
        </p>
      </div>

      <div className="mb-panel" style={{ marginBottom: "var(--space-6)" }}>
        <h2 style={{ fontSize: "var(--text-lg)", marginBottom: "var(--space-4)" }}>Theme colors</h2>
        {colorFields.map((f) => (
          <div key={f.key} style={{ display: "flex", alignItems: "center", gap: "var(--space-4)", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
            <input
              type="color"
              value={String(form[f.key] ?? "#000000")}
              onChange={(e) => set(f.key, e.target.value)}
              style={{ width: 40, height: 40, border: "none", background: "none", cursor: "pointer", padding: 0 }}
            />
            <span style={{ width: 120, fontWeight: 500 }}>{f.label}</span>
            <code style={{ color: "var(--color-muted)" }}>{String(form[f.key])}</code>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
        <button
          className="mb-btn"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate(form)}
        >
          {mutation.isPending ? "Saving…" : "Save changes"}
        </button>
        {mutation.isSuccess && <span style={{ color: "var(--color-success)", fontWeight: 600 }}>✓ Saved</span>}
      </div>
    </div>
  );
}

const labelStyle = { display: "block", marginTop: "var(--space-4)", fontSize: "var(--text-sm)", color: "var(--color-muted)" } as const;
const inputStyle = { width: "100%" } as const;
