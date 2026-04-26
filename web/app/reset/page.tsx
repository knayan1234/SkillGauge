"use client";

/**
 * /reset — destination of the password reset email link.
 *
 * The user receives a link of the form `/reset?token=<64-hex-chars>` from the email
 * (today: from stdout in dev mode; production swaps to a real mail provider). This page
 * pulls the token out of the URL and hands it to PasswordResetForm.
 *
 * Defensive UI: if the user lands here without a `token` query param (e.g., they typed
 * /reset directly, or copied only part of the email link), we show a friendly "link
 * broken" message instead of a blank form. The BE would reject an empty token anyway,
 * but failing fast on the FE is better UX.
 *
 * Why "use client"? useSearchParams is a client-only hook in Next 16's App Router.
 * Server components can't read URL params on the request side because of statically
 * optimized rendering — they'd need a dynamic route segment instead.
 *
 * Why the Suspense boundary? Next 16 requires any component using useSearchParams to be
 * wrapped in Suspense, otherwise the entire route opts out of static rendering globally.
 * The boundary isolates the dynamic concern to just this subtree.
 */

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { LinkIcon } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { PasswordResetForm } from "@/features/auth/PasswordResetForm";

function ResetPageContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-slide-up">
        <Card className="border-primary/20 bg-card/50 backdrop-blur-sm shadow-lg shadow-primary/10">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl font-semibold">
              Set a new password
            </CardTitle>
            <CardDescription>
              {token
                ? "Choose a new password for your account."
                : "This reset link is missing or invalid."}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {token ? (
              <PasswordResetForm token={token} />
            ) : (
              <EmptyState
                icon={LinkIcon}
                title="This reset link looks broken"
                description="Make sure you used the most recent link. They expire 30 minutes after they're issued. You can request a new one from the sign-in dialog."
                action={
                  <Button asChild variant="outline" size="sm">
                    <Link href="/">Back to home</Link>
                  </Button>
                }
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Suspense boundary required by Next 16 because useSearchParams() is dynamic — without
// it, the route must opt out of static rendering globally.
export default function ResetPage() {
  return (
    <AppLayout>
      <Suspense fallback={null}>
        <ResetPageContent />
      </Suspense>
    </AppLayout>
  );
}
