import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produces a self-contained build in .next/standalone — required for the Docker image.
  // Only the files needed to run the app are copied; node_modules are not duplicated.
  output: "standalone",
};

export default nextConfig;
