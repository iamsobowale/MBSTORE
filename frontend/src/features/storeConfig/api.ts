import { api } from "../../lib/api";

/** Mirrors the backend StoreSettingsDto. */
export interface StoreSettings {
  brandName: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
}

const CACHE_KEY = "mb_store_settings";

export async function fetchStoreSettings(): Promise<StoreSettings> {
  const { data } = await api.get<StoreSettings>("/store-config");
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch {}
  return data;
}

export function getCachedStoreSettings(): StoreSettings | undefined {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : undefined;
  } catch { return undefined; }
}

export async function updateStoreSettings(
  payload: StoreSettings,
): Promise<StoreSettings> {
  const { data } = await api.put<StoreSettings>("/store-config", payload);
  return data;
}
