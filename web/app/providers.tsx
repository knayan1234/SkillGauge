"use client";

import { type ReactNode, useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider, useTheme } from "next-themes";
import { Toaster } from "sonner";
import { AuthModalProvider } from "@/components/AuthModalProvider";
import { createQueryClient } from "@/lib/queryClient";

// Bridges next-themes' resolved theme into sonner's `theme` prop so toasts honour
// dark/light/system without a flash. Kept inline (not its own file) — it's a five-line
// glue component with one consumer.
function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  return (
    <Toaster
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      richColors
      closeButton
      // Top-center keeps toasts away from the right-side header controls (sign in,
      // theme toggle, dashboard link) and clear of any dialog footers that anchor
      // their primary action on the right. Top is preferred over bottom because the
      // chat input bar lives at the bottom of /interview.
      position="top-center"
    />
  );
}

export function Providers({ children }: { children: ReactNode }) {
  // Lazy useState init keeps the QueryClient stable across re-renders (one client per mount).
  const [queryClient] = useState(() => createQueryClient());
  return (
    // next-themes toggles `class="dark"` on <html>; disableTransitionOnChange avoids the
    // brief flicker across every color-transitioning element when the theme flips.
    // Provider order matters: AuthModalProvider lives inside QueryClientProvider because
    // the AuthModal renders useAuth() which uses useQuery. Inside ThemeProvider so the
    // modal styles match the active theme.
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <AuthModalProvider>{children}</AuthModalProvider>
        <ThemedToaster />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
