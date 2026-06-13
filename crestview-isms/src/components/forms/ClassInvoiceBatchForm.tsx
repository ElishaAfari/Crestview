"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Plus, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createClassInvoiceBatchAction } from "@/features/fees/actions";
import type { SelectOption } from "@/features/admin/queries";

type ClassInvoiceFormValues = {
  classroomId: string;
  title: string;
  description?: string;
  amount: number;
  currency: string;
  dueDate: string;
};
type FeeItem = { description: string; quantity: number; unitAmount: number };

function blankItem(): FeeItem {
  return { description: "", quantity: 1, unitAmount: 0 };
}

export function ClassInvoiceBatchForm({ classrooms = [] }: { classrooms?: SelectOption[] }) {
  const form = useForm<ClassInvoiceFormValues>({
    defaultValues: {
      classroomId: classrooms[0]?.id ?? "",
      title: "Term fees",
      currency: "GHS"
    }
  });
  const [items, setItems] = useState<FeeItem[]>([
    { description: "Tuition", quantity: 1, unitAmount: 0 },
    { description: "Learning materials", quantity: 1, unitAmount: 0 }
  ]);
  const [message, setMessage] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const itemTotal = items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unitAmount || 0), 0);

  function updateItem(index: number, field: keyof FeeItem, value: string) {
    setItems((current) => current.map((item, itemIndex) => itemIndex === index ? {
      ...item,
      [field]: field === "description" ? value : Number(value)
    } : item));
  }

  function removeItem(index: number) {
    setItems((current) => current.length === 1 ? [blankItem()] : current.filter((_, itemIndex) => itemIndex !== index));
  }

  async function onSubmit(values: ClassInvoiceFormValues) {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => formData.set(key, String(value ?? "")));
    const cleanItems = items
      .map((item) => ({ description: item.description.trim(), quantity: Number(item.quantity || 0), unitAmount: Number(item.unitAmount || 0) }))
      .filter((item) => item.description && item.quantity > 0 && item.unitAmount > 0);
    formData.set("feeItemsJson", JSON.stringify(cleanItems));
    if (cleanItems.length) formData.set("amount", String(itemTotal.toFixed(2)));
    const result = await createClassInvoiceBatchAction(formData);
    setSubmitted(result.ok);
    setMessage(result.message);
    if (result.ok) {
      form.reset({ classroomId: classrooms[0]?.id ?? "", title: "Term fees", currency: "GHS" });
      setItems([{ description: "Tuition", quantity: 1, unitAmount: 0 }, { description: "Learning materials", quantity: 1, unitAmount: 0 }]);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 xl:grid-cols-2">
      <div>
        <Label>Class or level</Label>
        <Select {...form.register("classroomId")}>
          <option value="">Choose class</option>
          {classrooms.map((classroom) => <option key={classroom.id} value={classroom.id}>{classroom.label}</option>)}
        </Select>
      </div>
      <div>
        <Label>Invoice title</Label>
        <Input placeholder="Primary 1 Term 1 fees" {...form.register("title")} />
      </div>
      <div>
        <Label>Amount per student</Label>
        <Input type="number" min="0" step="0.01" placeholder="Use when no line items are entered" {...form.register("amount", { valueAsNumber: true })} />
      </div>
      <div>
        <Label>Currency</Label>
        <Input maxLength={3} {...form.register("currency")} />
      </div>
      <div>
        <Label>Due date</Label>
        <Input type="date" {...form.register("dueDate")} />
      </div>
      <div className="xl:row-span-2">
        <Label>Description</Label>
        <Textarea placeholder="Optional billing note for parents" {...form.register("description")} />
      </div>
      <div className="xl:col-span-2">
        <div className="mb-2 flex items-center justify-between gap-3">
          <Label>Fee sheet line items</Label>
          <Button type="button" variant="secondary" size="sm" onClick={() => setItems((current) => [...current, blankItem()])}>
            <Plus className="size-3.5" aria-hidden />Add item
          </Button>
        </div>
        <div className="portal-table-wrap">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="portal-table-head text-xs uppercase">
              <tr>
                <th className="px-3 py-2">Description</th>
                <th className="w-28 px-3 py-2">Qty</th>
                <th className="w-40 px-3 py-2">Unit amount</th>
                <th className="w-40 px-3 py-2 text-right">Line total</th>
                <th className="w-16 px-3 py-2">Remove</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index} className="portal-table-row">
                  <td className="px-3 py-2"><Input value={item.description} onChange={(event) => updateItem(index, "description", event.target.value)} placeholder="Tuition" /></td>
                  <td className="px-3 py-2"><Input type="number" min="0.01" step="0.01" value={item.quantity} onChange={(event) => updateItem(index, "quantity", event.target.value)} /></td>
                  <td className="px-3 py-2"><Input type="number" min="0" step="0.01" value={item.unitAmount} onChange={(event) => updateItem(index, "unitAmount", event.target.value)} /></td>
                  <td className="px-3 py-2 text-right font-black text-[var(--portal-text)]">{(Number(item.quantity || 0) * Number(item.unitAmount || 0)).toFixed(2)}</td>
                  <td className="px-3 py-2">
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)} aria-label="Remove fee item">
                      <Trash2 className="size-4" aria-hidden />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-sm font-black text-[var(--portal-text)]">Computed total per student: {itemTotal.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
      </div>
      <div className="flex flex-col items-start gap-3 xl:col-span-2">
        <Button type="submit" disabled={form.formState.isSubmitting}>
          <Send className="size-4" aria-hidden />{form.formState.isSubmitting ? "Issuing class invoices..." : "Issue class invoice batch"}
        </Button>
        {message ? <p className={`text-sm font-black ${submitted ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}>{message}</p> : null}
      </div>
    </form>
  );
}
