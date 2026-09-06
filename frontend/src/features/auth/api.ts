import { api } from "../../lib/api";

export interface AuthResponse {
  token: string;
  expiresAt: string;
  email: string;
  role: string;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/login", { email, password });
  return data;
}
