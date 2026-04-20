"use client";

import { type ReactNode, useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { createQueryClient } from "@/lib/queryClient";

export function Providers({ children }: { children: ReactNode }) {
  // Lazy useState init keeps the QueryClient stable across re-renders (one client per mount).
  const [queryClient] = useState(() => createQueryClient());
  return (
    // next-themes toggles `class="dark"` on <html>; disableTransitionOnChange avoids the
    // brief flicker across every color-transitioning element when the theme flips.
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ThemeProvider>
  );
}
