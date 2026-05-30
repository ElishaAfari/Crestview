"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { contactSchema } from "@/lib/validations/contact.schema";

export async function submitContactAction(formData: FormData) {
  const result = contactSchema.safeParse({
    fullName: String(formData.get("fullName") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    subject: String(formData.get("subject") ?? ""),
    message: String(formData.get("message") ?? "")
  });

  if (!result.success) {
    return { ok: false, message: result.error.issues[0]?.message ?? "Check your message." };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("contact_inquiries").insert({
    full_name: result.data.fullName,
    email: result.data.email.toLowerCase(),
    phone: result.data.phone || null,
    subject: result.data.subject || null,
    message: result.data.message,
    status: "new"
  });

  return error
    ? { ok: false, message: "We could not send your message. Please call the school for assistance." }
    : { ok: true, message: "Message sent. The Crestview team will get back to you shortly." };
}
