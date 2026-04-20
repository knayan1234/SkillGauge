import { QueryClient } from "@tanstack/react-query";

// Factory (not a singleton): Next SSR needs one client per request so server-rendered state
// never leaks across users. Defaults are tuned for Phase 0 mock latency — revisit in Phase 1.
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}
