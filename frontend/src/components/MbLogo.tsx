type Props = { size?: "sm" | "md" | "lg"; inverted?: boolean };

export function MbLogo({ size = "md", inverted = false }: Props) {
  const scale = size === "sm" ? 0.75 : size === "lg" ? 1.4 : 1;
  const color = inverted ? "#ffffff" : "currentColor";

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 * scale, lineHeight: 1 }}>
      {/* Geometric mark — two overlapping M-peaks */}
      <svg
        width={32 * scale}
        height={32 * scale}
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden="true"
      >
        {/* Background square with rounded corners */}
        <rect width="32" height="32" rx="6" fill={color} />
        {/* M-peak shape cut out */}
        <path
          d="M5 24 L5 10 L10.5 18 L16 10 L21.5 18 L27 10 L27 24"
          stroke={inverted ? "#000000" : "#ffffff"}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>

      {/* Wordmark */}
      <span style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 900,
            fontSize: 20 * scale,
            letterSpacing: "0.12em",
            lineHeight: 1,
            color,
          }}
        >
          MB
        </span>
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 7 * scale,
            letterSpacing: "0.28em",
            lineHeight: 1,
            color,
            opacity: 0.75,
            textTransform: "uppercase",
            marginTop: 2,
          }}
        >
          FITNESS
        </span>
      </span>
    </span>
  );
}
