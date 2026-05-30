"use client";

import { AnimatePresence, motion } from "framer-motion";
import { LogIn, MapPin, Menu, Phone, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { siteConfig } from "@/config/site";
import { buttonVariants } from "@/components/ui/button";

export function PublicSiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="relative z-50 bg-white text-slate-950 shadow-sm">
      <div className="bg-[#06165b] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2 text-[11px] sm:px-6 sm:text-xs lg:px-8">
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <MapPin className="size-3.5 flex-none text-[#42d6d0]" aria-hidden />
            <span className="truncate">{siteConfig.address}</span>
          </span>
          <a href={siteConfig.phones[0].href} className="hidden items-center gap-1.5 font-semibold text-[#fff27c] transition hover:text-white sm:inline-flex">
            <Phone className="size-3.5" aria-hidden />
            {siteConfig.phones[0].label}
          </a>
        </div>
      </div>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-3" onClick={() => setMenuOpen(false)}>
          <span className="relative size-12 flex-none overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <Image src="/crestview-logo.png" alt="Crestview International School logo" fill sizes="48px" className="object-contain p-1" />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-heading text-sm font-bold uppercase text-[#06165b] sm:text-base">Crestview</span>
            <span className="block truncate text-[10px] font-semibold uppercase text-slate-500 sm:text-xs">International School</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Public navigation">
          {siteConfig.mainNav.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-md px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-[#f5f7ff] hover:text-[#06165b]">
              {item.title}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Link href="/login" className={buttonVariants({ variant: "ghost", className: "!text-[#06165b] hover:bg-[#f5f7ff] hover:!text-[#06165b]" })}>
            <LogIn className="size-4" aria-hidden />
            Portal
          </Link>
          <Link href="/admissions" className={buttonVariants({ className: "bg-[#cf1017] text-white shadow-none hover:bg-[#aa0d13]" })}>
            Enroll today
          </Link>
        </div>

        <button
          type="button"
          className="grid size-10 place-items-center rounded-md border border-slate-200 text-[#06165b] lg:hidden"
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
        </button>
      </div>

      <AnimatePresence>
        {menuOpen ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-slate-200 bg-white lg:hidden"
          >
            <nav className="grid gap-1 px-4 py-4" aria-label="Mobile public navigation">
              {siteConfig.mainNav.map((item) => (
                <Link key={item.href} href={item.href} className="rounded-md px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-[#f5f7ff] hover:text-[#06165b]" onClick={() => setMenuOpen(false)}>
                  {item.title}
                </Link>
              ))}
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Link href="/login" className={buttonVariants({ className: "bg-[#06165b] text-white shadow-none hover:bg-[#0a237c]" })} onClick={() => setMenuOpen(false)}>
                  Portal
                </Link>
                <Link href="/admissions" className={buttonVariants({ className: "bg-[#cf1017] text-white shadow-none hover:bg-[#aa0d13]" })} onClick={() => setMenuOpen(false)}>
                  Enroll today
                </Link>
              </div>
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
