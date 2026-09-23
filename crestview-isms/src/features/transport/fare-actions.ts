"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRoles } from "@/features/auth/guards";
import { normalizeStudentNumber } from "@/lib/students/student-number";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database.types";

const farePlanSchema = z.object({
  routeId: z.string().uuid(),
  name: z.string().trim().min(2).max(120),
  amount: z.coerce.number().positive().max(999999),
  currency: z.string().trim().length(3).default("GHS"),
  frequency: z.enum(["daily", "weekly", "monthly", "termly"]),
  effectiveFrom: z.string().date(),
  notes: z.string().trim().max(1000).optional(),
});

const farePaymentSchema = z.object({
  studentLookup: z.string().trim().min(4).max(200),
  paymentDate: z.string().date(),
  method: z.enum(["cash", "mobile_money", "card", "bank", "other"]),
  status: z.enum(["paid", "waived"]).default("paid"),
  reference: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(1000).optional(),
});

type Relation<T> = T | T[] | null;
type TransportStudent = {
  id: string;
  student_number: string;
  status: string;
  profiles: Relation<{ first_name: string; last_name: string }>;
};
type TransportAssignment = { id: string; route_id: string | null };
type FarePlan = {
  id: string;
  route_id: string;
  name: string;
  amount: number;
  currency: string;
  collection_frequency: "daily" | "weekly" | "monthly" | "termly";
};

function one<T>(value: Relation<T> | undefined) {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

function displayName(student: TransportStudent) {
  const profile = one(student.profiles);
  return profile ? `${profile.first_name} ${profile.last_name}` : student.student_number;
}

function normalizeStudentLookup(value: string) {
  return normalizeStudentNumber(
    value.trim().replace(/^(?:CIS-STUDENT|CRESTVIEW-STUDENT|STU)[:\s-]+/i, ""),
  );
}

function collectionPeriod(paymentDate: string, frequency: FarePlan["collection_frequency"]) {
  const date = new Date(`${paymentDate}T12:00:00Z`);
  if (frequency === "daily") return paymentDate;
  if (frequency === "monthly") return paymentDate.slice(0, 7);
  if (frequency === "termly") return `${date.getUTCFullYear()}-T${Math.floor(date.getUTCMonth() / 4) + 1}`;

  const jan1 = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date.getTime() - jan1.getTime()) / 86400000 + jan1.getUTCDay() + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function fareReference(studentNumber: string, paymentDate: string) {
  const identity = studentNumber.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  return `TRANS-${paymentDate.replaceAll("-", "")}-${identity}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
}

async function findStudentByLookup(
  admin: ReturnType<typeof createAdminClient>,
  lookup: string,
) {
  const raw = lookup.trim();
  const normalized = normalizeStudentLookup(raw);
  const { data: cardData } = await admin
    .from("student_id_cards")
    .select("student_id")
    .eq("qr_payload", raw)
    .is("deleted_at", null)
    .maybeSingle();
  const card = cardData as { student_id: string } | null;
  let query = admin
    .from("students")
    .select("id,student_number,status,profiles!students_profile_id_fkey(first_name,last_name)")
    .is("deleted_at", null);
  query = card?.student_id ? query.eq("id", card.student_id) : query.eq("student_number", normalized);
  const { data } = await query.maybeSingle();
  return data as unknown as TransportStudent | null;
}

async function notifyGuardians(studentId: string, paymentId: string, body: string) {
  const admin = createAdminClient();
  const { data: parents } = await admin
    .from("parent_students")
    .select("parent_profile_id")
    .eq("student_id", studentId)
    .is("deleted_at", null);
  const recipientIds = Array.from(
    new Set(
      ((parents ?? []) as Array<{ parent_profile_id: string }>)
        .map((row) => row.parent_profile_id)
        .filter((profileId): profileId is string => typeof profileId === "string"),
    ),
  );
  if (!recipientIds.length) return;
  await admin.from("notifications").insert(
    recipientIds.map((recipientId) => ({
      recipient_id: recipientId,
      title: "Transport fare recorded",
      body,
      type: "finance",
      metadata: { transport_fare_payment_id: paymentId, student_id: studentId } satisfies Json,
    })),
  );
}

export async function configureTransportFarePlanAction(formData: FormData) {
  const result = farePlanSchema.safeParse({
    routeId: String(formData.get("routeId") ?? ""),
    name: String(formData.get("name") ?? ""),
    amount: String(formData.get("amount") ?? ""),
    currency: String(formData.get("currency") ?? "GHS"),
    frequency: String(formData.get("frequency") ?? "daily"),
    effectiveFrom: String(formData.get("effectiveFrom") ?? ""),
    notes: String(formData.get("notes") ?? "") || undefined,
  });
  if (!result.success) return { ok: false, message: result.error.issues[0]?.message ?? "Check the transport fare plan." };

  const { user } = await requireRoles(["super_admin", "school_admin", "finance_officer"]);
  const admin = createAdminClient();
  const { data: routeData } = await admin
    .from("transport_routes")
    .select("id,name,is_active")
    .eq("id", result.data.routeId)
    .is("deleted_at", null)
    .maybeSingle();
  const route = routeData as { id: string; name: string; is_active: boolean } | null;
  if (!route?.is_active) return { ok: false, message: "Choose an active transport route before setting its fare." };

  await admin
    .from("transport_fare_plans")
    .update({ is_active: false })
    .eq("route_id", route.id)
    .eq("is_active", true)
    .is("deleted_at", null);
  const { error } = await admin.from("transport_fare_plans").insert({
    route_id: route.id,
    name: result.data.name,
    amount: result.data.amount,
    currency: result.data.currency.toUpperCase(),
    collection_frequency: result.data.frequency,
    effective_from: result.data.effectiveFrom,
    is_active: true,
    created_by: user.id,
    notes: result.data.notes || null,
    metadata: { source: "transport_fare_plan_form" } satisfies Json,
  });
  revalidatePath("/transport");
  revalidatePath("/transport/fares");
  return error
    ? { ok: false, message: "The transport fare plan could not be saved." }
    : { ok: true, message: `${route.name} transport fare is ready for collection.` };
}

export async function recordTransportFarePaymentAction(formData: FormData) {
  const result = farePaymentSchema.safeParse({
    studentLookup: String(formData.get("studentLookup") ?? ""),
    paymentDate: String(formData.get("paymentDate") ?? ""),
    method: String(formData.get("method") ?? "cash"),
    status: String(formData.get("status") ?? "paid"),
    reference: String(formData.get("reference") ?? "") || undefined,
    notes: String(formData.get("notes") ?? "") || undefined,
  });
  if (!result.success) return { ok: false, message: result.error.issues[0]?.message ?? "Check the transport fare payment." };

  const { user } = await requireRoles(["super_admin", "school_admin", "finance_officer"]);
  const admin = createAdminClient();
  const student = await findStudentByLookup(admin, result.data.studentLookup);
  if (!student || student.status !== "active") return { ok: false, message: "No active student matched that ID or QR code." };

  const { data: assignmentData } = await admin
    .from("student_transport_assignments")
    .select("id,route_id")
    .eq("student_id", student.id)
    .lte("starts_on", result.data.paymentDate)
    .or(`ends_on.is.null,ends_on.gte.${result.data.paymentDate}`)
    .is("deleted_at", null)
    .order("starts_on", { ascending: false })
    .limit(1)
    .maybeSingle();
  const assignment = assignmentData as TransportAssignment | null;
  if (!assignment?.route_id) return { ok: false, message: "This student does not have an active transport route assignment for that date." };

  const { data: planData } = await admin
    .from("transport_fare_plans")
    .select("id,route_id,name,amount,currency,collection_frequency")
    .eq("route_id", assignment.route_id)
    .eq("is_active", true)
    .lte("effective_from", result.data.paymentDate)
    .or(`effective_to.is.null,effective_to.gte.${result.data.paymentDate}`)
    .is("deleted_at", null)
    .order("effective_from", { ascending: false })
    .limit(1)
    .maybeSingle();
  const plan = planData as FarePlan | null;
  if (!plan) return { ok: false, message: "Set an active transport fare plan for this route before collecting payment." };

  const period = collectionPeriod(result.data.paymentDate, plan.collection_frequency);
  const { data: existingData } = await admin
    .from("transport_fare_payments")
    .select("id,status")
    .eq("student_id", student.id)
    .eq("collection_period", period)
    .in("status", ["paid", "waived"])
    .is("deleted_at", null)
    .maybeSingle();
  if (existingData) return { ok: true, message: `${displayName(student)} already has a transport fare record for this ${plan.collection_frequency} period.` };

  const amount = result.data.status === "waived" ? 0 : Number(plan.amount);
  const reference = result.data.reference || fareReference(student.student_number, result.data.paymentDate);
  const { data: paymentData, error } = await admin
    .from("transport_fare_payments")
    .insert({
      student_id: student.id,
      assignment_id: assignment.id,
      route_id: assignment.route_id,
      fare_plan_id: plan.id,
      payment_date: result.data.paymentDate,
      collection_period: period,
      student_number: student.student_number,
      qr_payload: student.student_number,
      amount,
      currency: plan.currency,
      method: result.data.method,
      status: result.data.status,
      reference,
      recorded_by: user.id,
      notes: result.data.notes || null,
      metadata: { source: "transport_qr_or_id_collection", lookup: result.data.studentLookup.trim(), fare_plan_name: plan.name } satisfies Json,
    })
    .select("id")
    .single();
  const payment = paymentData as { id: string } | null;
  if (error || !payment) return { ok: false, message: "The transport fare could not be recorded. Check the receipt reference and try again." };

  await notifyGuardians(
    student.id,
    payment.id,
    `${displayName(student)}'s ${plan.collection_frequency} transport fare for ${result.data.paymentDate} was recorded as ${plan.currency} ${amount.toLocaleString("en-GH")}.`,
  );
  revalidatePath("/transport");
  revalidatePath("/transport/fares");
  revalidatePath("/finance");
  revalidatePath("/parent");
  return { ok: true, message: `Transport fare recorded for ${displayName(student)} (${student.student_number}).` };
}
