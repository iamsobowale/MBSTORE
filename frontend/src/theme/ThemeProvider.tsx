import { useQuery } from "@tanstack/react-query";
import { useEffect, type ReactNode } from "react";
import { fetchStoreSettings, type StoreSettings } from "../features/storeConfig/api";

/**
 * Fetches store branding + theme and applies it as CSS variables on :root, so the
 * entire storefront is themed from admin configuration — no hardcoded brand colors.
 * Falls back to the default black & white tokens in theme.css while loading.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const { data } = useQuery({
    queryKey: ["store-settings"],
    queryFn: fetchStoreSettings,
  });

  useEffect(() => {
    if (!data) return;
    applyTheme(data);
    if (data.brandName) document.title = data.brandName;
    if (data.faviconUrl) setFavicon(data.faviconUrl);
  }, [data]);

  return <>{children}</>;
}

function applyTheme(s: StoreSettings) {
  const root = document.documentElement.style;
  root.setProperty("--color-primary", s.primaryColor);
  root.setProperty("--color-secondary", s.secondaryColor);
  root.setProperty("--color-bg", s.backgroundColor);
  root.setProperty("--color-text", s.textColor);
  root.setProperty("--color-accent", s.accentColor);
}

function setFavicon(url: string) {
  let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.href = url;
}
