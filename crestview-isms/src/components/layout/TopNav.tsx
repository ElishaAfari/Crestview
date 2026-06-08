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
    <header className="sticky top-0 z-30 border-b border-[var(--portal-border)] bg-[var(--portal-shell)] px-2 py-2.5 backdrop-blur sm:px-6 sm:py-3 lg:px-8">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <Button variant="ghost" size="icon" className="shrink-0 lg:hidden" onClick={toggleSidebar} aria-label="Open navigation">
          <Menu className="size-5" aria-hidden />
        </Button>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[var(--portal-text)]">{displayName}</p>
          <p className="truncate text-xs text-[var(--portal-muted)]">{role ? ROLES[role].label : "Loading workspace..."}</p>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-2">
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
