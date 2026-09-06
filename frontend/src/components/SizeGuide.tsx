import type { SizeMeasurement } from "../features/catalog/api";

/** Pivots flat measurements into ordered sizes (rows) and dimensions (columns). */
export function pivotSizeGuide(guide: SizeMeasurement[]) {
  const sizes: string[] = [];
  const dimensions: string[] = [];
  const lookup = new Map<string, string>(); // `${size}|${dimension}` -> "value unit"

  for (const m of guide) {
    if (!sizes.includes(m.size)) sizes.push(m.size);
    if (!dimensions.includes(m.dimension)) dimensions.push(m.dimension);
    lookup.set(`${m.size}|${m.dimension}`, `${m.value}${m.unit ? ` ${m.unit}` : ""}`);
  }
  return { sizes, dimensions, get: (s: string, d: string) => lookup.get(`${s}|${d}`) ?? "—" };
}

export function SizeGuideTable({ guide }: { guide: SizeMeasurement[] }) {
  const { sizes, dimensions, get } = pivotSizeGuide(guide);
  if (sizes.length === 0) return null;

  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--text-sm)" }}>
      <thead>
        <tr>
          <th style={cell}>Size</th>
          {dimensions.map((d) => <th key={d} style={cell}>{d}</th>)}
        </tr>
      </thead>
      <tbody>
        {sizes.map((s) => (
          <tr key={s}>
            <td style={{ ...cell, fontWeight: 600 }}>{s}</td>
            {dimensions.map((d) => <td key={d} style={cell}>{get(s, d)}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function SizeGuideModal({ guide, onClose }: { guide: SizeMeasurement[]; onClose: () => void }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "grid", placeItems: "center", zIndex: 50 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--color-bg)", borderRadius: "var(--radius-md)", padding: "var(--space-8)", width: "min(560px, 92vw)", maxHeight: "80vh", overflow: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
          <h2 style={{ fontSize: "var(--text-lg)", margin: 0 }}>Size Guide</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "var(--text-xl)", cursor: "pointer" }}>×</button>
        </div>
        <SizeGuideTable guide={guide} />
        <p style={{ color: "var(--color-muted)", fontSize: "var(--text-xs)", marginTop: "var(--space-4)" }}>
          Measurements are estimates. If you're between sizes, we recommend sizing up.
        </p>
      </div>
    </div>
  );
}

const cell = { border: "1px solid var(--color-border)", padding: "var(--space-2) var(--space-3)", textAlign: "left" } as const;
