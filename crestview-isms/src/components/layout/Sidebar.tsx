"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import Image from "next/image";
import {
  Baby,
  BarChart3,
  BookOpen,
  Boxes,
  BriefcaseBusiness,
  Bus,
  CalendarDays,
  ChevronRight,
  ClipboardCheck,
  CreditCard,
  FileText,
  GraduationCap,
  IdCard,
  Landmark,
  LayoutDashboard,
  MessageSquare,
  Search,
  Settings,
  UserCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { ROLES } from "@/config/roles";
import { AuraFlowSignature } from "@/components/shared/AuraFlowSignature";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { getSuiteNavigation } from "@/config/suiteNavigation";

function isActivePath(pathname: string, href: string, home: string) {
  if (href === home) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

const railHrefs: Record<string, string[]> = {
  Overview: ["/admin", "/calendar", "/teacher", "/student", "/parent", "/hr", "/finance", "/library", "/it"],
  People: ["/students", "/staff", "/id-cards"],
  Academics: ["/classes", "/attendance", "/assessment", "/academics-office/schemes"],
  Admissions: ["/admissions-office"],
  Preschool: ["/preschool"],
  Finance: ["/finance", "/bursary", "/accounting", "/feeding", "/extra-classes"],
  "HR & Payroll": ["/hr"],
  Facilities: ["/transport", "/inventory"],
  Communication: ["/messages"],
  Reports: ["/reports"],
  Settings: ["/admin/settings", "/account/settings"],
  Teaching: ["/teacher/classes", "/teacher/attendance", "/teacher/grades", "/teacher/schemes", "/teacher/lesson-notes"],
  Support: ["/learner-care", "/preschool", "/extra-classes"],
  Learning: ["/student/assignments", "/student/attendance", "/student/grades", "/student/reports"],
  Family: ["/parent/children", "/parent/fees", "/parent/reports", "/parent/messages"],
  Operations: ["/hr/payroll", "/id-cards", "/learner-care"],
  Library: ["/library/catalog", "/library/copies", "/library/loans", "/library/fines"],
  Technology: ["/it/devices", "/it/tickets", "/it/integrations", "/it/automation"],
  Account: ["/account/settings"],
  "Daily Clock": ["/staff-clock"],
};

function iconForLink(title: string): LucideIcon {
  const normalized = title.toLowerCase();
  if (normalized.includes("dashboard")) return LayoutDashboard;
  if (normalized.includes("calendar")) return CalendarDays;
  if (normalized.includes("student") || normalized.includes("children")) return GraduationCap;
  if (normalized.includes("staff") || normalized.includes("hr")) return Users;
  if (normalized.includes("id card") || normalized.includes("card")) return IdCard;
  if (normalized.includes("class") || normalized.includes("scheme") || normalized.includes("lesson")) return BookOpen;
  if (normalized.includes("attendance") || normalized.includes("clock")) return ClipboardCheck;
  if (normalized.includes("assessment") || normalized.includes("grade")) return BarChart3;
  if (normalized.includes("admission")) return UserCheck;
  if (normalized.includes("preschool")) return Baby;
  if (normalized.includes("fee") || normalized.includes("payment") || normalized.includes("bursary")) return CreditCard;
  if (normalized.includes("accounting")) return Landmark;
  if (normalized.includes("transport")) return Bus;
  if (normalized.includes("inventory")) return Boxes;
  if (normalized.includes("message") || normalized.includes("communication")) return MessageSquare;
  if (normalized.includes("report")) return FileText;
  if (normalized.includes("recruit")) return BriefcaseBusiness;
  return Settings;
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const role = useAuthStore((state) => state.role);
  const home = role ? ROLES[role].dashboard : "/";
  const suiteGroups = getSuiteNavigation(role);
  const [search, setSearch] = useState("");
  const visibleSuites = useMemo(() => {
    const query = search.trim().toLowerCase();
    return suiteGroups
      .map((group) => {
        const allowed = railHrefs[group.title] ?? [group.links[0]?.href];
        const links = group.links.filter(
          (link) =>
            allowed.includes(link.href) &&
            (!query || link.title.toLowerCase().includes(query)),
        );
        return { ...group, links };
      })
      .filter((group) => group.links.length);
  }, [search, suiteGroups]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = search.trim().toLowerCase();
    if (!normalized) return;
    const match = suiteGroups
      .flatMap((group) => group.links)
      .find((link) => link.title.toLowerCase().includes(normalized));
    router.push(match?.href ?? `${home}?q=${encodeURIComponent(search.trim())}`);
  }

  return (
    <aside className="workspace-sidebar hidden h-full min-h-0 w-64 shrink-0 flex-col overflow-hidden border-r border-[var(--portal-border)] bg-[var(--portal-sidebar)] text-[var(--portal-sidebar-text)] lg:flex">
      <div className="px-5 pb-4 pt-5">
        <Link href={home} className="flex items-center gap-2.5">
          <span className="relative size-10 overflow-hidden rounded-md border border-[var(--portal-border)] bg-white">
            <Image
              src="/crestview-logo.png"
              alt=""
              fill
              sizes="40px"
              className="object-contain p-1"
            />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-heading text-[15px] font-black uppercase tracking-normal text-[var(--portal-sidebar-text)]">
              Crestview
            </span>
            <span className="block truncate text-[10px] font-bold uppercase tracking-normal text-[var(--portal-sidebar-muted)]">
              International School
            </span>
          </span>
        </Link>
      </div>
      <form onSubmit={submitSearch} className="mx-3 mb-3 flex items-center gap-2 rounded-md border border-[var(--portal-border)] bg-[var(--portal-surface-strong)] px-3 py-2 shadow-sm">
        <Search className="size-4 shrink-0 text-[var(--portal-sidebar-muted)]" aria-hidden />
        <input
          aria-label="Find a suite"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="min-w-0 flex-1 bg-transparent text-xs font-semibold text-[var(--portal-sidebar-text)] outline-none placeholder:text-[var(--portal-sidebar-muted)]"
          placeholder="Search workspace..."
          type="search"
        />
        <kbd className="rounded border border-[var(--portal-border)] bg-[var(--portal-surface)] px-1.5 py-0.5 font-mono text-[9px] font-bold text-[var(--portal-sidebar-muted)]">Ctrl K</kbd>
      </form>
      <nav className="dashboard-scroll-region min-h-0 flex-1 space-y-5 overflow-y-auto px-3 py-3">
        {visibleSuites.map((group) => {
          return (
            <div key={group.title}>
              <p className="px-1.5 pb-1 text-[11px] font-bold uppercase tracking-normal text-[var(--portal-sidebar-muted)]">
                {group.title}
              </p>
              <div className="space-y-0.5">
                {group.links.map((item) => {
                    const active = isActivePath(
                      pathname,
                      item.href.split("?")[0],
                      home,
                    );
                    const Icon = iconForLink(item.title);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex min-h-9 items-center gap-2 rounded-md px-2 py-2 text-[13px] font-medium text-[var(--portal-sidebar-text)] transition hover:bg-[var(--portal-control)]",
                          active &&
                            "bg-[#e8f1fc] text-[#1555b2] shadow-none hover:bg-[#e8f1fc] hover:text-[#1555b2] dark:bg-white/12 dark:text-white dark:hover:bg-white/16 dark:hover:text-white",
                        )}
                      >
                        <Icon className={cn("size-4 shrink-0", active ? "text-blue-600 dark:text-blue-200" : "text-[var(--portal-sidebar-muted)]")} aria-hidden />
                        <span className="truncate">{item.title}</span>
                        <ChevronRight className="ml-auto size-3.5 shrink-0 text-[var(--portal-sidebar-muted)]" aria-hidden />
                      </Link>
                    );
                  })}
              </div>
            </div>
          );
        })}
      </nav>
      <div className="m-3 mt-2 rounded-md border border-[var(--portal-border)] bg-[var(--portal-surface-strong)] p-3">
        <p className="text-[10px] font-bold uppercase tracking-normal text-[var(--portal-sidebar-muted)]">
          Workspace
        </p>
        <p className="mt-1 text-sm font-bold text-[var(--portal-sidebar-text)]">
          {role ? ROLES[role].label : "Loading"}
        </p>
        <AuraFlowSignature
          compact
          className="mt-3 border-t border-[var(--portal-border)] pt-3"
        />
      </div>
    </aside>
  );
}
