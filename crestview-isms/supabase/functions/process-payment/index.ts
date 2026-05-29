import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const signature = req.headers.get("x-paystack-signature") ?? req.headers.get("verif-hash");
  if (!signature) {
    return Response.json({ error: "Missing payment signature." }, { status: 401 });
  }

  const event = await req.json() as { event?: string; data?: { reference?: string; amount?: number } };

  return Response.json({
    processed: true,
    event: event.event ?? "unknown",
    reference: event.data?.reference ?? null
  });
});
