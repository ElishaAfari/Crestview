"use client";

import type { ReactNode } from "react";
import { MobileNav } from "@/components/layout/MobileNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";
import { useAuth } from "@/hooks/useAuth";

export function DashboardShell({ children }: { children: ReactNode }) {
  useAuth();

  return (
    <div className="dashboard-theme h-dvh w-full overflow-hidden bg-[var(--portal-bg)] text-[var(--portal-text)]">
      <div className="dashboard-density-frame flex h-full min-h-0 w-full overflow-hidden">
        <Sidebar />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <TopNav />
          <div className="dashboard-scroll-region min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {children}
          </div>
        </div>
        <MobileNav />
      </div>
    </div>
  );
}
