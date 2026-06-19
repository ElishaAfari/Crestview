import type { NextConfig } from "next";

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
  experimental: {
    serverActions: allowedOrigins.length ? { allowedOrigins } : undefined
  }
};

export default nextConfig;
