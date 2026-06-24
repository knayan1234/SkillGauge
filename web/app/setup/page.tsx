"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/AppLayout";
import { SessionSetupForm } from "@/features/session-setup/SessionSetupForm";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

export default function SessionSetupPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="min-h-[calc(100dvh-3.5rem)] flex items-center justify-center">
          <div className="h-6 w-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-[calc(100dvh-3.5rem)] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg animate-slide-up">
          <Card className="border-primary/20 bg-card/50 backdrop-blur-sm shadow-lg shadow-primary/10">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-xl font-semibold">
                Start a new session
              </CardTitle>
              <CardDescription>
                Upload your resume and paste the job description
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <SessionSetupForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
