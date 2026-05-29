import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const signature = request.headers.get("x-paystack-signature") ?? request.headers.get("verif-hash");

  if (!signature) {
    return NextResponse.json({ error: "Missing payment signature." }, { status: 401 });
  }

  const event = await request.json() as { event?: string; data?: { reference?: string } };

  return NextResponse.json({
    received: true,
    event: event.event ?? "unknown",
    reference: event.data?.reference ?? null
  });
}
