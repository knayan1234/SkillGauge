/**
 * Root Layout Component
 * Main application shell with error boundary
 * Configures fonts, meta tags, and global styles
 */
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import "./styles/app.css";

/**
 * Link tags for fonts and favicons
 */
export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
  {
    rel: "icon",
    href: "/SkillGauge-svg.svg",
    type: "image/svg+xml",
    sizes: "192*192",
  },
  { rel: "apple-touch-icon", href: "/SkillGauge-svg.svg", sizes: "64x64" },
];

/**
 * Root layout wrapper
 * Applies dark theme by default
 */
export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta
          name="description"
          content="AI-powered interview preparation platform"
        />
        <meta name="theme-color" content="#0a0e1a" />
        <Meta />
        <Links />
      </head>
      <body suppressHydrationWarning className="antialiased">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

/**
 * Main app component
 */
export default function App() {
  return <Outlet />;
}

/**
 * Error boundary for handling route errors and 404s
 */
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-4xl font-bold text-foreground mb-4">{message}</h1>
        <p className="text-muted-foreground mb-6">{details}</p>
        {stack && (
          <pre className="w-full p-4 overflow-x-auto bg-card border border-border rounded-lg text-left text-xs">
            <code>{stack}</code>
          </pre>
        )}
        <a
          href="/"
          className="inline-block mt-6 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Return Home
        </a>
      </div>
    </main>
  );
}
