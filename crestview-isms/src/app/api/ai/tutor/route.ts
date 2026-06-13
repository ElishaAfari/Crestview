import { NextResponse, type NextRequest } from "next/server";
import { AI_LIMITS } from "@/lib/constants";
import { buildTutorSystemPrompt } from "@/lib/ai/prompts";
import { createOpenAIClient } from "@/lib/ai/openai";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type TutorRequest = {
  message?: string;
};

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const body = await request.json() as TutorRequest;
  const message = body.message?.trim();

  if (!message) {
    return NextResponse.json({ error: "A message is required." }, { status: 400 });
  }

  const windowStart = new Date(Math.floor(Date.now() / 3_600_000) * 3_600_000).toISOString();
  const { data: rateLimit } = await supabase
    .from("ai_rate_limits")
    .select("id, request_count")
    .eq("profile_id", user.id)
    .eq("route", "ai:tutor")
    .eq("window_start", windowStart)
    .maybeSingle();

  if (rateLimit && rateLimit.request_count >= AI_LIMITS.tutorRequestsPerHour) {
    return NextResponse.json({ error: "Tutor rate limit exceeded." }, { status: 429 });
  }

  if (rateLimit) {
    await supabase.from("ai_rate_limits").update({ request_count: rateLimit.request_count + 1 }).eq("id", rateLimit.id);
  } else {
    await supabase.from("ai_rate_limits").insert({ profile_id: user.id, route: "ai:tutor", window_start: windowStart, request_count: 1 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name,last_name")
    .eq("id", user.id)
    .maybeSingle();

  const systemPrompt = buildTutorSystemPrompt({
    name: profile ? `${profile.first_name} ${profile.last_name}` : "the student",
    grade: "their current grade",
    subjects: ["Mathematics", "English", "Science"],
    performanceSummary: "recent coursework is available in the school portal"
  });
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  const { data: sessionData } = await supabase
    .from("ai_tutor_sessions")
    .insert({
      profile_id: user.id,
      title: message.slice(0, 80),
      model,
      metadata: { source: "student_ai_tutor" }
    })
    .select("id")
    .single();
  const session = sessionData as { id: string } | null;
  if (session?.id) {
    await supabase.from("ai_tutor_messages").insert({
      session_id: session.id,
      role: "user",
      content: message,
      metadata: { source: "student_ai_tutor" }
    });
  }

  if (!process.env.OPENAI_API_KEY) {
    const fallback = "OpenAI is not configured. Add OPENAI_API_KEY to enable streaming tutor responses.";
    if (session?.id) {
      await supabase.from("ai_tutor_messages").insert({
        session_id: session.id,
        role: "assistant",
        content: fallback,
        metadata: { source: "configuration_fallback" }
      });
    }
    await supabase.from("ai_usage_logs").insert({
      profile_id: user.id,
      route: "ai:tutor",
      model,
      metadata: { source: "configuration_fallback", session_id: session?.id ?? null }
    });
    return new Response(fallback, {
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  }

  const openai = createOpenAIClient();
  const stream = await openai.chat.completions.create({
    model,
    stream: true,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: message }
    ]
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      let assistantText = "";
      for await (const chunk of stream) {
        const token = chunk.choices[0]?.delta.content;
        if (token) {
          assistantText += token;
          controller.enqueue(encoder.encode(token));
        }
      }
      if (session?.id && assistantText) {
        await supabase.from("ai_tutor_messages").insert({
          session_id: session.id,
          role: "assistant",
          content: assistantText,
          metadata: { source: "openai_stream" }
        });
      }
      await supabase.from("ai_usage_logs").insert({
        profile_id: user.id,
        route: "ai:tutor",
        model,
        metadata: { source: "openai_stream", session_id: session?.id ?? null, response_chars: assistantText.length }
      });
      controller.close();
    }
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache"
    }
  });
}
