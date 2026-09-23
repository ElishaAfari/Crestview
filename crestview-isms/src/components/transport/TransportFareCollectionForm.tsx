"use client";

import { useState } from "react";
import { Banknote, Route } from "lucide-react";
import { StudentQrCapture } from "@/components/forms/StudentQrCapture";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { configureTransportFarePlanAction, recordTransportFarePaymentAction } from "@/features/transport/fare-actions";

type RouteOption = { id: string; name: string };

export function TransportFareCollectionForm({ routes }: { routes: RouteOption[] }) {
  const [lookup, setLookup] = useState("");
  const [paymentMessage, setPaymentMessage] = useState<{ ok: boolean; message: string } | null>(null);
  const [planMessage, setPlanMessage] = useState<{ ok: boolean; message: string } | null>(null);
  const [savingPayment, setSavingPayment] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);

  async function savePayment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingPayment(true);
    const result = await recordTransportFarePaymentAction(new FormData(event.currentTarget));
    setPaymentMessage(result);
    setSavingPayment(false);
    if (result.ok) {
      setLookup("");
      event.currentTarget.reset();
    }
  }

  async function savePlan(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingPlan(true);
    const result = await configureTransportFarePlanAction(new FormData(event.currentTarget));
    setPlanMessage(result);
    setSavingPlan(false);
  }

  const today = new Date().toISOString().slice(0, 10);
  return <div className="grid gap-6 xl:grid-cols-2">
    <section className="ref-panel"><div className="flex items-start gap-3"><span className="ref-avatar"><Banknote className="size-5" aria-hidden /></span><div><h2 className="text-base font-black text-[var(--portal-text)]">Collect transport fare</h2><p className="mt-1 text-sm">Scan the learner&apos;s ID card or enter the student ID. The active route fare is applied automatically.</p></div></div><form onSubmit={savePayment} className="mt-5 space-y-4"><StudentQrCapture value={lookup} onValue={setLookup} placeholder="CIS/ST/000001 or scanned QR payload" /><div className="grid gap-4 sm:grid-cols-2"><div><Label>Collection date</Label><Input name="paymentDate" type="date" defaultValue={today} required /></div><div><Label>Payment method</Label><Select name="method" defaultValue="cash"><option value="cash">Cash</option><option value="mobile_money">Mobile Money</option><option value="card">Card</option><option value="bank">Bank</option><option value="other">Other</option></Select></div><div><Label>Status</Label><Select name="status" defaultValue="paid"><option value="paid">Paid</option><option value="waived">Waived</option></Select></div><div><Label>Receipt reference</Label><Input name="reference" placeholder="Optional receipt or MoMo reference" /></div></div><div><Label>Notes</Label><Textarea name="notes" placeholder="Optional collection note" /></div><Button type="submit" disabled={savingPayment || !lookup}><Banknote className="size-4" aria-hidden />{savingPayment ? "Recording..." : "Confirm transport fare"}</Button>{paymentMessage ? <p className={`mt-3 text-sm font-bold ${paymentMessage.ok ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}>{paymentMessage.message}</p> : null}</form></section>
    <section className="ref-panel"><div className="flex items-start gap-3"><span className="ref-avatar"><Route className="size-5" aria-hidden /></span><div><h2 className="text-base font-black text-[var(--portal-text)]">Set route fare</h2><p className="mt-1 text-sm">Each active route has one current collection plan. Replacing it preserves its previous receipt history.</p></div></div>{routes.length ? <form onSubmit={savePlan} className="mt-5 grid gap-4"><div><Label>Route</Label><Select name="routeId" required defaultValue=""><option value="" disabled>Select a route</option>{routes.map((route) => <option key={route.id} value={route.id}>{route.name}</option>)}</Select></div><div className="grid gap-4 sm:grid-cols-2"><div><Label>Plan name</Label><Input name="name" defaultValue="Transport fare" required /></div><div><Label>Amount (GHS)</Label><Input name="amount" type="number" min="0.01" step="0.01" required /></div><div><Label>Collection frequency</Label><Select name="frequency" defaultValue="daily"><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="termly">Termly</option></Select></div><div><Label>Effective from</Label><Input name="effectiveFrom" type="date" defaultValue={today} required /></div></div><div><Label>Notes</Label><Textarea name="notes" placeholder="Optional fare plan note" /></div><Button type="submit" variant="secondary" disabled={savingPlan}><Route className="size-4" aria-hidden />{savingPlan ? "Saving..." : "Save route fare"}</Button>{planMessage ? <p className={`text-sm font-bold ${planMessage.ok ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}>{planMessage.message}</p> : null}</form> : <p className="mt-5 text-sm font-semibold text-[var(--portal-muted)]">Create an active transport route before setting a fare.</p>}</section>
  </div>;
}
