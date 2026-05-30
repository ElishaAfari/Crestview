import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";

type CookieToSet = {
  name: string;
  value: string;
  options: CookieOptions;
};

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !publishableKey) {
    return response;
  }

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      }
    }
  });

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const isDashboard = request.nextUrl.pathname.startsWith("/admin")
    || request.nextUrl.pathname.startsWith("/teacher")
    || request.nextUrl.pathname.startsWith("/student")
    || request.nextUrl.pathname.startsWith("/parent");

  if (isDashboard && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirectedFrom", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isDashboard && user) {
    const { data: profile } = await supabase.from("profiles").select("role_id").eq("id", user.id).maybeSingle();
    const roleId = typeof profile?.role_id === "string" ? profile.role_id : null;
    const { data: role } = roleId ? await supabase.from("roles").select("name").eq("id", roleId).maybeSingle() : { data: null };
    const roleName = typeof role?.name === "string" ? role.name : null;
    const adminRoles = ["super_admin", "school_admin", "hr_staff", "finance_officer", "it_support", "librarian"];
    const roleHome: Record<string, string> = {
      teacher: "/teacher",
      student: "/student",
      parent: "/parent",
      super_admin: "/admin",
      school_admin: "/admin",
      hr_staff: "/admin",
      finance_officer: "/admin/fees",
      it_support: "/admin/settings",
      librarian: "/admin"
    };
    const allowed = request.nextUrl.pathname.startsWith("/admin")
      ? Boolean(roleName && adminRoles.includes(roleName))
      : request.nextUrl.pathname.startsWith("/teacher")
        ? roleName === "teacher"
        : request.nextUrl.pathname.startsWith("/student")
          ? roleName === "student"
          : roleName === "parent";

    if (!allowed) {
      const destination = request.nextUrl.clone();
      destination.pathname = roleName ? roleHome[roleName] ?? "/login" : "/login";
      destination.search = "";
      return NextResponse.redirect(destination);
    }
  }

  return response;
}
