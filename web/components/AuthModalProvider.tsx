"use client";

/**
 * Global host for the AuthModal so any descendant can open it via `useAuthModal().open()`.
 *
 * Phase 1.6a refactor:
 * Before — every page that needed sign-in (landing page only, in Phase 1) hosted its own
 * `useState + <AuthModal>` pair. Adding a "Sign in" button to the persistent header would
 * have meant either prop-drilling the toggle through AppLayout → UserMenu, or rendering a
 * second AuthModal instance.
 * After — a single provider owns the modal state. Any component (UserMenu, landing page
 * "Get started" button, future settings page) calls `useAuthModal().open()` and the
 * single shared modal opens. Eliminates state duplication and prop-drilling.
 *
 * Position in the tree: must sit INSIDE QueryClientProvider (the AuthModal calls useAuth
 * which calls useQuery) and ThemeProvider (so the modal styles match theme). Wired in
 * `app/providers.tsx`.
 *
 * TODO:phase-1.6c add a similar provider for any future global toast / notification
 * surface so we don't proliferate context providers per concern.
 */

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { AuthModal } from "@/features/auth/AuthModal";

interface AuthModalContextValue {
  /** Opens the modal in login mode. The modal handles register/forgot toggles internally. */
  open: () => void;
}

// Default value throws on misuse — better than silently failing if a component is rendered
// outside the provider tree (which would happen if someone forgot to wrap in providers.tsx).
const AuthModalContext = createContext<AuthModalContextValue | null>(null);

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);

  return (
    <AuthModalContext.Provider value={{ open }}>
      {children}
      <AuthModal open={isOpen} onOpenChange={setIsOpen} />
    </AuthModalContext.Provider>
  );
}

export function useAuthModal(): AuthModalContextValue {
  const ctx = useContext(AuthModalContext);
  if (!ctx) {
    throw new Error(
      "useAuthModal must be used inside <AuthModalProvider> (see app/providers.tsx)",
    );
  }
  return ctx;
}
