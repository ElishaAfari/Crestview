"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { navigationItems } from "@/config/navigation";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const role = "super_admin";
  const items = navigationItems.filter((item) => item.roles.includes(role));

  return (
    <aside className="hidden min-h-screen w-72 border-r border-white/10 bg-slate-950/80 px-4 py-5 lg:block">
      <Link href="/admin" className="flex items-center gap-3 px-2">
        <span className="grid size-10 place-items-center rounded-xl bg-blue-500/20 text-blue-100">
          <GraduationCap className="size-5" aria-hidden />
        </span>
        <span className="font-heading text-base font-semibold text-white">Crestview ISMS</span>
      </Link>
      <nav className="mt-8 space-y-1">
        {items.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-400 transition hover:bg-white/10 hover:text-white",
                active && "bg-blue-500/15 text-blue-100"
              )}
            >
              <Icon className="size-4" aria-hidden />
              {item.title}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
