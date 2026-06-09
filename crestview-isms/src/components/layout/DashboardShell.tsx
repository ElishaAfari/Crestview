"use client";

import type { ReactNode } from "react";
import { MobileNav } from "@/components/layout/MobileNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";
import { useAuth } from "@/hooks/useAuth";

export function DashboardShell({ children }: { children: ReactNode }) {
  useAuth();

  return (
    <div className="dashboard-theme min-h-dvh w-full overflow-x-hidden bg-[var(--portal-bg)] text-[var(--portal-text)]">
      <div className="dashboard-density-frame flex min-h-dvh w-full">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopNav />
          {children}
        </div>
        <MobileNav />
      </div>
    </div>
  );
}
