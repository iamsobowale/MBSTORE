/** Lightweight placeholder for pages that arrive in later phases. */
export function Placeholder({ title, note }: { title: string; note?: string }) {
  return (
    <div className="container" style={{ padding: "var(--space-16) 0" }}>
      <h1 style={{ fontSize: "var(--text-2xl)" }}>{title}</h1>
      <p style={{ color: "var(--color-muted)" }}>
        {note ?? "Coming in a later phase — see docs/05-ROADMAP.md."}
      </p>
    </div>
  );
}
