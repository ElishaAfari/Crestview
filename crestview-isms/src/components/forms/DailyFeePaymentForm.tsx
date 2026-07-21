"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Banknote } from "lucide-react";
import { StudentQrCapture } from "@/components/forms/StudentQrCapture";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { recordDailyFeePaymentAction } from "@/features/fees/actions";

type DailyFeePaymentValues = {
  studentLookup: string;
  paymentDate: string;
  amount?: number;
  currency: string;
  method: "cash" | "mobile_money" | "card" | "bank" | "other";
  status: "paid" | "waived";
  reference?: string;
  notes?: string;
};

export function DailyFeePaymentForm() {
  const form = useForm<DailyFeePaymentValues>({
    defaultValues: {
      studentLookup: "",
      paymentDate: new Date().toISOString().slice(0, 10),
      currency: "GHS",
      method: "cash",
      status: "paid"
    }
  });
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const studentLookup = form.watch("studentLookup");

  async function onSubmit(values: DailyFeePaymentValues) {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      const safeValue = typeof value === "number" && Number.isNaN(value) ? "" : value;
      formData.set(key, String(safeValue ?? ""));
    });
    const result = await recordDailyFeePaymentAction(formData);
    setSubmitted(result.ok);
    setMessage(result.message);
    if (result.ok) {
      form.reset({
        studentLookup: "",
        paymentDate: values.paymentDate,
        currency: values.currency || "GHS",
        method: values.method,
        status: "paid"
      });
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      <StudentQrCapture
        value={studentLookup}
        onValue={(value) => form.setValue("studentLookup", value, { shouldDirty: true, shouldValidate: true })}
        placeholder="26000001 or scanned QR payload"
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <Label>Payment date</Label>
          <Input type="date" {...form.register("paymentDate")} />
        </div>
        <div>
          <Label>Amount override</Label>
          <Input type="number" min="0" step="0.01" placeholder="Use class fee by default" {...form.register("amount", { valueAsNumber: true })} />
        </div>
        <div>
          <Label>Currency</Label>
          <Input maxLength={3} {...form.register("currency")} />
        </div>
        <div>
          <Label>Status</Label>
          <Select {...form.register("status")}>
            <option value="paid">Paid</option>
            <option value="waived">Waived</option>
          </Select>
        </div>
        <div>
          <Label>Method</Label>
          <Select {...form.register("method")}>
            <option value="cash">Cash</option>
            <option value="mobile_money">Mobile Money</option>
            <option value="card">Card</option>
            <option value="bank">Bank</option>
            <option value="other">Other</option>
          </Select>
        </div>
        <div className="md:col-span-2 xl:col-span-3">
          <Label>Reference</Label>
          <Input placeholder="Optional receipt or MoMo reference" {...form.register("reference")} />
        </div>
      </div>
      <div>
        <Label>Notes</Label>
        <Textarea placeholder="Optional note for finance records" {...form.register("notes")} />
      </div>
      <div className="flex flex-col items-start gap-3">
        <Button type="submit" disabled={form.formState.isSubmitting}>
          <Banknote className="size-4" aria-hidden />
          {form.formState.isSubmitting ? "Recording..." : "Record daily payment"}
        </Button>
        {message ? <p className={`text-sm font-black ${submitted ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}>{message}</p> : null}
      </div>
    </form>
  );
}
