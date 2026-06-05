"use server";

import { revalidatePath } from "next/cache";
import { requireRoles } from "@/features/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { eventSchema } from "@/lib/validations/event.schema";

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}

export async function createEventAction(formData: FormData) {
  const result = eventSchema.safeParse({
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? "") || undefined,
    location: String(formData.get("location") ?? "") || undefined,
    startsAt: String(formData.get("startsAt") ?? ""),
    endsAt: String(formData.get("endsAt") ?? "") || undefined,
    audience: String(formData.get("audience") ?? "public")
  });

  if (!result.success) return { ok: false, message: result.error.issues[0]?.message ?? "Check the event details." };

  const { user } = await requireRoles(["super_admin", "school_admin"]);
  const admin = createAdminClient();
  const slug = `${slugify(result.data.title)}-${crypto.randomUUID().slice(0, 6)}`;
  const audience = result.data.audience === "all"
    ? ["public", "student", "parent", "teacher", "staff"]
    : [result.data.audience];
  const { error } = await admin.from("events").insert({
    title: result.data.title.trim(),
    slug,
    description: result.data.description?.trim() || null,
    location: result.data.location?.trim() || null,
    starts_at: new Date(result.data.startsAt).toISOString(),
    ends_at: result.data.endsAt ? new Date(result.data.endsAt).toISOString() : null,
    audience,
    status: "scheduled",
    created_by: user.id
  });

  if (error) return { ok: false, message: "The event could not be scheduled." };
  revalidatePath("/admin");
  revalidatePath("/admin/settings");
  revalidatePath("/events");
  return { ok: true, message: "Event scheduled and published to the selected audience." };
}
