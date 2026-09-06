import { ORDER_STATUS_LABEL } from "../features/admin/ordersApi";

export interface TimelineEntry {
  status: string;
  note: string | null;
  at: string;
}

/** Vertical status history, newest at the bottom (chronological). */
export function OrderTimeline({ entries }: { entries: TimelineEntry[] }) {
  if (entries.length === 0) return <p style={{ color: "var(--color-muted)" }}>No history yet.</p>;
  return (
    <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
      {entries.map((e, idx) => {
        const last = idx === entries.length - 1;
        return (
          <li key={idx} style={{ display: "flex", gap: "var(--space-3)" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: last ? "var(--color-primary)" : "var(--color-border)", marginTop: 4 }} />
              {!last && <span style={{ flex: 1, width: 2, background: "var(--color-border)" }} />}
            </div>
            <div style={{ paddingBottom: last ? 0 : "var(--space-4)" }}>
              <div style={{ fontWeight: 600 }}>{ORDER_STATUS_LABEL[e.status] ?? e.status}</div>
              <div style={{ color: "var(--color-muted)", fontSize: "var(--text-sm)" }}>
                {new Date(e.at).toLocaleString()}{e.note ? ` · ${e.note}` : ""}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
