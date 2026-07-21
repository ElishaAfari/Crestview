"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import { Printer, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StudentIdCardRow } from "@/features/admin/queries";

export function StudentIdCardGrid({ cards = [] }: { cards?: StudentIdCardRow[] }) {
  const [qrImages, setQrImages] = useState<Record<string, string>>({});

  useEffect(() => {
    let mounted = true;
    async function renderCodes() {
      const entries = await Promise.all(cards.map(async (card) => [
        card.id,
        await QRCode.toDataURL(card.qrPayload, {
          errorCorrectionLevel: "M",
          margin: 1,
          width: 180,
          color: { dark: "#001b4f", light: "#ffffff" }
        })
      ] as const));
      if (mounted) setQrImages(Object.fromEntries(entries));
    }
    renderCodes().catch(() => {
      if (mounted) setQrImages({});
    });
    return () => {
      mounted = false;
    };
  }, [cards]);

  if (!cards.length) {
    return (
      <div className="rounded-lg border-2 border-dashed border-[var(--portal-border)] p-8 text-center">
        <QrCode className="mx-auto size-8 text-blue-700 dark:text-blue-200" aria-hidden />
        <p className="mt-3 text-sm font-bold text-[var(--portal-muted)]">Student ID cards will appear as soon as learners are enrolled.</p>
      </div>
    );
  }

  return (
    <div className="student-id-print-area space-y-4">
      <Button type="button" variant="secondary" onClick={() => window.print()} className="student-id-print-controls">
        <Printer className="size-4" aria-hidden />
        Print ID cards
      </Button>
      <div className="student-id-card-sheet grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <div key={card.id} className="student-id-card overflow-hidden rounded-lg border-2 border-blue-300 bg-white shadow-[0_18px_44px_-28px_rgba(7,55,127,0.72)] dark:border-white/10 dark:bg-slate-950">
            <div className="flex items-center gap-3 bg-[#07377f] px-4 py-3 text-white">
              <span className="relative size-11 overflow-hidden rounded-lg bg-white">
                <Image src="/crestview-logo.png" alt="Crestview logo" fill className="object-contain p-1" />
              </span>
              <div>
                <p className="font-heading text-sm font-black">CRESTVIEW</p>
                <p className="text-[10px] font-black uppercase tracking-normal">International School</p>
              </div>
            </div>
            <div className="grid grid-cols-[1fr_7.5rem] gap-3 p-4">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase text-blue-700 dark:text-blue-200">Student ID Card</p>
                <p className="mt-2 truncate font-heading text-xl font-black text-[var(--portal-text)]">{card.student}</p>
                <p className="mt-1 text-sm font-black text-[var(--portal-muted)]">{card.studentNumber}</p>
                <p className="mt-3 text-sm font-bold text-[var(--portal-muted)]">{card.classroom}</p>
                <p className="mt-4 text-xs font-black uppercase text-[var(--portal-muted)]">Card: {card.cardNumber}</p>
              </div>
              <div className="flex flex-col items-center justify-center rounded-lg border border-blue-200 bg-white p-2">
                {qrImages[card.id] ? (
                  <Image src={qrImages[card.id]} alt={`${card.student} QR code`} width={112} height={112} unoptimized />
                ) : (
                  <QrCode className="size-20 text-blue-700" aria-hidden />
                )}
                <p className="mt-1 text-center text-[10px] font-black uppercase text-blue-900">Scan</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
