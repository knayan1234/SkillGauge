"use client";

import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type User,
  fetchMe,
  loginUser,
  logoutUser,
  registerUser,
} from "@/services/api";

type AuthResult = { success: boolean; error?: string };

interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (email: string, password: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
}

// Single react-query cache entry so any consumer (page, component) gets the same user
// reference without prop-drilling. Cleared on logout.
const AUTH_QUERY_KEY = ["auth", "current-user"] as const;

export function useAuth(): UseAuthReturn {
  const queryClient = useQueryClient();

  // /me is the source of truth — the cookie is httpOnly, so the FE can't peek at the
  // token; it must ask the server "who am I?" on mount.
  const meQuery = useQuery<User | null>({
    queryKey: AUTH_QUERY_KEY,
    queryFn: fetchMe,
    // No retry on /me: a 401 is a *valid* answer (unauthenticated), not a transient failure.
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  // Shared success handler: writing to the query cache flips isAuthenticated everywhere.
  const handleAuthSuccess = useCallback(
    ({ user: nextUser }: { user: User }) => {
      queryClient.setQueryData(AUTH_QUERY_KEY, nextUser);
    },
    [queryClient],
  );

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      loginUser(email, password),
    onSuccess: handleAuthSuccess,
  });

  const registerMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      registerUser(email, password),
    onSuccess: handleAuthSuccess,
  });

  // We always tear down local auth state — both on success and on failure — so the user
  // isn't stuck on an authenticated page if the network/BE is unreachable. The cookie is
  // httpOnly, so the only thing the FE can observe is /api/me; flipping the cache to null
  // is what flips the UI into "signed out" mode. If the server call failed, the cookie may
  // still be live for a request or two until /api/me re-validates and finds it expired.
  const tearDownAuthState = useCallback(() => {
    queryClient.setQueryData(AUTH_QUERY_KEY, null);
    // Drop all cached server state so the next user can't see the previous user's data.
    queryClient.clear();
  }, [queryClient]);

  const logoutMutation = useMutation({
    mutationFn: logoutUser,
    onSuccess: tearDownAuthState,
    onError: tearDownAuthState,
  });

  const login = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      try {
        await loginMutation.mutateAsync({ email, password });
        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Login failed",
        };
      }
    },
    [loginMutation],
  );

  const register = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      try {
        await registerMutation.mutateAsync({ email, password });
        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Registration failed",
        };
      }
    },
    [registerMutation],
  );

  const logout = useCallback(async () => {
    await logoutMutation.mutateAsync().catch(() => undefined);
  }, [logoutMutation]);

  return {
    user: meQuery.data ?? null,
    isAuthenticated: !!meQuery.data,
    isLoading:
      meQuery.isLoading ||
      loginMutation.isPending ||
      registerMutation.isPending ||
      logoutMutation.isPending,
    login,
    register,
    logout,
  };
}
