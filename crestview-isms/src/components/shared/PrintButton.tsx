"use client";

import { Printer } from "lucide-react";

export function PrintButton({ label = "Print" }: { label?: string }) {
  return (
    <button type="button" className="portal-register-link h-10 px-4 text-sm" onClick={() => window.print()}>
      <Printer className="size-4" aria-hidden />
      {label}
    </button>
  );
}
