"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { navigationItems } from "@/config/navigation";
import { ROLES } from "@/config/roles";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useUIStore } from "@/store/uiStore";
import type { NavItem } from "@/types/ui.types";

function groupNavigation(items: NavItem[]) {
  return items.reduce<Array<{ section: string; items: NavItem[] }>>((groups, item) => {
    const section = item.section ?? "Workspace";
    const group = groups.find((entry) => entry.section === section);
    if (group) group.items.push(item);
    else groups.push({ section, items: [item] });
    return groups;
  }, []);
}

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
  const items = role ? navigationItems.filter((item) => item.roles.includes(role)) : [];
  const home = role ? ROLES[role].dashboard : "/";
  const displayName = profile ? `${profile.first_name} ${profile.last_name}` : "School workspace";
  const groupedItems = groupNavigation(items);

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
    <div className={cn("fixed inset-0 z-50 lg:hidden", !open && "pointer-events-none")} aria-hidden={!open}>
      <button
        type="button"
        aria-label="Close navigation"
        className={cn("absolute inset-0 bg-slate-950/60 transition-opacity", open ? "opacity-100" : "opacity-0")}
        onClick={() => setOpen(false)}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Workspace navigation"
        className={cn(
          "absolute inset-y-0 left-0 flex h-dvh w-[min(22rem,88vw)] flex-col bg-[var(--portal-shell)] pt-[env(safe-area-inset-top)] text-white shadow-2xl transition-transform duration-200",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center gap-3 border-b border-white/15 px-4 py-4">
          <Link href={home} onClick={() => setOpen(false)} className="flex min-w-0 flex-1 items-center gap-3">
            <span className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-white">
              <Image src="/crestview-logo.png" alt="" fill sizes="44px" className="object-contain p-1" />
            </span>
            <span className="min-w-0">
              <span className="block truncate font-heading text-base font-black uppercase text-white">Crestview</span>
              <span className="block truncate text-xs font-semibold text-blue-100">{displayName}</span>
            </span>
          </Link>
          <Button type="button" variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close navigation">
            <X className="size-5" aria-hidden />
          </Button>
        </div>
        <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4">
          <div className="space-y-6">
            {groupedItems.map((group) => (
              <div key={group.section}>
                <p className="px-3 text-[11px] font-black uppercase tracking-normal text-blue-200/80">{group.section}</p>
                <div className="mt-2 space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActivePath(pathname, item.href, home);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-bold text-blue-50/85 transition hover:bg-white/10 hover:text-white",
                          active && "bg-white text-[#07377f] hover:bg-white hover:text-[#07377f]"
                        )}
                      >
                        <Icon className="size-4 shrink-0" aria-hidden />
                        <span className="truncate">{item.title}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </nav>
        <div className="border-t border-white/15 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 text-xs font-semibold text-blue-100">
          {role ? ROLES[role].label : "Loading workspace..."}
        </div>
      </aside>
    </div>
  );
}
