import type { NextConfig } from "next";
import { referenceRouteAliases } from "./src/config/referenceRouteAliases";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ? new URL(process.env.NEXT_PUBLIC_APP_URL).host : undefined;
const vercelUrl = process.env.VERCEL_URL;
const allowedOrigins = [appUrl, vercelUrl].filter((origin): origin is string => Boolean(origin));

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: process.cwd(),
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "*.supabase.co" }
    ]
  },
  async rewrites() {
    return Object.entries(referenceRouteAliases).map(([source, destination]) => ({ source, destination }));
  },
  experimental: {
    serverActions: allowedOrigins.length ? { allowedOrigins } : undefined
  }
};

export default nextConfig;
