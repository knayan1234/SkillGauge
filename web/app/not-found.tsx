"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function NotFound() {
  const pathname = usePathname();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      pathname,
    );
  }, [pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md border-border/50">
        <CardContent className="p-8 text-center">
          <div className="mb-6 flex justify-center">
            <div className="h-16 w-16 rounded-lg bg-destructive/10 flex items-center justify-center">
              <span className="text-2xl font-bold text-destructive">404</span>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-2">
            Page Not Found
          </h1>

          <p className="text-sm text-muted-foreground mb-6">
            The page you&apos;re looking for doesn&apos;t exist or has been
            moved.
          </p>

          <Button
            onClick={() => (window.location.href = "/")}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Home className="mr-2 h-4 w-4" />
            Return to Home
          </Button>

          <p className="mt-4 text-xs text-muted-foreground/60">
            Attempted path: {pathname}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
