import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@mb.local");
  const [password, setPassword] = useState("");
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
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "var(--color-surface)" }}>
      <form onSubmit={submit} style={{ width: 360, background: "var(--color-bg)", padding: "var(--space-8)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-md)" }}>
        <h1 style={{ fontSize: "var(--text-xl)", marginTop: 0 }}>MB Admin</h1>
        <p style={{ color: "var(--color-muted)", marginTop: 0, fontSize: "var(--text-sm)" }}>Sign in to manage your store.</p>

        <label style={labelStyle}>Email</label>
        <input style={inputStyle} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

        <label style={labelStyle}>Password</label>
        <input style={inputStyle} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />

        {error && <div style={{ color: "var(--color-danger)", marginTop: "var(--space-3)", fontSize: "var(--text-sm)" }}>{error}</div>}

        <button type="submit" disabled={loading} style={buttonStyle}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

const labelStyle = { display: "block", marginTop: "var(--space-4)", fontSize: "var(--text-sm)", color: "var(--color-muted)" } as const;
const inputStyle = { width: "100%", padding: "var(--space-2)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", marginTop: "var(--space-1)" } as const;
const buttonStyle = { width: "100%", marginTop: "var(--space-6)", padding: "var(--space-3)", background: "var(--color-primary)", color: "var(--color-accent)", border: "none", borderRadius: "var(--radius-sm)", fontWeight: 700, cursor: "pointer" } as const;
