import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const payload = await req.json() as { to?: string; subject?: string; html?: string; type?: string };
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("CRESTVIEW_EMAIL_FROM") ?? Deno.env.get("RESEND_FROM_EMAIL") ?? "Crestview International School <noreply@crestview.edu>";
  const replyTo = Deno.env.get("CRESTVIEW_EMAIL_REPLY_TO");

  if (!apiKey) {
    return Response.json({ queued: false, reason: "RESEND_API_KEY is not configured.", payload });
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: payload.to,
      subject: payload.subject ?? "Crestview notification",
      html: payload.html ?? `<p>${payload.type ?? "Notification"}</p>`,
      ...(replyTo ? { reply_to: replyTo } : {})
    })
  });

  return Response.json({ queued: response.ok, status: response.status });
});
