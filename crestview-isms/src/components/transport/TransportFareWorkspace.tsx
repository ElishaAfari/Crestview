import { ReceiptText, Route } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRoles } from "@/features/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { TransportFareCollectionForm } from "./TransportFareCollectionForm";

type FarePlanRow = { id: string; route_id: string; name: string; amount: number; currency: string; collection_frequency: string };
type FarePaymentRow = { id: string; student_number: string; payment_date: string; amount: number; currency: string; status: string; reference: string };

export async function TransportFareWorkspace() {
  await requireRoles(["super_admin", "school_admin", "finance_officer"]);
  const admin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);
  const [routesData, plansData, paymentsData, collectedData] = await Promise.all([
    admin.from("transport_routes").select("id,name").eq("is_active", true).is("deleted_at", null).order("name"),
    admin.from("transport_fare_plans").select("id,route_id,name,amount,currency,collection_frequency").eq("is_active", true).is("deleted_at", null).order("created_at", { ascending: false }),
    admin.from("transport_fare_payments").select("id,student_number,payment_date,amount,currency,status,reference").is("deleted_at", null).order("created_at", { ascending: false }).limit(12),
    admin.from("transport_fare_payments").select("amount").eq("payment_date", today).eq("status", "paid").is("deleted_at", null),
  ]);
  const routes = (routesData.data ?? []) as Array<{ id: string; name: string }>;
  const plans = (plansData.data ?? []) as unknown as FarePlanRow[];
  const payments = (paymentsData.data ?? []) as FarePaymentRow[];
  const collected = ((collectedData.data ?? []) as Array<{ amount: number }>).reduce((sum, payment) => sum + Number(payment.amount), 0);
  const routeNames = new Map(routes.map((route) => [route.id, route.name]));

  return <div className="reference-workspace space-y-6"><section className="ref-stats"><div className="ref-stat"><span>Today collected</span><strong>GHS {collected.toLocaleString("en-GH", { minimumFractionDigits: 2 })}</strong><p>Paid transport fares for {today}</p></div><div className="ref-stat"><span>Active fare plans</span><strong>{plans.length}</strong><p>Routes ready to collect</p></div><div className="ref-stat"><span>Recent receipts</span><strong>{payments.length}</strong><p>Latest recorded collections</p></div></section><TransportFareCollectionForm routes={routes} /><section className="grid gap-6 xl:grid-cols-2"><Card><CardHeader><CardTitle><Route className="mr-2 inline size-5 text-blue-600" aria-hidden />Active route fares</CardTitle></CardHeader><CardContent>{plans.length ? <div className="space-y-3">{plans.map((plan) => <div key={plan.id} className="portal-subtle-card flex items-center justify-between gap-3 p-3"><div><p className="font-black text-[var(--portal-text)]">{routeNames.get(plan.route_id) ?? "Route"}: {plan.name}</p><p className="text-xs font-semibold text-[var(--portal-muted)]">{plan.collection_frequency} collection</p></div><strong className="text-sm text-[var(--portal-text)]">{plan.currency} {Number(plan.amount).toLocaleString("en-GH")}</strong></div>)}</div> : <p className="text-sm font-semibold text-[var(--portal-muted)]">No active route fares have been configured.</p>}</CardContent></Card><Card><CardHeader><CardTitle><ReceiptText className="mr-2 inline size-5 text-emerald-600" aria-hidden />Recent collections</CardTitle></CardHeader><CardContent>{payments.length ? <div className="space-y-3">{payments.map((payment) => <div key={payment.id} className="portal-subtle-card flex items-center justify-between gap-3 p-3"><div><p className="font-black text-[var(--portal-text)]">{payment.student_number}</p><p className="text-xs font-semibold text-[var(--portal-muted)]">{payment.payment_date} · {payment.reference}</p></div><div className="text-right"><strong className="text-sm text-[var(--portal-text)]">{payment.currency} {Number(payment.amount).toLocaleString("en-GH")}</strong><p className="text-xs font-bold capitalize text-[var(--portal-muted)]">{payment.status}</p></div></div>)}</div> : <p className="text-sm font-semibold text-[var(--portal-muted)]">No transport fare receipts have been recorded yet.</p>}</CardContent></Card></section></div>;
}
