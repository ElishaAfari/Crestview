import Link from "next/link";
import { ArrowLeft, CopyPlus, Layers3, Plus, WalletCards } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DailyFeePlanForm } from "@/components/forms/DailyFeePlanForm";
import { DailyFeePlanTable } from "@/components/tables/DailyFeePlanTable";
import { listDailyFeePlans, listFinanceFormOptions } from "@/features/admin/queries";

export async function FinanceFeeStructuresWorkspace() {
  const [plans, options] = await Promise.all([listDailyFeePlans(), listFinanceFormOptions()]);
  const active = plans.filter((plan) => plan.status === "active").length;
  const average = plans.length ? plans.reduce((sum, plan) => sum + plan.rawAmount, 0) / plans.length : 0;

  return (
    <div className="reference-workspace space-y-6">
      <div className="ref-actions">
        <Link className="ref-button ref-button-secondary" href="/finance"><ArrowLeft className="size-4" aria-hidden />Finance overview</Link>
        <a className="ref-button ref-primary" href="#new-structure"><Plus className="size-4" aria-hidden />New fee structure</a>
        <Link className="ref-button ref-button-secondary" href="/finance/billing-batches"><CopyPlus className="size-4" aria-hidden />Class billing batch</Link>
      </div>
      <section className="ref-stats">
        <div className="ref-stat"><span>Total structures</span><strong>{plans.length}</strong><p>{active} active</p><Layers3 className="absolute right-4 top-4 size-5 text-[var(--portal-accent)]" aria-hidden /></div>
        <div className="ref-stat"><span>Average daily fee</span><strong>GHS {average.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong><p>Per active structure</p><WalletCards className="absolute right-4 top-4 size-5 text-[var(--portal-accent)]" aria-hidden /></div>
        <div className="ref-stat"><span>Classes configured</span><strong>{new Set(plans.map((plan) => plan.className)).size}</strong><p>Current plan coverage</p></div>
        <div className="ref-stat"><span>Student options</span><strong>{options.students.length}</strong><p>Active students available</p></div>
      </section>
      <Card id="new-structure">
        <CardHeader><CardTitle>New daily fee structure</CardTitle><p className="text-sm font-semibold text-[var(--portal-muted)]">Set one active daily plan per class. A plan is applied automatically when finance records payment by QR or student ID.</p></CardHeader>
        <CardContent><DailyFeePlanForm classrooms={options.classrooms} /></CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Fee structures</CardTitle><p className="text-sm font-semibold text-[var(--portal-muted)]">Searchable class register of active and historical daily fee plans.</p></CardHeader>
        <CardContent><DailyFeePlanTable data={plans} /></CardContent>
      </Card>
    </div>
  );
}
