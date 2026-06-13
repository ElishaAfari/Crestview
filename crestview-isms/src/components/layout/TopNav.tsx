"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { LogOut, Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { NotificationBell } from "@/components/dashboard/NotificationBell";
import { signOutAction } from "@/features/auth/actions";
import { navigationItems } from "@/config/navigation";
import { ROLES } from "@/config/roles";
import { useAuthStore } from "@/store/authStore";
import { useUIStore } from "@/store/uiStore";

export function TopNav() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);
  const profile = useAuthStore((state) => state.profile);
  const role = useAuthStore((state) => state.role);
  const displayName = profile ? `${profile.first_name} ${profile.last_name}` : "School workspace";
  const today = new Intl.DateTimeFormat("en-GH", { weekday: "short", month: "short", day: "2-digit" }).format(new Date());
  const avatarSrc = profile?.avatar_url?.startsWith("/") ? profile.avatar_url : "/crestview-logo.png";
  const roleItems = role ? navigationItems.filter((item) => item.roles.includes(role)) : [];

  function routeForSearch(query: string) {
    const normalized = query.trim().toLowerCase();
    const direct = roleItems.find((item) => {
      const title = item.title.toLowerCase();
      return normalized.includes(title) || title.includes(normalized);
    });
    if (direct) return direct.href;

    if (role === "super_admin" || role === "school_admin") {
      if (/(admission|applicant|enrol|enroll)/.test(normalized)) return "/admin/admissions";
      if (/(staff|teacher|employee)/.test(normalized)) return "/admin/staff";
      if (/(recruit|candidate|job)/.test(normalized)) return "/admin/recruitment";
      if (/(fee|invoice|bill|payment)/.test(normalized)) return "/admin/fees";
      if (/(grade|score|report card|assessment|subject)/.test(normalized)) return "/admin/grades";
      if (/(attendance|present|absent|late)/.test(normalized)) return "/admin/attendance";
      if (/(report|summary|pdf)/.test(normalized)) return "/admin/reports";
      return "/admin/students";
    }
    if (role === "teacher") {
      if (/(attendance|present|absent|late)/.test(normalized)) return "/teacher/attendance";
      if (/(grade|score|assessment|subject|report)/.test(normalized)) return "/teacher/grades";
      if (/(assignment|homework)/.test(normalized)) return "/teacher/assignments";
      return "/teacher/classes";
    }
    if (role === "student") {
      if (/(assignment|homework)/.test(normalized)) return "/student/assignments";
      if (/(attendance|present|absent|late)/.test(normalized)) return "/student/attendance";
      return "/student/grades";
    }
    if (role === "parent") {
      if (/(fee|invoice|bill|payment)/.test(normalized)) return "/parent/fees";
      if (/(message|chat)/.test(normalized)) return "/parent/messages";
      return "/parent/children";
    }
    return roleItems[0]?.href ?? "/admin";
  }

  function onSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = search.trim();
    if (!query) return;
    router.push(`${routeForSearch(query)}?q=${encodeURIComponent(query)}`);
  }

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--portal-border)] bg-[var(--portal-surface)]/95 px-3 py-3 shadow-[0_8px_28px_-26px_rgba(7,55,127,0.65)] backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <Button variant="ghost" size="icon" className="shrink-0 lg:hidden" onClick={toggleSidebar} aria-label="Open navigation">
          <Menu className="size-5" aria-hidden />
        </Button>
        <div className="hidden min-w-0 sm:block">
          <p className="truncate text-sm font-black text-[var(--portal-text)]">{role ? ROLES[role].label : "Workspace"}</p>
          <p className="truncate text-xs font-black text-[var(--portal-muted)]">{today}</p>
        </div>
        <form onSubmit={onSearchSubmit} className="portal-field mx-auto hidden w-full max-w-xl items-center gap-2 rounded-lg border border-[var(--portal-border)] bg-[var(--portal-surface-strong)] px-3 py-2 md:flex">
          <Search className="size-4 shrink-0 text-blue-700 dark:text-blue-200" aria-hidden />
          <input
            aria-label="Search workspace"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-7 min-w-0 flex-1 bg-transparent text-sm font-semibold text-[var(--portal-text)] outline-none placeholder:font-semibold placeholder:text-[var(--portal-muted)]"
            placeholder="Search students, staff, events..."
            type="search"
          />
        </form>
        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          <NotificationBell />
          <ThemeToggle />
          <div className="portal-subtle-card hidden items-center gap-3 rounded-lg px-2 py-1.5 sm:flex">
            <span className="relative size-9 overflow-hidden rounded-lg bg-white">
              <Image src={avatarSrc} alt="" fill sizes="36px" className="object-contain p-1" />
            </span>
            <span className="min-w-0 pr-1">
              <span className="block max-w-36 truncate text-sm font-bold text-[var(--portal-text)]">{displayName}</span>
              <span className="block truncate text-[11px] font-black text-[var(--portal-muted)]">{role ? ROLES[role].label : "Loading"}</span>
            </span>
          </div>
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
