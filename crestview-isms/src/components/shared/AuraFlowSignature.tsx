import { cn } from "@/lib/utils";

export function AuraFlowSignature({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <div className={cn("auraflow-signature inline-flex items-center gap-2", className)} aria-label="Powered by AuraFlow">
      <span className="auraflow-mark" aria-hidden>
        AF
      </span>
      <span className="min-w-0">
        <span className="block text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100/80">Powered by</span>
        <span className={cn("auraflow-wordmark block truncate font-heading font-black tracking-normal", compact ? "text-sm" : "text-base")}>AuraFlow</span>
      </span>
    </div>
  );
}
