"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createWorkflowTask } from "@/features/automation/actions";
import { requireRoles } from "@/features/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database.types";

const payrollSchema = z.object({
  payrollPeriodId: z.string().uuid().optional().or(z.literal("")),
  name: z.string().trim().max(120).optional(),
  startsOn: z.string().optional().or(z.literal("")),
  endsOn: z.string().optional().or(z.literal("")),
  closeAfterProcessing: z.boolean()
});

function monthBounds(date = new Date()) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
  const label = new Intl.DateTimeFormat("en", { month: "long", year: "numeric", timeZone: "UTC" }).format(start);
  return {
    label,
    startsOn: start.toISOString().slice(0, 10),
    endsOn: end.toISOString().slice(0, 10)
  };
}

function payrollNumber(value: unknown) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) && number >= 0 ? number : 0;
}

export async function processPayrollAction(formData?: FormData) {
  const defaults = monthBounds();
  const result = payrollSchema.safeParse({
    payrollPeriodId: String(formData?.get("payrollPeriodId") ?? ""),
    name: String(formData?.get("name") ?? `${defaults.label} Payroll`),
    startsOn: String(formData?.get("startsOn") ?? defaults.startsOn),
    endsOn: String(formData?.get("endsOn") ?? defaults.endsOn),
    closeAfterProcessing: String(formData?.get("closeAfterProcessing") ?? "") === "on"
  });
  if (!result.success) return { ok: false, message: result.error.issues[0]?.message ?? "Check the payroll period." };

  const startsOn = result.data.startsOn || defaults.startsOn;
  const endsOn = result.data.endsOn || defaults.endsOn;
  if (new Date(endsOn) < new Date(startsOn)) return { ok: false, message: "Payroll end date must be after the start date." };

  const { user } = await requireRoles(["super_admin", "school_admin", "hr_staff", "finance_officer"]);
  const admin = createAdminClient();
  let period: { id: string; name: string; status: string } | null = null;

  if (result.data.payrollPeriodId) {
    const { data } = await admin
      .from("payroll_periods")
      .select("id,name,status")
      .eq("id", result.data.payrollPeriodId)
      .is("deleted_at", null)
      .maybeSingle();
    period = data as { id: string; name: string; status: string } | null;
  } else {
    const periodName = result.data.name || `${defaults.label} Payroll`;
    const existing = await admin
      .from("payroll_periods")
      .select("id,name,status")
      .eq("name", periodName)
      .is("deleted_at", null)
      .maybeSingle();
    period = existing.data as { id: string; name: string; status: string } | null;
    if (!period) {
      const created = await admin
        .from("payroll_periods")
        .insert({ name: periodName, starts_on: startsOn, ends_on: endsOn, status: "open" })
        .select("id,name,status")
        .single();
      if (created.error) return { ok: false, message: "The payroll period could not be created." };
      period = created.data as { id: string; name: string; status: string } | null;
    }
  }

  if (!period) return { ok: false, message: "The payroll period could not be found." };

  const [staffResult, existingItems] = await Promise.all([
    admin
      .from("staff_profiles")
      .select("id,profile_id,metadata,profiles!staff_profiles_profile_id_fkey(first_name,last_name,is_active)")
      .is("deleted_at", null),
    admin
      .from("payroll_items")
      .select("staff_profile_id")
      .eq("payroll_period_id", period.id)
      .is("deleted_at", null)
  ]);

  const existingProfileIds = new Set(((existingItems.data ?? []) as Array<{ staff_profile_id: string }>).map((item) => item.staff_profile_id));
  const staffRows = ((staffResult.data ?? []) as unknown as Array<{
    id: string;
    profile_id: string;
    metadata: Record<string, unknown> | null;
    profiles: { is_active: boolean | null } | { is_active: boolean | null }[] | null;
  }>).filter((staff) => {
    const profile = Array.isArray(staff.profiles) ? staff.profiles[0] ?? null : staff.profiles;
    return profile?.is_active !== false && !existingProfileIds.has(staff.profile_id);
  });

  if (staffRows.length) {
    const { error: itemError } = await admin.from("payroll_items").insert(staffRows.map((staff) => ({
      payroll_period_id: period.id,
      staff_profile_id: staff.profile_id,
      gross_pay: payrollNumber(staff.metadata?.default_gross_pay),
      deductions: payrollNumber(staff.metadata?.default_deductions)
    })));
    if (itemError) return { ok: false, message: "Payroll staff lines could not be prepared." };
  }

  const status = result.data.closeAfterProcessing ? "closed" : "processing";
  await admin.from("payroll_periods").update({ status }).eq("id", period.id);
  await Promise.all([
    admin.from("audit_logs").insert({
      actor_id: user.id,
      action: "PROCESS payroll_period",
      table_name: "payroll_periods",
      record_id: period.id,
      after: { status, added_payroll_items: staffRows.length } satisfies Json
    }),
    createWorkflowTask({
      title: `${period.name} payroll review`,
      workflowKey: "hr_follow_up",
      description: `${staffRows.length} staff payroll line${staffRows.length === 1 ? "" : "s"} prepared. Finance and HR should review deductions, allowances, and approval state.`,
      priority: status === "closed" ? "normal" : "high",
      createdBy: user.id,
      relatedTable: "payroll_periods",
      relatedRecordId: period.id,
      metadata: { source: "payroll_processor", status, added_payroll_items: staffRows.length } satisfies Json
    }),
    status === "processing"
      ? createWorkflowTask({
          title: `${period.name} finance verification`,
          workflowKey: "finance_collection",
          description: "Review payroll totals against approved staff records before closure.",
          priority: "normal",
          createdBy: user.id,
          relatedTable: "payroll_periods",
          relatedRecordId: period.id,
          metadata: { source: "payroll_processor", status } satisfies Json
        })
      : Promise.resolve(null)
  ]);

  revalidatePath("/hr");
  revalidatePath("/hr/payroll");
  revalidatePath("/finance");
  revalidatePath("/finance/payroll");
  revalidatePath("/admin/automation");
  return { ok: true, message: `${period.name} prepared with ${staffRows.length} new staff payroll line${staffRows.length === 1 ? "" : "s"}.` };
}
