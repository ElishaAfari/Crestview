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

export function MobileNav() {
  const pathname = usePathname();
  const role = useAuthStore((state) => state.role);
  const profile = useAuthStore((state) => state.profile);
  const open = useUIStore((state) => state.sidebarOpen);
  const setOpen = useUIStore((state) => state.setSidebarOpen);
  const items = role ? navigationItems.filter((item) => item.roles.includes(role)) : [];
  const home = role ? ROLES[role].dashboard : "/";
  const displayName = profile ? `${profile.first_name} ${profile.last_name}` : "School workspace";

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
          "absolute inset-y-0 left-0 flex h-dvh w-[min(22rem,88vw)] flex-col border-r border-[var(--portal-border)] bg-[var(--portal-shell)] pt-[env(safe-area-inset-top)] shadow-2xl transition-transform duration-200",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center gap-3 border-b border-[var(--portal-border)] px-4 py-4">
          <Link href={home} onClick={() => setOpen(false)} className="flex min-w-0 flex-1 items-center gap-3">
            <span className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-white">
              <Image src="/crestview-logo.png" alt="" fill sizes="44px" className="object-contain p-1" />
            </span>
            <span className="min-w-0">
              <span className="block truncate font-heading text-base font-semibold text-[var(--portal-text)]">Crestview ISMS</span>
              <span className="block truncate text-xs text-[var(--portal-muted)]">{displayName}</span>
            </span>
          </Link>
          <Button type="button" variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close navigation">
            <X className="size-5" aria-hidden />
          </Button>
        </div>
        <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4">
          <div className="space-y-1">
            {items.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[var(--portal-muted)] transition hover:bg-white/10 hover:text-[var(--portal-text)]",
                    active && "bg-blue-500/15 text-blue-100"
                  )}
                >
                  <Icon className="size-4 shrink-0" aria-hidden />
                  <span className="truncate">{item.title}</span>
                </Link>
              );
            })}
          </div>
        </nav>
        <div className="border-t border-[var(--portal-border)] px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 text-xs text-[var(--portal-muted)]">
          {role ? ROLES[role].label : "Loading workspace..."}
        </div>
      </aside>
    </div>
  );
}
