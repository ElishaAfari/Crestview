import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const signature = request.headers.get("x-paystack-signature") ?? request.headers.get("verif-hash");

  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!signature || !secret) return NextResponse.json({ error: "Payment webhook unavailable." }, { status: signature ? 503 : 401 });
  const rawBody = await request.text();
  const expected = createHmac("sha512", secret).update(rawBody).digest("hex");
  const received = Buffer.from(signature.trim().toLowerCase(), "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  if (received.length !== expectedBuffer.length || !timingSafeEqual(received, expectedBuffer)) {
    return NextResponse.json({ error: "Invalid payment signature." }, { status: 401 });
  }
  let event: { event?: string; data?: { reference?: string } };
  try { event = JSON.parse(rawBody) as typeof event; }
  catch { return NextResponse.json({ error: "Invalid payment payload." }, { status: 400 }); }

  return NextResponse.json({
    received: true,
    event: event.event ?? "unknown",
    reference: event.data?.reference ?? null
  });
}
