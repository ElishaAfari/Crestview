import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    ok: true,
    service: "crestview-isms",
    timestamp: new Date().toISOString()
  });
}
