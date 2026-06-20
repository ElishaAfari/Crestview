"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { navigationItems } from "@/config/navigation";
import { ROLES } from "@/config/roles";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
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

export function Sidebar() {
  const pathname = usePathname();
  const role = useAuthStore((state) => state.role);
  const items = role ? navigationItems.filter((item) => item.roles.includes(role)) : [];
  const home = role ? ROLES[role].dashboard : "/";
  const groupedItems = groupNavigation(items);

  return (
    <aside className="hidden h-full min-h-0 w-76 shrink-0 flex-col overflow-hidden bg-[var(--portal-shell)] text-white shadow-[10px_0_40px_-28px_rgba(15,23,42,0.7)] lg:flex">
      <div className="border-b border-white/15 px-5 py-5">
        <Link href={home} className="flex items-center gap-3">
          <span className="relative size-12 overflow-hidden rounded-lg bg-white shadow-lg shadow-slate-950/20">
            <Image src="/crestview-logo.png" alt="" fill sizes="48px" className="object-contain p-1.5" />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-heading text-lg font-black uppercase tracking-normal text-white">Crestview</span>
            <span className="block truncate text-[11px] font-bold uppercase tracking-normal text-white">International School</span>
          </span>
        </Link>
      </div>
      <nav className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-5">
        {groupedItems.map((group) => (
          <div key={group.section}>
            <p className="px-3 text-[11px] font-black uppercase tracking-normal text-cyan-100">{group.section}</p>
            <div className="mt-2 space-y-1">
              {group.items.map((item) => {
                const active = isActivePath(pathname, item.href, home);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-black text-white/95 transition hover:bg-white/14 hover:text-white",
                      active && "bg-white text-[#07377f] shadow-lg shadow-slate-950/15 hover:bg-white hover:text-[#07377f]"
                    )}
                  >
                    <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg bg-white/16 text-white ring-1 ring-white/10", active && "bg-[#eef4ff] text-[#07377f] ring-[#bfd8fa]")}>
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <span className="truncate">{item.title}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="m-4 rounded-lg border border-white/15 bg-white/10 p-4">
        <p className="text-xs font-bold uppercase tracking-normal text-cyan-100">Workspace</p>
        <p className="mt-1 text-sm font-semibold text-white">{role ? ROLES[role].label : "Loading"}</p>
      </div>
    </aside>
  );
}
