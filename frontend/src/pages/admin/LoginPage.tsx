import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";
import { MbLogo } from "../../components/MbLogo";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@mb.local");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate("/admin");
    } catch {
      setError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "var(--color-primary)", padding: "var(--space-6)" }}>
      <form onSubmit={submit} style={{ width: 380, background: "var(--color-bg)", padding: "var(--space-12) var(--space-8)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-lg)" }}>
        <div style={{ marginBottom: "var(--space-6)" }}>
          <MbLogo size="md" />
        </div>
        <p className="eyebrow" style={{ marginBottom: "var(--space-1)" }}>Admin Console</p>
        <h1 style={{ fontSize: "var(--text-xl)", marginTop: 0 }}>Welcome back</h1>
        <p style={{ color: "var(--color-muted)", marginTop: "var(--space-1)", fontSize: "var(--text-sm)" }}>Sign in to manage your store.</p>

        <label style={labelStyle}>Email</label>
        <input className="mb-input" style={inputStyle} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

        <label style={labelStyle}>Password</label>
        <div style={{ position: "relative", marginTop: "var(--space-1)" }}>
          <input
            className="mb-input"
            style={{ ...inputStyle, marginTop: 0, paddingRight: 44 }}
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(v => !v)}
            style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--color-muted)", fontSize: 16, padding: 0, lineHeight: 1 }}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? "🙈" : "👁️"}
          </button>
        </div>

        {error && <div style={{ color: "var(--color-danger)", marginTop: "var(--space-3)", fontSize: "var(--text-sm)" }}>{error}</div>}

        <button type="submit" disabled={loading} className="mb-btn" style={{ width: "100%", marginTop: "var(--space-6)" }}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

const labelStyle = { display: "block", marginTop: "var(--space-4)", fontSize: "var(--text-sm)", color: "var(--color-muted)" } as const;
const inputStyle = { width: "100%", marginTop: "var(--space-1)", boxSizing: "border-box" } as const;
