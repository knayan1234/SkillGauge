import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    // Pin root to web/ — a parent directory has a pnpm-lock, which otherwise confuses workspace detection.
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
