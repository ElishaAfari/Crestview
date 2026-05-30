import type { ReactNode } from "react";
import { PublicSiteFooter } from "@/components/layout/PublicSiteFooter";
import { PublicSiteHeader } from "@/components/layout/PublicSiteHeader";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-slate-950">
      <PublicSiteHeader />
      {children}
      <PublicSiteFooter />
    </div>
  );
}
