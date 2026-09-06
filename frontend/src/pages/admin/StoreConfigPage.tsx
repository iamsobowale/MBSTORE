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
    <div style={{ maxWidth: 560 }}>
      <h1 style={{ fontSize: "var(--text-2xl)" }}>Store Configuration</h1>

      <label style={labelStyle}>Brand name</label>
      <input style={inputStyle} value={form.brandName} onChange={(e) => set("brandName", e.target.value)} />

      <label style={labelStyle}>Logo URL</label>
      <input style={inputStyle} value={form.logoUrl ?? ""} onChange={(e) => set("logoUrl", e.target.value)} />

      <h2 style={{ fontSize: "var(--text-lg)", marginTop: "var(--space-8)" }}>Theme colors</h2>
      {colorFields.map((f) => (
        <div key={f.key} style={{ display: "flex", alignItems: "center", gap: "var(--space-4)", margin: "var(--space-2) 0" }}>
          <input
            type="color"
            value={String(form[f.key] ?? "#000000")}
            onChange={(e) => set(f.key, e.target.value)}
          />
          <span style={{ width: 120 }}>{f.label}</span>
          <code>{String(form[f.key])}</code>
        </div>
      ))}

      <button
        style={buttonStyle}
        disabled={mutation.isPending}
        onClick={() => mutation.mutate(form)}
      >
        {mutation.isPending ? "Saving…" : "Save changes"}
      </button>
      {mutation.isSuccess && <span style={{ marginLeft: "var(--space-4)", color: "var(--color-success)" }}>Saved</span>}
    </div>
  );
}

const labelStyle = { display: "block", marginTop: "var(--space-4)", fontSize: "var(--text-sm)", color: "var(--color-muted)" } as const;
const inputStyle = { width: "100%", padding: "var(--space-2)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)" } as const;
const buttonStyle = { marginTop: "var(--space-8)", padding: "var(--space-3) var(--space-8)", background: "var(--color-primary)", color: "var(--color-accent)", border: "none", borderRadius: "var(--radius-sm)", fontWeight: 700, cursor: "pointer" } as const;
