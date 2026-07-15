import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // "standalone" is required for the Docker/ICR build.
  // When VERCEL=1 (set automatically by Vercel), we omit it so Vercel's build works.
  ...(process.env.VERCEL ? {} : { output: "standalone" }),
};

export default nextConfig;
