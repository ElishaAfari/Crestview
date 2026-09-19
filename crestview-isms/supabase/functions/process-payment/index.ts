import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const signature = req.headers.get("x-paystack-signature") ?? req.headers.get("verif-hash");
  const secret = Deno.env.get("PAYSTACK_SECRET_KEY");
  if (!signature || !secret) return Response.json({ error: "Payment webhook unavailable." }, { status: signature ? 503 : 401 });
  const rawBody = await req.text();
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-512" }, false, ["sign"]);
  const digest = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody)));
  const expected = Array.from(digest, (byte) => byte.toString(16).padStart(2, "0")).join("");
  if (signature.trim().toLowerCase() !== expected) return Response.json({ error: "Invalid payment signature." }, { status: 401 });
  let event: { event?: string; data?: { reference?: string; amount?: number } };
  try { event = JSON.parse(rawBody) as typeof event; }
  catch { return Response.json({ error: "Invalid payment payload." }, { status: 400 }); }

  return Response.json({
    processed: true,
    event: event.event ?? "unknown",
    reference: event.data?.reference ?? null
  });
});
