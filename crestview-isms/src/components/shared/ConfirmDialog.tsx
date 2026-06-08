"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onClose
}: {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4">
      <div className="w-full max-w-md rounded-lg border border-[var(--portal-border)] bg-[var(--portal-surface)] p-6 shadow-[var(--portal-card-shadow)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-heading text-lg font-semibold text-[var(--portal-text)]">{title}</h2>
            <p className="mt-2 text-sm text-[var(--portal-muted)]">{message}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close dialog">
            <X className="size-4" aria-hidden />
          </Button>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={onConfirm}>Confirm</Button>
        </div>
      </div>
    </div>
  );
}
