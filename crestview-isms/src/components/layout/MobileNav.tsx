"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROLES } from "@/config/roles";
import { getSuiteNavigation } from "@/config/suiteNavigation";
import { getSuiteNavigationTone } from "@/config/suiteNavigationTones";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useUIStore } from "@/store/uiStore";

function isActivePath(pathname: string, href: string, home: string) {
  if (href === home) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileNav() {
  const pathname = usePathname();
  const role = useAuthStore((state) => state.role);
  const profile = useAuthStore((state) => state.profile);
  const open = useUIStore((state) => state.sidebarOpen);
  const setOpen = useUIStore((state) => state.setSidebarOpen);
  const home = role ? ROLES[role].dashboard : "/";
  const displayName = profile
    ? `${profile.first_name} ${profile.last_name}`
    : "School workspace";
  const suiteGroups = getSuiteNavigation(role);
  const activeSuite = suiteGroups.find((group) =>
    group.links.some((link) =>
      isActivePath(pathname, link.href.split("?")[0], home),
    ),
  )?.title;
  const [openSuites, setOpenSuites] = useState<string[]>(
    activeSuite ? [activeSuite] : [],
  );

  useEffect(() => {
    const nextSuite = activeSuite ?? suiteGroups[0]?.title;
    if (!nextSuite) return;
    setOpenSuites((current) =>
      current.includes(nextSuite) ? current : [...current, nextSuite],
    );
  }, [activeSuite, suiteGroups]);

  useEffect(() => {
    setOpen(false);
  }, [pathname, setOpen]);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, setOpen]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 lg:hidden",
        !open && "pointer-events-none",
      )}
      aria-hidden={!open}
    >
      <button
        type="button"
        aria-label="Close navigation"
        className={cn(
          "absolute inset-0 bg-slate-950/60 transition-opacity",
          open ? "opacity-100" : "opacity-0",
        )}
        onClick={() => setOpen(false)}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Workspace navigation"
        className={cn(
          "absolute inset-y-0 left-0 flex h-dvh w-[min(22rem,88vw)] flex-col bg-[var(--portal-shell)] pt-[env(safe-area-inset-top)] text-white shadow-2xl transition-transform duration-200",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center gap-3 border-b border-white/15 px-4 py-4">
          <Link
            href={home}
            onClick={() => setOpen(false)}
            className="flex min-w-0 flex-1 items-center gap-3"
          >
            <span className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-white">
              <Image
                src="/crestview-logo.png"
                alt=""
                fill
                sizes="44px"
                className="object-contain p-1"
              />
            </span>
            <span className="min-w-0">
              <span className="block truncate font-heading text-base font-black uppercase text-white">
                Crestview
              </span>
              <span className="block truncate text-xs font-bold text-white">
                {displayName}
              </span>
            </span>
          </Link>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
          >
            <X className="size-5" aria-hidden />
          </Button>
        </div>
        <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4">
          <div className="space-y-6">
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
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-[11px] font-black uppercase tracking-normal text-cyan-100 transition hover:bg-white/10"
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
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setOpen(false)}
                            className={cn(
                              "flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-black text-white/95 transition hover:bg-white/14 hover:text-white",
                              active &&
                                "bg-white text-[#07377f] hover:bg-white hover:text-[#07377f]",
                            )}
                          >
                            <span
                              className={cn(
                                "grid size-8 shrink-0 place-items-center rounded-lg ring-1",
                                tone.itemIcon,
                              )}
                            >
                              <GroupIcon className="size-4" aria-hidden />
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
          </div>
        </nav>
        <div className="border-t border-white/15 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 text-xs font-bold text-cyan-100">
          {role ? ROLES[role].label : "Loading workspace..."}
        </div>
      </aside>
    </div>
  );
}
