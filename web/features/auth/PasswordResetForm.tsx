"use client";

/**
 * PasswordResetForm — the "set new password" form on the /reset page.
 *
 * Lifecycle:
 *   1. /reset?token=<plain-token> route renders this component, passing the URL token in.
 *   2. User types a new password + confirmation. Zod validates length + match locally.
 *   3. On submit we POST to /api/auth/password/reset-confirm. The BE looks up the token
 *      by SHA-256 hash, checks not-used + not-expired, bcrypts the new password, and
 *      marks the token used. All three failure modes collapse to INVALID_TOKEN — the user
 *      sees a generic "invalid or expired" message rather than a precise reason, so an
 *      attacker who steals a token link can't probe for which step failed.
 *   4. Success state shows a brief confirmation, then redirects to "/".
 *
 * Why not auto-redirect immediately on success? Showing the success message for ~1.5s
 * gives the user visual confirmation that the action worked before the URL changes. This
 * matches password-reset UX in most B2B SaaS apps.
 *
 * Why a separate "confirmPassword" field? Pure UX safety net — we don't trust users to
 * type a 6+ char password correctly on the first try when they can't see what they're
 * typing. The two fields are checked for equality in the zod schema's .refine().
 *
 * TODO:phase-1.6 add a "show password" toggle (eye icon) for accessibility.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { confirmPasswordReset } from "@/services/api";
import {
  resetConfirmSchema,
  type ResetConfirmFormValues,
} from "./passwordResetSchema";

interface PasswordResetFormProps {
  // The plain reset token from the email link (?token=...). Validated at the BE.
  token: string;
}

export function PasswordResetForm({ token }: PasswordResetFormProps) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string>("");
  const [isComplete, setIsComplete] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetConfirmFormValues>({
    resolver: zodResolver(resetConfirmSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const onSubmit = handleSubmit(async ({ newPassword }) => {
    setSubmitError("");
    try {
      await confirmPasswordReset(token, newPassword);
      setIsComplete(true);
      // Redirect after a short pause so the user sees the success state.
      setTimeout(() => router.push("/"), 1500);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Reset failed. Try again.",
      );
    }
  });

  if (isComplete) {
    return (
      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          Password updated. Redirecting…
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="newPassword">New password</Label>
        <Input
          id="newPassword"
          type="password"
          placeholder="At least 6 characters"
          aria-invalid={errors.newPassword ? "true" : "false"}
          {...register("newPassword")}
        />
        {errors.newPassword && (
          <p className="text-sm text-destructive">
            {errors.newPassword.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm new password</Label>
        <Input
          id="confirmPassword"
          type="password"
          aria-invalid={errors.confirmPassword ? "true" : "false"}
          {...register("confirmPassword")}
        />
        {errors.confirmPassword && (
          <p className="text-sm text-destructive">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      {submitError && (
        <p className="text-sm text-destructive">{submitError}</p>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Updating…" : "Set new password"}
      </Button>
    </form>
  );
}
