"use server";

import { revalidatePath } from "next/cache";
import { findOperationsWorkspace, type OperationsCreateField } from "@/config/operations";
import { requireRoles } from "@/features/auth/guards";
import type { Json, RoleName } from "@/types/database.types";

type ActionState = { ok: boolean; message: string };

function permittedRoles(roles: RoleName[]) {
  return Array.from(new Set<RoleName>(["super_admin", "school_admin", ...roles]));
}

function reference(prefix: string) {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `${prefix}-${date}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
}

function parseTags(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function parseField(field: OperationsCreateField, raw: FormDataEntryValue | null) {
  const value = String(raw ?? "").trim();
  if (!value && field.type !== "checkbox") return null;
  if (field.type === "checkbox") return raw === "on" || value === "true";
  if (field.type === "number") return Number(value);
  if (field.type === "tags") return parseTags(value);
  if (field.type === "datetime") return value ? new Date(value).toISOString() : null;
  return value;
}

function validateRequired(fields: OperationsCreateField[], formData: FormData) {
  for (const field of fields) {
    if (!field.required) continue;
    const value = String(formData.get(field.key) ?? "").trim();
    if (!value) return `${field.label} is required.`;
    if (field.type === "number" && Number.isNaN(Number(value))) return `${field.label} must be a valid number.`;
  }
  return null;
}

function addComputedValues(table: string, record: Record<string, unknown>, userId: string) {
  switch (table) {
    case "front_office_enquiries":
      record.enquiry_number = reference("ENQ");
      record.created_by = userId;
      break;
    case "visitor_logs":
      record.recorded_by = userId;
      break;
    case "parent_complaints":
      record.complaint_number = reference("CMP");
      record.submitted_by = userId;
      break;
    case "communication_campaigns":
      record.created_by = userId;
      {
        const audienceRoles = Array.isArray(record.audience_roles) && record.audience_roles.length
          ? record.audience_roles
          : ["staff"];
        record.audience_roles = audienceRoles;
        record.audience_type = audienceRoles.length ? "roles" : "all";
      }
      break;
    case "staff_id_cards":
      record.card_number = reference("STAFF-CARD");
      break;
    case "id_card_verifications":
      record.verified_by = userId;
      record.verified_at = new Date().toISOString();
      break;
    case "preschool_daily_logs":
    case "preschool_observations":
    case "preschool_pickups":
      record.recorded_by = userId;
      break;
    case "preschool_incidents":
      record.incident_number = reference("PRE");
      record.recorded_by = userId;
      break;
    case "cashier_sessions":
      record.session_number = reference("CASH");
      record.cashier_id = userId;
      break;
    case "bursary_receipts":
      record.receipt_number = reference("RCT");
      record.recorded_by = userId;
      if (!record.currency) record.currency = "GHS";
      break;
    case "journal_entries":
      record.entry_number = reference("JE");
      if (record.status === "posted") record.posted_by = userId;
      break;
    case "supplier_bills":
      record.bill_number = reference("BILL");
      if (!record.currency) record.currency = "GHS";
      break;
    case "student_service_payments":
      record.payment_number = reference(record.service_type === "extra_classes" ? "EXT" : "FEED");
      record.recorded_by = userId;
      if (!record.currency) record.currency = "GHS";
      break;
    case "student_service_adjustments":
      record.adjustment_number = reference(record.service_type === "extra_classes" ? "EXT-ADJ" : "FEED-ADJ");
      break;
    case "boarding_assignments":
      record.assigned_by = userId;
      break;
    case "boarding_roll_calls":
    case "boarding_visitors":
      record.recorded_by = userId;
      break;
    case "boarding_exeats":
      record.exeat_number = reference("EXEAT");
      break;
    case "boarding_incidents":
      record.incident_number = reference("BD");
      record.recorded_by = userId;
      break;
    case "inventory_items":
      record.item_number = reference("INV");
      record.managed_by = userId;
      break;
    case "inventory_movements":
      record.movement_number = reference("MOV");
      record.performed_by = userId;
      break;
    case "transport_vehicles":
      record.vehicle_number = reference("BUS");
      break;
    case "transport_trip_logs":
      record.recorded_by = userId;
      break;
    case "exam_windows":
    case "class_subject_schemes":
    case "curriculum_units":
    case "announcements":
      record.created_by = userId;
      break;
    case "learner_wellbeing_cases":
      record.case_number = reference("CARE");
      record.opened_by = userId;
      break;
    case "expenses":
      record.expense_number = reference("EXP");
      record.created_by = userId;
      if (!record.currency) record.currency = "GHS";
      break;
    case "library_books":
      if (!Array.isArray(record.authors)) record.authors = [];
      break;
    default:
      break;
  }
  record.metadata = { ...(record.metadata as object | undefined), source: "operations_register" } satisfies Json;
}

export async function createOperationsRecordAction(workspaceKey: string, moduleKey: string, _previous: ActionState, formData: FormData): Promise<ActionState> {
  const workspace = findOperationsWorkspace(workspaceKey);
  const workspaceModule = workspace?.modules.find((item) => item.key === moduleKey);
  if (!workspace || !workspaceModule) return { ok: false, message: "This operations register is not configured." };
  if (!workspaceModule.createFields?.length) return { ok: false, message: "This register is read-only because it needs a linked record from another suite." };

  const requiredError = validateRequired(workspaceModule.createFields, formData);
  if (requiredError) return { ok: false, message: requiredError };

  const context = await requireRoles(permittedRoles(workspace.roles));
  const { user } = context;
  const record: Record<string, unknown> = {};
  for (const field of workspaceModule.createFields) {
    const value = parseField(field, formData.get(field.key));
    if (value !== null && value !== "") record[field.key] = value;
  }
  if (workspaceModule.filter && record[workspaceModule.filter.key] === undefined) {
    record[workspaceModule.filter.key] = workspaceModule.filter.value;
  }
  addComputedValues(workspaceModule.table, record, user.id);

  const { error } = await context.supabase.from(workspaceModule.table).insert(record);
  if (error) return { ok: false, message: `Could not create ${workspaceModule.label.toLowerCase()} record. Check required fields and try again.` };

  revalidatePath(`/${workspace.key}`);
  revalidatePath(`/${workspace.key}/${workspaceModule.key}`);
  revalidatePath("/admin");
  return { ok: true, message: `${workspaceModule.label} record created.` };
}
