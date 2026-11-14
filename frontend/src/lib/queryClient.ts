import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60_000,   // data is fresh for 5 min — no refetch while browsing
      gcTime: 30 * 60_000,     // keep unused cache for 30 min
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Ping the backend every 14 min to prevent Render free-tier spin-down.
const BACKEND = import.meta.env.VITE_API_BASE_URL?.replace("/api/v1", "") ?? "http://localhost:5159";
setInterval(() => fetch(`${BACKEND}/health`).catch(() => {}), 14 * 60 * 1000);
