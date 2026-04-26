"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

const SUBSCRIBE_NOOP = () => () => {};

export function ThemeToggle() {
  // SSR stays "not mounted" so the HTML is stable; the client snapshot flips on first
  // client render. Avoids the useEffect+setState mount-detection pattern that React's
  // newer rules flag as an anti-pattern.
  const mounted = useSyncExternalStore(
    SUBSCRIBE_NOOP,
    () => true,
    () => false,
  );
  const { resolvedTheme, setTheme } = useTheme();

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="sm"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="h-8 w-8 p-0"
    >
      {mounted && isDark ? (
        <Sun className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Moon className="h-4 w-4" aria-hidden="true" />
      )}
    </Button>
  );
}
