"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigationItems } from "@/config/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";

export function MobileNav() {
  const pathname = usePathname();
  const role = useAuthStore((state) => state.role);
  const items = role ? navigationItems.filter((item) => item.roles.includes(role)).slice(0, 5) : [];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-[var(--portal-border)] bg-[var(--portal-shell)] px-2 py-2 lg:hidden">
      {items.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href;
        return (
          <Link key={item.href} href={item.href} className={cn("grid min-w-16 place-items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] text-slate-500", active && "bg-blue-500/15 text-blue-100")}>
            <Icon className="size-4" aria-hidden />
            <span>{item.title.split(" ")[0]}</span>
          </Link>
        );
      })}
    </nav>
  );
}
