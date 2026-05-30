"use client";

import { LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { NotificationBell } from "@/components/dashboard/NotificationBell";
import { signOutAction } from "@/features/auth/actions";
import { ROLES } from "@/config/roles";
import { useAuthStore } from "@/store/authStore";
import { useUIStore } from "@/store/uiStore";

export function TopNav() {
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);
  const profile = useAuthStore((state) => state.profile);
  const role = useAuthStore((state) => state.role);
  const displayName = profile ? `${profile.first_name} ${profile.last_name}` : "School workspace";

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/80 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={toggleSidebar} aria-label="Open navigation">
          <Menu className="size-5" aria-hidden />
        </Button>
        <div>
          <p className="text-sm font-semibold text-white">{displayName}</p>
          <p className="text-xs text-slate-400">{role ? ROLES[role].label : "Loading workspace..."}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <NotificationBell />
          <ThemeToggle />
          <form action={signOutAction}>
            <Button variant="ghost" size="icon" type="submit" aria-label="Sign out">
              <LogOut className="size-4" aria-hidden />
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
