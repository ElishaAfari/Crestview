declare module "next-pwa" {
  import type { NextConfig } from "next";

  type RuntimeCachingRule = {
    urlPattern: RegExp;
    handler: "NetworkFirst" | "CacheFirst" | "StaleWhileRevalidate" | "NetworkOnly" | "CacheOnly";
    options?: {
      cacheName?: string;
      expiration?: {
        maxEntries?: number;
        maxAgeSeconds?: number;
      };
    };
  };

  type PWAOptions = {
    dest: string;
    disable?: boolean;
    register?: boolean;
    skipWaiting?: boolean;
    runtimeCaching?: RuntimeCachingRule[];
  };

  export default function withPWA(options: PWAOptions): (config: NextConfig) => NextConfig;
}
