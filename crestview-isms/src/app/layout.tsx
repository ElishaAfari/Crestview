import type { Metadata, Viewport } from "next";
import { DM_Sans, JetBrains_Mono, Sora } from "next/font/google";
import { AuthProvider } from "@/providers/AuthProvider";
import { QueryProvider } from "@/providers/QueryProvider";
import { RealtimeProvider } from "@/providers/RealtimeProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { siteConfig } from "@/config/site";
import "./globals.css";

const sora = Sora({ subsets: ["latin"], variable: "--font-sora" });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono" });

const devCacheResetScript = `
(() => {
  const isLocal = location.hostname === "localhost" || location.hostname === "127.0.0.1";
  const key = "crestview-dev-cache-reset-v3";
  if (!isLocal || sessionStorage.getItem(key)) return;
  sessionStorage.setItem(key, "1");
  Promise.all([
    "serviceWorker" in navigator
      ? navigator.serviceWorker.getRegistrations().then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
      : Promise.resolve(),
    "caches" in window
      ? caches.keys().then((keys) => Promise.all(keys.map((cacheKey) => caches.delete(cacheKey))))
      : Promise.resolve()
  ]).then(() => {
    if (navigator.serviceWorker?.controller) location.reload();
  }).catch(() => {});
})();
`;

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`
  },
  description: siteConfig.description,
  icons: {
    icon: "/crestview-logo.png",
    shortcut: "/crestview-logo.png",
    apple: "/crestview-logo.png"
  },
  manifest: "/manifest.json"
};

export const viewport: Viewport = {
  themeColor: "#1e40af",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${sora.variable} ${dmSans.variable} ${jetbrains.variable} font-sans antialiased`}>
        {process.env.NODE_ENV === "development" ? <script dangerouslySetInnerHTML={{ __html: devCacheResetScript }} /> : null}
        <ThemeProvider>
          <QueryProvider>
            <AuthProvider>
              <RealtimeProvider>{children}</RealtimeProvider>
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
