"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
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

  useEffect(() => {
    const nextSuite = activeSuite ?? suiteGroups[0]?.title;
    if (!nextSuite) return;
    setOpenSuites((current) =>
      current.includes(nextSuite) ? current : [...current, nextSuite],
    );
  }, [activeSuite, suiteGroups]);

  return (
    <aside className="hidden h-full min-h-0 w-76 shrink-0 flex-col overflow-hidden bg-[var(--portal-shell)] text-white shadow-[10px_0_40px_-28px_rgba(15,23,42,0.7)] lg:flex">
      <div className="border-b border-white/15 px-5 py-5">
        <Link href={home} className="flex items-center gap-3">
          <span className="relative size-12 overflow-hidden rounded-lg bg-white shadow-lg shadow-slate-950/20">
            <Image
              src="/crestview-logo.png"
              alt=""
              fill
              sizes="48px"
              className="object-contain p-1.5"
            />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-heading text-lg font-black uppercase tracking-normal text-white">
              Crestview
            </span>
            <span className="block truncate text-[11px] font-bold uppercase tracking-normal text-white">
              International School
            </span>
          </span>
        </Link>
      </div>
      <nav className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-5">
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
                className="flex w-full items-center justify-between px-3 text-[11px] font-black uppercase tracking-normal text-cyan-100"
              >
                <span className="flex items-center gap-2">
                  <span
                    className={cn(
                      "grid size-6 shrink-0 place-items-center rounded-lg ring-1",
                      tone.sectionIcon,
                    )}
                  >
                    <GroupIcon className="size-3.5" aria-hidden />
                  </span>
                  {group.title}
                </span>
                <span aria-hidden>{expanded ? "−" : "+"}</span>
              </button>
              {expanded ? (
                <div className="mt-2 space-y-1">
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
                          "flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-sm font-black text-white/95 transition hover:bg-white/14 hover:text-white",
                          active &&
                            "bg-white text-[#07377f] shadow-lg shadow-slate-950/15 hover:bg-white hover:text-[#07377f]",
                        )}
                      >
                        <span
                          className={cn(
                            "grid size-8 shrink-0 place-items-center rounded-lg ring-1",
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
      <div className="m-4 rounded-lg border border-white/15 bg-white/10 p-4">
        <p className="text-xs font-bold uppercase tracking-normal text-cyan-100">
          Workspace
        </p>
        <p className="mt-1 text-sm font-semibold text-white">
          {role ? ROLES[role].label : "Loading"}
        </p>
        <AuraFlowSignature
          compact
          className="mt-4 border-t border-white/10 pt-4"
        />
      </div>
    </aside>
  );
}
