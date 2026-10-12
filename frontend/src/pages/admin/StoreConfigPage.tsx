import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  fetchStoreSettings,
  updateStoreSettings,
  type StoreSettings,
} from "../../features/storeConfig/api";

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

  const set = (key: keyof StoreSettings, value: string) =>
    setForm({ ...form, [key]: value });

  return (
    <div style={{ maxWidth: 600 }}>
      <p className="eyebrow" style={{ marginBottom: "var(--space-1)" }}>Branding</p>
      <h1 style={{ fontSize: "var(--text-2xl)", marginBottom: "var(--space-6)" }}>Store Configuration</h1>

      <div className="mb-panel" style={{ marginBottom: "var(--space-6)" }}>
        <h2 style={{ fontSize: "var(--text-lg)", marginBottom: "var(--space-4)" }}>Identity</h2>
        <label style={labelStyle}>Brand name</label>
        <input className="mb-input" style={inputStyle} value={form.brandName} onChange={(e) => set("brandName", e.target.value)} />

        <label style={labelStyle}>Logo URL</label>
        <input className="mb-input" style={inputStyle} value={form.logoUrl ?? ""} onChange={(e) => set("logoUrl", e.target.value)} />
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
