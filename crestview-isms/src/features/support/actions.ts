"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRoles, requireUser } from "@/features/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database.types";

const ticketSchema = z.object({
  title: z.string().trim().min(3).max(160),
  category: z.string().trim().min(2).max(80),
  priority: z.enum(["low", "normal", "high", "urgent"]),
  description: z.string().trim().min(10).max(2000)
});

const ticketStatusSchema = z.object({
  ticketId: z.string().uuid(),
  status: z.enum(["open", "in_progress", "waiting", "resolved", "closed"]),
  priority: z.enum(["low", "normal", "high", "urgent"])
});

function ticketNumber() {
  return `IT-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
}

export async function createSupportTicketAction(formData: FormData) {
  const result = ticketSchema.safeParse({
    title: String(formData.get("title") ?? ""),
    category: String(formData.get("category") ?? ""),
    priority: String(formData.get("priority") ?? "normal"),
    description: String(formData.get("description") ?? "")
  });
  if (!result.success) return { ok: false, message: result.error.issues[0]?.message ?? "Check the support ticket." };

  const { user } = await requireUser();
  const admin = createAdminClient();
  const number = ticketNumber();
  const { data: ticketData, error } = await admin.from("support_tickets").insert({
    ticket_number: number,
    requester_id: user.id,
    title: result.data.title,
    description: result.data.description,
    priority: result.data.priority,
    category: result.data.category,
    status: "open",
    metadata: { source: "portal" } satisfies Json
  }).select("id").single();

  if (!error && ticketData) {
    const { data: recipients } = await admin
      .from("profiles")
      .select("id,roles(name)")
      .in("roles.name", ["super_admin", "school_admin", "it_support"])
      .is("deleted_at", null);
    const recipientIds = ((recipients ?? []) as unknown as Array<{ id: string }>).map((recipient) => recipient.id).filter((id) => id !== user.id);
    if (recipientIds.length) {
      await admin.from("notifications").insert(recipientIds.map((recipientId) => ({
        recipient_id: recipientId,
        title: `New IT ticket ${number}`,
        body: result.data.title,
        type: "support",
        metadata: { ticket_id: (ticketData as { id: string }).id, priority: result.data.priority }
      })));
    }
  }

  revalidatePath("/it");
  revalidatePath("/it/tickets");
  revalidatePath("/admin");
  return error ? { ok: false, message: "The support ticket could not be created." } : { ok: true, message: `Ticket ${number} created.` };
}

export async function updateSupportTicketStatusAction(formData: FormData) {
  const result = ticketStatusSchema.safeParse({
    ticketId: String(formData.get("ticketId") ?? ""),
    status: String(formData.get("status") ?? ""),
    priority: String(formData.get("priority") ?? "")
  });
  if (!result.success) return { ok: false, message: result.error.issues[0]?.message ?? "Check the ticket update." };

  const { user } = await requireRoles(["super_admin", "school_admin", "it_support"]);
  const admin = createAdminClient();
  const { error } = await admin.from("support_tickets").update({
    status: result.data.status,
    priority: result.data.priority,
    assigned_to: user.id,
    resolved_at: ["resolved", "closed"].includes(result.data.status) ? new Date().toISOString() : null
  }).eq("id", result.data.ticketId);

  revalidatePath("/it");
  revalidatePath("/it/tickets");
  return error ? { ok: false, message: "The ticket could not be updated." } : { ok: true, message: "Ticket updated." };
}
