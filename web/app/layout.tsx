import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "SkillGauge",
  description: "AI-powered interview preparation platform",
};

// themeColor must live on `viewport`, not `metadata` — Next 16 warns and ignores it otherwise.
// Matched to the active theme: `#fafaf8` is the light-mode `--color-background`, `#0d1018`
// is the dark-mode equivalent. The `media` discriminator lets the OS chrome (mobile address
// bar, PWA chrome) reflect the user's preferred scheme even before next-themes hydrates.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf8" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1018" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap"
        />
      </head>
      <body suppressHydrationWarning className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
