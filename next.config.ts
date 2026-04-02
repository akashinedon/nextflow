import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Project directory (this file lives at repo root). Fixes Turbopack picking a parent lockfile. */
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
  // Allow images from external hostnames used by Transloadit / demo
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.transloadit.com" },
      { protocol: "https", hostname: "**.tlcdn.com" },
      { protocol: "https", hostname: "**.s3.amazonaws.com" },
      { protocol: "https", hostname: "**.cloudfront.net" },
    ],
  },
  // Required for @xyflow/react server-side compatibility
  experimental: {
    optimizePackageImports: ["lucide-react", "@xyflow/react"],
  },
};

export default nextConfig;
