"use client";

import { Button } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center p-6">
      <div className="max-w-md rounded-xl border border-white/10 bg-slate-900 p-6 text-center">
        <h1 className="font-heading text-xl font-semibold text-white">Something needs attention</h1>
        <p className="mt-2 text-sm text-slate-400">{error.message}</p>
        <Button className="mt-5" onClick={reset}>Try again</Button>
      </div>
    </main>
  );
}
