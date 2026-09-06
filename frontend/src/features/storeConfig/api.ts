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

export async function fetchStoreSettings(): Promise<StoreSettings> {
  const { data } = await api.get<StoreSettings>("/store-config");
  return data;
}

export async function updateStoreSettings(
  payload: StoreSettings,
): Promise<StoreSettings> {
  const { data } = await api.put<StoreSettings>("/store-config", payload);
  return data;
}
