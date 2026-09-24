"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { CircleHelp, LogOut, Menu, Search, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { NotificationBell } from "@/components/dashboard/NotificationBell";
import { signOutAction } from "@/features/auth/actions";
import { navigationItems } from "@/config/navigation";
import { isAdminRole, ROLES } from "@/config/roles";
import { useAuthStore } from "@/store/authStore";
import { useUIStore } from "@/store/uiStore";
import { getSuiteNavigation } from "@/config/suiteNavigation";
import { CampusStatus } from "@/components/layout/CampusStatus";

export function TopNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);
  const profile = useAuthStore((state) => state.profile);
  const role = useAuthStore((state) => state.role);
  const displayName = profile
    ? `${profile.first_name} ${profile.last_name}`
    : "School workspace";
  const today = new Intl.DateTimeFormat("en-GH", {
    weekday: "short",
    month: "short",
    day: "2-digit",
  }).format(new Date());
  const avatarSrc = profile?.avatar_url?.startsWith("/")
    ? profile.avatar_url
    : "/crestview-logo.png";
  const roleItems = role
    ? navigationItems.filter((item) => item.roles.includes(role))
    : [];
  const currentTitle = useMemo(() => {
    const links = getSuiteNavigation(role).flatMap((group) => group.links);
    return (
      links.find((link) => {
        const href = link.href.split("?")[0];
        return pathname === href || pathname.startsWith(`${href}/`);
      })?.title ?? "Dashboard"
    );
  }, [pathname, role]);

  useEffect(() => {
    function focusSearch(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  function routeForSearch(query: string) {
    const normalized = query.trim().toLowerCase();
    const direct = roleItems.find((item) => {
      const title = item.title.toLowerCase();
      return normalized.includes(title) || title.includes(normalized);
    });
    if (direct) return direct.href;

    if (isAdminRole(role)) {
      if (/(admission|applicant|enrol|enroll)/.test(normalized))
        return "/admin/admissions";
      if (
        /(front desk|visitor|walk.?in|enquiry|inquiry|complaint|reception)/.test(
          normalized,
        )
      )
        return "/front-office";
      if (
        /(notice|announcement|communication|email|sms|message|campaign)/.test(
          normalized,
        )
      )
        return "/communication";
      if (
        /(audit|approval|queue|readiness|integration|system job|platform health|log)/.test(
          normalized,
        )
      )
        return "/platform-audit";
      if (/(staff|teacher|employee)/.test(normalized)) return "/admin/staff";
      if (/(recruit|candidate|job)/.test(normalized))
        return "/admin/recruitment";
      if (/(id card|card|qr|badge|verify)/.test(normalized)) return "/id-cards";
      if (/(cashier|receipt|bursary|cash shift)/.test(normalized))
        return "/bursary";
      if (
        /(ledger|accounting|journal|chart of account|bank|supplier|vendor|fiscal)/.test(
          normalized,
        )
      )
        return "/accounting";
      if (/(feeding|meal|canteen|lunch)/.test(normalized)) return "/feeding";
      if (/(extra class|extra lesson|after school|remedial)/.test(normalized))
        return "/extra-classes";
      if (/(boarding|dorm|house|roll call|exeat|sick bay)/.test(normalized))
        return "/boarding";
      if (/(fee|invoice|bill|payment)/.test(normalized)) return "/admin/fees";
      if (/(grade|score|report card|assessment|subject)/.test(normalized))
        return "/admin/grades";
      if (/(attendance|present|absent|late)/.test(normalized))
        return "/admin/attendance";
      if (/(report|summary|pdf)/.test(normalized)) return "/admin/reports";
      if (
        /(preschool|kg|kindergarten|pickup|observation|daily log)/.test(
          normalized,
        )
      )
        return "/preschool";
      if (
        /(scheme|lesson|curriculum|syllabus|material|timetable)/.test(
          normalized,
        )
      )
        return "/academics-office";
      if (/(exam|examination|window|invigilat)/.test(normalized))
        return "/exams";
      if (
        /(care|wellbeing|wellness|behavio|discipline|medical|safeguard)/.test(
          normalized,
        )
      )
        return "/learner-care";
      if (/(transport|route|bus|vehicle|trip|stop)/.test(normalized))
        return "/transport";
      if (/(inventory|stock|asset|supply|procurement)/.test(normalized))
        return "/inventory";
      return "/admin/students";
    }
    if (role === "teacher") {
      if (/(attendance|present|absent|late)/.test(normalized))
        return "/teacher/attendance";
      if (/(grade|score|assessment|subject|report)/.test(normalized))
        return "/teacher/grades";
      if (/(assignment|homework)/.test(normalized))
        return "/teacher/assignments";
      if (
        /(scheme|lesson|curriculum|syllabus|material|timetable)/.test(
          normalized,
        )
      )
        return "/academics-office";
      if (/(exam|examination|window|invigilat)/.test(normalized))
        return "/exams";
      if (
        /(care|wellbeing|wellness|behavio|discipline|medical|safeguard)/.test(
          normalized,
        )
      )
        return "/learner-care";
      if (
        /(preschool|kg|kindergarten|pickup|observation|daily log)/.test(
          normalized,
        )
      )
        return "/preschool";
      if (/(extra class|extra lesson|after school|remedial)/.test(normalized))
        return "/extra-classes";
      if (/(boarding|dorm|house|roll call|exeat|sick bay)/.test(normalized))
        return "/boarding";
      return "/teacher/classes";
    }
    if (role === "student") {
      if (/(assignment|homework)/.test(normalized))
        return "/student/assignments";
      if (/(attendance|present|absent|late)/.test(normalized))
        return "/student/attendance";
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
    <header className="z-30 shrink-0 border-b border-[var(--portal-border)] bg-[var(--portal-surface)] px-4 py-3 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 lg:hidden"
          onClick={toggleSidebar}
          aria-label="Open navigation"
        >
          <Menu className="size-5" aria-hidden />
        </Button>
        <div className="hidden min-w-0 md:block">
          <p className="truncate text-sm font-bold text-[var(--portal-text)]">
            {currentTitle}
          </p>
          <p className="mt-0.5 truncate text-[11px] font-semibold text-[var(--portal-muted)]">
            {role ? ROLES[role].label : "Workspace"} · {today}
          </p>
        </div>
        <form
          onSubmit={onSearchSubmit}
          className="mx-auto hidden w-full max-w-[34rem] items-center gap-2 rounded-md border border-[var(--portal-border)] bg-[var(--portal-surface-strong)] px-3 py-2 md:flex"
        >
          <Search
            className="size-4 shrink-0 text-blue-700 dark:text-blue-200"
            aria-hidden
          />
          <input
            ref={searchRef}
            aria-label="Search workspace"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-6 min-w-0 flex-1 bg-transparent text-sm font-medium text-[var(--portal-text)] outline-none placeholder:font-medium placeholder:text-[var(--portal-muted)]"
            placeholder="Search students, staff, pages..."
            type="search"
          />
          <kbd className="rounded border border-[var(--portal-border)] bg-[var(--portal-surface)] px-1.5 py-0.5 font-mono text-[9px] font-bold text-[var(--portal-muted)]">Ctrl K</kbd>
        </form>
        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          <CampusStatus />
          <NotificationBell />
          <ThemeToggle />
          <Link
            href="/help"
            className="inline-flex size-9 items-center justify-center rounded-md text-[var(--portal-text)] transition hover:bg-[var(--portal-control)]"
            aria-label="Help centre"
            title="Help centre"
          >
            <CircleHelp className="size-4" aria-hidden />
          </Link>
          <Link
            href="/account/settings"
            className="inline-flex size-9 items-center justify-center rounded-md font-black text-[var(--portal-text)] transition hover:bg-[var(--portal-control)]"
            aria-label="My account settings"
            title="My account settings"
          >
            <Settings className="size-4" aria-hidden />
          </Link>
          <div className="hidden items-center gap-2 border-l border-[var(--portal-border)] pl-3 lg:flex">
            <span className="relative size-8 overflow-hidden rounded-full bg-[var(--portal-control)]">
              <Image
                src={avatarSrc}
                alt=""
                fill
              sizes="32px"
                className="object-contain p-1"
              />
            </span>
            <span className="min-w-0 pr-1">
              <span className="block max-w-32 truncate text-xs font-bold text-[var(--portal-text)]">
                {displayName}
              </span>
              <span className="block truncate text-[10px] font-semibold text-[var(--portal-muted)]">
                {role ? ROLES[role].label : "Loading"}
              </span>
            </span>
          </div>
          <form action={signOutAction}>
            <Button
              variant="ghost"
              size="icon"
              type="submit"
              aria-label="Sign out"
            >
              <LogOut className="size-4" aria-hidden />
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
