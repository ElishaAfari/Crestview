"use server";

import { admissionSchema } from "@/lib/validations/admission.schema";

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
  return result.success ? { ok: true, message: "Admission application validated." } : { ok: false, message: result.error.issues[0]?.message ?? "Invalid application." };
}
