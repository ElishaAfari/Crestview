import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const requestedRedirect = requestUrl.searchParams.get("next") ?? "/admin";
  const redirectTo = requestedRedirect.startsWith("/") && !requestedRedirect.startsWith("//") ? requestedRedirect : "/admin";

  if (code) {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.exchangeCodeForSession(code);
    return NextResponse.redirect(new URL(redirectTo, requestUrl.origin));
  }

  const safeTarget = JSON.stringify(redirectTo);
  const html = `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8"><title>Opening Crestview</title></head>
  <body>
    <script>window.location.replace(${safeTarget} + window.location.hash);</script>
  </body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Security-Policy": "default-src 'none'; script-src 'unsafe-inline'",
      "Content-Type": "text/html; charset=utf-8"
    }
  });
}
