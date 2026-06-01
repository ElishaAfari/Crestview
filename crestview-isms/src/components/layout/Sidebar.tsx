"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { navigationItems } from "@/config/navigation";
import { ROLES } from "@/config/roles";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";

export function Sidebar() {
  const pathname = usePathname();
  const role = useAuthStore((state) => state.role);
  const items = role ? navigationItems.filter((item) => item.roles.includes(role)) : [];
  const home = role ? ROLES[role].dashboard : "/";

  return (
    <aside className="hidden min-h-screen w-72 border-r border-[var(--portal-border)] bg-[var(--portal-shell)] px-4 py-5 lg:block">
      <Link href={home} className="flex items-center gap-3 px-2">
        <span className="relative size-10 overflow-hidden rounded-lg bg-white">
          <Image src="/crestview-logo.png" alt="" fill sizes="40px" className="object-contain p-1" />
        </span>
        <span className="font-heading text-base font-semibold text-[var(--portal-text)]">Crestview ISMS</span>
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
                "flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-[var(--portal-muted)] transition hover:bg-white/10 hover:text-[var(--portal-text)]",
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
