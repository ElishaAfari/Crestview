"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRoles } from "@/features/auth/guards";

const createSchema = z.object({ name: z.string().trim().min(3).max(120), sourceYear: z.string().uuid(), targetYear: z.string().uuid() });
const completeSchema = z.object({ runId: z.string().uuid(), mappings: z.record(z.string().uuid(), z.union([z.string().uuid(), z.literal("")])), excluded: z.array(z.string().uuid()).max(10000) });
export type PromotionActionState = { ok: boolean; message: string; runId?: string };

export async function createPromotionRunAction(_: PromotionActionState, form: FormData): Promise<PromotionActionState> {
  const { supabase } = await requireRoles(["super_admin", "school_admin"]);
  const parsed = createSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, message: "Enter a batch name and choose both academic years." };
  const { data, error } = await supabase.rpc("create_promotion_run", {
    p_name: parsed.data.name, p_source_year: parsed.data.sourceYear, p_target_year: parsed.data.targetYear
  });
  if (error) return { ok: false, message: error.code === "P0001" ? error.message : "The promotion batch could not be created. Please retry." };
  revalidatePath("/students/promotions");
  return { ok: true, message: "Batch created. Review the class destinations and student list.", runId: String(data) };
}

export async function completePromotionRunAction(_: PromotionActionState, form: FormData): Promise<PromotionActionState> {
  const { supabase } = await requireRoles(["super_admin", "school_admin"]);
  let input: unknown;
  try { input = { runId: form.get("runId"), mappings: JSON.parse(String(form.get("mappings"))), excluded: JSON.parse(String(form.get("excluded"))) }; }
  catch { return { ok: false, message: "The promotion selection is invalid. Reload and try again." }; }
  const parsed = completeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Choose valid destination classes and students." };
  const { data, error } = await supabase.rpc("complete_promotion_run", {
    p_run: parsed.data.runId, p_mappings: parsed.data.mappings, p_excluded: parsed.data.excluded
  });
  if (error) return { ok: false, message: error.code === "P0001" ? error.message : "The batch was not completed. No partial promotion has been saved. Please retry." };
  revalidatePath("/", "layout");
  const result = data as { count: number; alreadyCompleted: boolean };
  return { ok: true, message: `${result.count} students promoted. Enrollment history and account access are updated.`, runId: parsed.data.runId };
}
