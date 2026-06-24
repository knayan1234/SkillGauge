"use client";

/**
 * AuthModal — single dialog hosting login, register, and password-reset-request flows.
 *
 * State machine: one `mode` field flips between three views:
 *   - "login"    → email + password → calls useAuth().login()
 *   - "register" → email + password → calls useAuth().register()
 *   - "forgot"   → email only       → calls requestPasswordReset()
 *
 * Why all three modes inside one Dialog instead of three separate routes/components?
 *   1. Users discover "forgot password" right where the password field is — no context
 *      switch. Better than navigating to a separate page just to type an email.
 *   2. Three small forms in one shell means we share the Dialog frame, the title/desc
 *      block, and the visual styling. One source of truth for "auth UI."
 *   3. State doesn't need to round-trip through the URL — the modal is ephemeral by
 *      design. A separate /forgot route would feel heavier for a one-input form.
 *
 * After a "forgot" submit we show a deliberately opaque success message ("If that email
 * exists, a reset link has been sent...") regardless of whether the email is registered.
 * This matches the BE's no-enumeration policy — never expose whether an email is in our
 * user table, since that's a recon vector for credential-stuffing attackers.
 *
 * The mode switcher is at the bottom of each form view. switchToForgot/switchToLogin/
 * switchToRegister all reset both forms and the error state to avoid stale UI artifacts.
 *
 * TODO: wire useAuth's logout into the user menu in AppLayout (this modal doesn't need
 * a logout entry — it's only shown when the user is signed-out).
 * TODO: strip the demo defaults (demo@skillgauge.ai / password123) before public deploy
 * — they're a local-evaluation convenience only.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { authSchema, type AuthFormValues } from "./authSchema";
import {
  resetRequestSchema,
  type ResetRequestFormValues,
} from "./passwordResetSchema";
import { requestPasswordReset } from "@/services/api";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Modal mode-machine: login → register flips with a toggle. "forgot" is a separate inline
// view for the password-reset request form. Kept inline so users don't lose the modal
// context (and so we don't add a second route just for entering an email).
type Mode = "login" | "register" | "forgot";

export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const [mode, setMode] = useState<Mode>("login");
  const [submitError, setSubmitError] = useState("");
  // After a forgot-password submit we show an opaque success message — same text whether
  // or not the email exists, matching the BE's no-enumeration policy.
  const [forgotSubmitted, setForgotSubmitted] = useState(false);
  const { login, register: registerUser, isLoading } = useAuth();
  const router = useRouter();

  const authForm = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    // Demo creds prefilled for easy evaluation.
    // TODO: remove the demo defaults before public deploy.
    defaultValues: {
      email: "demo@skillgauge.ai",
      password: "password123",
    },
  });

  const forgotForm = useForm<ResetRequestFormValues>({
    resolver: zodResolver(resetRequestSchema),
    defaultValues: { email: "" },
  });

  const onAuthSubmit = authForm.handleSubmit(async ({ email, password }) => {
    setSubmitError("");
    const result =
      mode === "login"
        ? await login(email, password)
        : await registerUser(email, password);

    if (result.success) {
      // Modal closes on success, so a top-right toast is the only confirmation surface
      // the user has between submit and the /setup redirect. Keep the inline error path
      // for failures — inside the still-open modal, inline is more visible than a toast.
      toast.success(mode === "login" ? "Signed in" : "Account created", {
        description:
          mode === "login"
            ? "Welcome back — let's pick up where you left off."
            : "Your interview prep workspace is ready.",
      });
      onOpenChange(false);
      // Land on the authenticated workspace, not directly into setup. Returning users
      // see their chat history sidebar + a "Start new session" CTA so they can pick
      // up an old chatroom or begin a fresh one in a single click.
      router.push("/sessions");
    } else {
      setSubmitError(result.error || "Authentication failed");
    }
  });

  const onForgotSubmit = forgotForm.handleSubmit(async ({ email }) => {
    setSubmitError("");
    try {
      await requestPasswordReset(email);
    } catch (err) {
      // Even on transport errors, we deliberately show the same opaque success screen
      // for non-API errors (e.g., offline). For API errors we'd surface them, but the
      // BE always returns 200 here so this catch is mostly defensive.
      setSubmitError(
        err instanceof Error ? err.message : "Couldn't reach the server.",
      );
      return;
    }
    setForgotSubmitted(true);
  });

  const switchToLogin = () => {
    setMode("login");
    setSubmitError("");
    setForgotSubmitted(false);
    authForm.reset({ email: "demo@skillgauge.ai", password: "password123" });
  };

  const switchToRegister = () => {
    setMode("register");
    setSubmitError("");
    setForgotSubmitted(false);
    authForm.reset({ email: "demo@skillgauge.ai", password: "password123" });
  };

  const switchToForgot = () => {
    setMode("forgot");
    setSubmitError("");
    setForgotSubmitted(false);
    forgotForm.reset({ email: "" });
  };

  // Header text varies by mode — extracted so the JSX stays scannable.
  const titles: Record<Mode, { title: string; description: string }> = {
    login: {
      title: "Welcome back",
      description: "Sign in to continue your interview practice",
    },
    register: {
      title: "Create account",
      description: "Start your AI-powered interview preparation",
    },
    forgot: {
      title: "Reset your password",
      description: "Enter your account email and we'll send you a reset link.",
    },
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{titles[mode].title}</DialogTitle>
          <DialogDescription>{titles[mode].description}</DialogDescription>
        </DialogHeader>

        {mode !== "forgot" && (
          <form onSubmit={onAuthSubmit} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                aria-invalid={
                  authForm.formState.errors.email ? "true" : "false"
                }
                {...authForm.register("email")}
              />
              {authForm.formState.errors.email && (
                <p className="text-sm text-destructive">
                  {authForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                aria-invalid={
                  authForm.formState.errors.password ? "true" : "false"
                }
                {...authForm.register("password")}
              />
              {authForm.formState.errors.password && (
                <p className="text-sm text-destructive">
                  {authForm.formState.errors.password.message}
                </p>
              )}
            </div>

            {submitError && (
              <p className="text-sm text-destructive">{submitError}</p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || authForm.formState.isSubmitting}
            >
              {isLoading || authForm.formState.isSubmitting
                ? "Please wait..."
                : mode === "login"
                  ? "Sign in"
                  : "Create account"}
            </Button>

            {mode === "login" && (
              <div className="text-center text-sm">
                <button
                  type="button"
                  onClick={switchToForgot}
                  className="text-primary hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <div className="text-center text-sm">
              <span className="text-muted-foreground">
                {mode === "login"
                  ? "Don't have an account? "
                  : "Already have an account? "}
              </span>
              <button
                type="button"
                onClick={mode === "login" ? switchToRegister : switchToLogin}
                className="text-primary hover:underline font-medium"
              >
                {mode === "login" ? "Sign up" : "Sign in"}
              </button>
            </div>
          </form>
        )}

        {mode === "forgot" && !forgotSubmitted && (
          <form onSubmit={onForgotSubmit} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="forgot-email">Email</Label>
              <Input
                id="forgot-email"
                type="email"
                placeholder="you@example.com"
                aria-invalid={
                  forgotForm.formState.errors.email ? "true" : "false"
                }
                {...forgotForm.register("email")}
              />
              {forgotForm.formState.errors.email && (
                <p className="text-sm text-destructive">
                  {forgotForm.formState.errors.email.message}
                </p>
              )}
            </div>

            {submitError && (
              <p className="text-sm text-destructive">{submitError}</p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={forgotForm.formState.isSubmitting}
            >
              {forgotForm.formState.isSubmitting
                ? "Sending..."
                : "Send reset link"}
            </Button>

            <div className="text-center text-sm">
              <button
                type="button"
                onClick={switchToLogin}
                className="text-primary hover:underline"
              >
                Back to sign in
              </button>
            </div>
          </form>
        )}

        {mode === "forgot" && forgotSubmitted && (
          <div className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">
              If that email exists, a password reset link has been sent. Check
              your inbox (or your terminal logs in dev mode).
            </p>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={switchToLogin}
            >
              Back to sign in
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
