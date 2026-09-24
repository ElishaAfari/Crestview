"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { ChevronDown, Search } from "lucide-react";
import { navigationItems } from "@/config/navigation";
import { ROLES } from "@/config/roles";
import { AuraFlowSignature } from "@/components/shared/AuraFlowSignature";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { getSuiteNavigation } from "@/config/suiteNavigation";
import { getSuiteNavigationTone } from "@/config/suiteNavigationTones";

function isActivePath(pathname: string, href: string, home: string) {
  if (href === home) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const role = useAuthStore((state) => state.role);
  const items = role
    ? navigationItems.filter((item) => item.roles.includes(role))
    : [];
  const home = role ? ROLES[role].dashboard : "/";
  const suiteGroups = getSuiteNavigation(role);
  const activeSuite = suiteGroups.find((group) =>
    group.links.some((link) =>
      isActivePath(pathname, link.href.split("?")[0], home),
    ),
  )?.title;
  const [openSuites, setOpenSuites] = useState<string[]>(
    activeSuite
      ? [activeSuite]
      : ([suiteGroups[0]?.title].filter(Boolean) as string[]),
  );
  const [search, setSearch] = useState("");

  useEffect(() => {
    const nextSuite = activeSuite ?? suiteGroups[0]?.title;
    if (!nextSuite) return;
    setOpenSuites((current) =>
      current.includes(nextSuite) ? current : [...current, nextSuite],
    );
  }, [activeSuite, suiteGroups]);

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
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
        {suiteGroups.map((group) => {
          const expanded = openSuites.includes(group.title);
          const GroupIcon = group.icon;
          const tone = getSuiteNavigationTone(group.title);
          return (
            <div key={group.title}>
              <button
                type="button"
                onClick={() =>
                  setOpenSuites((current) =>
                    expanded
                      ? current.filter((title) => title !== group.title)
                      : [...current, group.title],
                  )
                }
                className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-[11px] font-black uppercase tracking-normal text-[var(--portal-sidebar-muted)] transition hover:bg-[var(--portal-control)] hover:text-[var(--portal-sidebar-text)]"
              >
                <span className="flex items-center gap-2">
                  <span
                    className={cn(
                      "grid size-6 shrink-0 place-items-center rounded-md ring-1",
                      tone.sectionIcon,
                    )}
                  >
                    <GroupIcon className="size-3.5" aria-hidden />
                  </span>
                  {group.title}
                </span>
                <ChevronDown
                  className={cn(
                    "size-4 transition-transform duration-150",
                    !expanded && "-rotate-90",
                  )}
                  aria-hidden
                />
              </button>
              {expanded ? (
                <div className="mt-1 space-y-0.5">
                  {group.links.map((item) => {
                    const active = isActivePath(
                      pathname,
                      item.href.split("?")[0],
                      home,
                    );
                    const Icon =
                      items.find((entry) => entry.href === item.href)?.icon ??
                      GroupIcon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex min-h-9 items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-bold text-[var(--portal-sidebar-text)] transition hover:bg-[var(--portal-control)]",
                          active &&
                            "bg-[#e8f1fc] text-[#1555b2] shadow-none hover:bg-[#e8f1fc] hover:text-[#1555b2] dark:bg-white/12 dark:text-white dark:hover:bg-white/16 dark:hover:text-white",
                        )}
                      >
                        <span
                          className={cn(
                            "grid size-7 shrink-0 place-items-center rounded-md ring-1",
                            tone.itemIcon,
                          )}
                        >
                          <Icon className="size-4" aria-hidden />
                        </span>
                        <span className="truncate">{item.title}</span>
                      </Link>
                    );
                  })}
                </div>
              ) : null}
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
