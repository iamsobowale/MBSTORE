import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { setAuthToken } from "../../lib/api";
import { login as loginApi, type AuthResponse } from "./api";

interface AuthState {
  token: string | null;
  email: string | null;
  role: string | null;
}

interface AuthContextValue extends AuthState {
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const STORAGE_KEY = "mb_admin_auth";
const AuthContext = createContext<AuthContextValue | null>(null);

function loadInitial(): AuthState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AuthResponse;
      // Drop expired sessions on load.
      if (new Date(parsed.expiresAt) > new Date()) {
        setAuthToken(parsed.token);
        return { token: parsed.token, email: parsed.email, role: parsed.role };
      }
    }
  } catch {
    /* ignore malformed storage */
  }
  return { token: null, email: null, role: null };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(loadInitial);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      isAuthenticated: !!state.token,
      login: async (email, password) => {
        const res = await loginApi(email, password);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(res));
        setAuthToken(res.token);
        setState({ token: res.token, email: res.email, role: res.role });
      },
      logout: () => {
        localStorage.removeItem(STORAGE_KEY);
        setAuthToken(null);
        setState({ token: null, email: null, role: null });
      },
    }),
    [state],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
