"use client";

import { useState } from "react";
import { LifeBuoy, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { createSupportTicketAction, updateSupportTicketStatusAction } from "@/features/support/actions";

type TicketRecord = {
  id?: unknown;
  ticket_number?: unknown;
  title?: unknown;
  priority?: unknown;
  status?: unknown;
  category?: unknown;
  created_at?: unknown;
};

function text(value: unknown, fallback = "-") {
  return value === null || value === undefined || value === "" ? fallback : String(value);
}

export function SupportTicketRegister({ records = [] }: { records?: Array<Record<string, unknown>> }) {
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, setPending] = useState(false);

  async function createTicket(formData: FormData) {
    setPending(true);
    const result = await createSupportTicketAction(formData);
    setMessage({ ok: result.ok, text: result.message });
    setPending(false);
    const form = document.getElementById("support-ticket-form") as HTMLFormElement | null;
    if (result.ok) form?.reset();
  }

  async function updateTicket(formData: FormData) {
    await updateSupportTicketStatusAction(formData);
  }

  return (
    <div className="space-y-5">
      <form id="support-ticket-form" action={createTicket} className="portal-subtle-card grid gap-4 rounded-lg p-4 md:grid-cols-2">
        <div>
          <Label>Issue title</Label>
          <Input name="title" placeholder="Projector not connecting" />
        </div>
        <div>
          <Label>Category</Label>
          <Select name="category" defaultValue="Device">
            <option>Device</option>
            <option>Portal access</option>
            <option>Internet</option>
            <option>Payments</option>
            <option>Data correction</option>
          </Select>
        </div>
        <div>
          <Label>Priority</Label>
          <Select name="priority" defaultValue="normal">
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </Select>
        </div>
        <div className="md:col-span-2">
          <Label>Description</Label>
          <Textarea name="description" placeholder="Explain what is affected, where it happened, and when it started." />
        </div>
        <div className="md:col-span-2 flex flex-col items-start gap-3">
          <Button type="submit" disabled={pending}>
            <LifeBuoy className="size-4" aria-hidden />{pending ? "Creating..." : "Create IT ticket"}
          </Button>
          {message ? <p className={`text-sm font-black ${message.ok ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}>{message.text}</p> : null}
        </div>
      </form>

      {records.length ? (
        <div className="portal-table-wrap">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="portal-table-head text-xs uppercase">
              <tr>
                <th className="px-4 py-3">Ticket</th>
                <th className="px-4 py-3">Issue</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Controls</th>
              </tr>
            </thead>
            <tbody>
              {(records as TicketRecord[]).map((record, index) => (
                <tr key={String(record.id ?? index)} className="portal-table-row">
                  <td className="px-4 py-3 font-black text-[var(--portal-text)]">{text(record.ticket_number)}</td>
                  <td className="max-w-72 truncate px-4 py-3 font-semibold text-[var(--portal-text)]">{text(record.title)}</td>
                  <td className="px-4 py-3 font-semibold text-[var(--portal-muted)]">{text(record.category)}</td>
                  <td className="px-4 py-3"><StatusBadge status={text(record.status, "open")} /></td>
                  <td className="px-4 py-3 font-black capitalize text-[var(--portal-text)]">{text(record.priority, "normal")}</td>
                  <td className="px-4 py-3">
                    <form action={updateTicket} className="flex flex-wrap items-center gap-2">
                      <input type="hidden" name="ticketId" value={String(record.id ?? "")} />
                      <Select name="status" defaultValue={text(record.status, "open")} className="h-9 w-36">
                        <option value="open">Open</option>
                        <option value="in_progress">In progress</option>
                        <option value="waiting">Waiting</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </Select>
                      <Select name="priority" defaultValue={text(record.priority, "normal")} className="h-9 w-28">
                        <option value="low">Low</option>
                        <option value="normal">Normal</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </Select>
                      <Button type="submit" variant="secondary" size="sm">
                        <Save className="size-3.5" aria-hidden />Save
                      </Button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm font-bold text-[var(--portal-muted)]">No IT support tickets yet.</p>
      )}
    </div>
  );
}
