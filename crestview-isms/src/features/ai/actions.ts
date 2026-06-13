"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRoles } from "@/features/auth/guards";
import { createOpenAIClient } from "@/lib/ai/openai";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database.types";

const lessonPlanSchema = z.object({
  topic: z.string().trim().min(3, "Enter a lesson topic.").max(180),
  duration: z.string().trim().min(2).max(80),
  objectives: z.string().trim().min(10, "Add at least one learning objective.").max(2000),
  classLevel: z.string().trim().max(120).optional(),
  subject: z.string().trim().max(120).optional()
});

function fallbackPlan(input: z.infer<typeof lessonPlanSchema>) {
  return [
    `Lesson: ${input.topic}`,
    `Duration: ${input.duration}`,
    `Class/Subject: ${input.classLevel || "Selected class"} - ${input.subject || "Selected subject"}`,
    "",
    "Learning objectives",
    input.objectives,
    "",
    "1. Starter (5 minutes): Use a short question or demonstration to connect the topic to familiar learner experience.",
    "2. Direct teaching: Introduce the key vocabulary, model the main idea, and check understanding after each step.",
    "3. Guided practice: Let learners solve or demonstrate the skill in pairs while the teacher circulates.",
    "4. Independent practice: Give differentiated tasks for support, core, and extension groups.",
    "5. Assessment for learning: Use exit questions, quick oral checks, or a mini task marked against the objective.",
    "6. Homework/extension: Assign one short practice activity and one creative reflection question.",
    "",
    "Support plan: Pair learners who need help with confident peers and provide concrete examples before abstract work."
  ].join("\n");
}

export async function generateLessonPlanAction(formData: FormData) {
  const result = lessonPlanSchema.safeParse({
    topic: String(formData.get("topic") ?? ""),
    duration: String(formData.get("duration") ?? "45 minutes"),
    objectives: String(formData.get("objectives") ?? ""),
    classLevel: String(formData.get("classLevel") ?? ""),
    subject: String(formData.get("subject") ?? "")
  });
  if (!result.success) return { ok: false, message: result.error.issues[0]?.message ?? "Check the lesson plan details.", plan: "" };

  const { user } = await requireRoles(["super_admin", "school_admin", "teacher"]);
  const admin = createAdminClient();
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  let plan = fallbackPlan(result.data);
  let promptTokens = 0;
  let completionTokens = 0;
  let source: "fallback" | "openai" = "fallback";

  if (process.env.OPENAI_API_KEY) {
    try {
      const openai = createOpenAIClient();
      const completion = await openai.chat.completions.create({
        model,
        temperature: 0.45,
        messages: [
          {
            role: "system",
            content: "You create practical, age-appropriate lesson plans for Crestview International School's hybrid Cambridge and GES curriculum. Keep plans structured, teacher-ready, inclusive, and assessment-focused."
          },
          {
            role: "user",
            content: `Create a lesson plan.\nTopic: ${result.data.topic}\nDuration: ${result.data.duration}\nClass: ${result.data.classLevel || "not specified"}\nSubject: ${result.data.subject || "not specified"}\nObjectives: ${result.data.objectives}`
          }
        ]
      });
      plan = completion.choices[0]?.message.content?.trim() || plan;
      promptTokens = completion.usage?.prompt_tokens ?? 0;
      completionTokens = completion.usage?.completion_tokens ?? 0;
      source = "openai";
    } catch {
      source = "fallback";
    }
  }

  await Promise.all([
    admin.from("ai_usage_logs").insert({
      profile_id: user.id,
      route: "ai:lesson_planner",
      model,
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      metadata: {
        topic: result.data.topic,
        duration: result.data.duration,
        class_level: result.data.classLevel,
        subject: result.data.subject,
        source
      } satisfies Json
    }),
    admin.from("system_jobs").insert({
      job_type: "ai_lesson_plan_generation",
      status: "succeeded",
      payload: {
        topic: result.data.topic,
        duration: result.data.duration,
        class_level: result.data.classLevel,
        subject: result.data.subject
      } satisfies Json,
      result: { source, preview: plan.slice(0, 500) } satisfies Json,
      started_at: new Date().toISOString(),
      finished_at: new Date().toISOString()
    })
  ]);

  revalidatePath("/teacher/lesson-planner");
  revalidatePath("/admin/automation");
  return {
    ok: true,
    message: source === "openai" ? "Lesson plan generated and logged." : "Lesson plan generated with the local planner because OpenAI is not configured.",
    plan
  };
}
