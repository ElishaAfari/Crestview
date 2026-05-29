import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const payload = await req.json() as { studentId?: string };

  return Response.json({
    studentId: payload.studentId ?? null,
    risk_level: "green",
    strengths: ["Consistent attendance"],
    concerns: [],
    recommendations: ["Continue weekly progress review"]
  });
});
