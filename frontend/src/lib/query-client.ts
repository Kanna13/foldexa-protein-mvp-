import { QueryClient } from "@tanstack/react-query";

/**
 * Global singleton QueryClient with production-tuned defaults.
 *
 * staleTime: 4_000   — data fresh for 4s → prevents burst refetches on rapid
 *                       re-mounts (e.g. StrictMode double-render).
 * retry: 1           — one automatic retry on error, then surface to ErrorBoundary.
 * refetchOnWindowFocus — auto-refresh when user tabs back (free UX win).
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 4_000,
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
});
