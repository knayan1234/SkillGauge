/**
 * 404 Not Found Page
 * Displayed when user navigates to non-existent route
 */
import { useLocation } from "react-router";
import { useEffect } from "react";
import { Home } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";

export default function NotFound() {
  const location = useLocation();

  // Log 404 errors for monitoring
  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md border-border/50">
        <CardContent className="p-8 text-center">
          {/* 404 Icon */}
          <div className="mb-6 flex justify-center">
            <div className="h-16 w-16 rounded-lg bg-destructive/10 flex items-center justify-center">
              <span className="text-2xl font-bold text-destructive">404</span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Page Not Found
          </h1>

          {/* Description */}
          <p className="text-sm text-muted-foreground mb-6">
            The page you're looking for doesn't exist or has been moved.
          </p>

          {/* Return home button */}
          <Button
            onClick={() => (window.location.href = "/")}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Home className="mr-2 h-4 w-4" />
            Return to Home
          </Button>

          {/* Path info */}
          <p className="mt-4 text-xs text-muted-foreground/60">
            Attempted path: {location.pathname}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
