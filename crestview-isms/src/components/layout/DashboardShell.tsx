"use client";

import type { ReactNode } from "react";
import { MobileNav } from "@/components/layout/MobileNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";
import { useAuth } from "@/hooks/useAuth";

export function DashboardShell({ children }: { children: ReactNode }) {
  useAuth();

  return (
    <div className="dashboard-theme flex min-h-screen bg-[var(--portal-bg)] text-[var(--portal-text)]">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col pb-20 lg:pb-0">
        <TopNav />
        {children}
      </div>
      <MobileNav />
    </div>
  );
}
