"use server";

import { admissionSchema } from "@/lib/validations/admission.schema";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function submitAdmissionAction(formData: FormData) {
  const values = {
    applicantFirstName: String(formData.get("applicantFirstName") ?? ""),
    applicantLastName: String(formData.get("applicantLastName") ?? ""),
    applyingGrade: String(formData.get("applyingGrade") ?? ""),
    guardianEmail: String(formData.get("guardianEmail") ?? ""),
    guardianPhone: String(formData.get("guardianPhone") ?? ""),
    notes: String(formData.get("notes") ?? "")
  };

  const result = admissionSchema.safeParse(values);
  if (!result.success) {
    return { ok: false, message: result.error.issues[0]?.message ?? "Invalid application." };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("admission_applications").insert({
    applicant_first_name: result.data.applicantFirstName.trim(),
    applicant_last_name: result.data.applicantLastName.trim(),
    applying_grade: result.data.applyingGrade.trim(),
    guardian_email: result.data.guardianEmail.trim().toLowerCase(),
    guardian_phone: result.data.guardianPhone.trim(),
    notes: result.data.notes?.trim() || null,
    source: "school_website",
    status: "submitted"
  });

  return error
    ? { ok: false, message: "We could not submit the application. Please call the school for assistance." }
    : { ok: true, message: "Application received. Our admissions team will contact you shortly." };
}
