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

  const dashboardRoots = ["/admin", "/teacher", "/student", "/parent", "/hr", "/finance", "/library", "/it"];
  const isDashboard = dashboardRoots.some((root) => request.nextUrl.pathname === root || request.nextUrl.pathname.startsWith(`${root}/`));

  if (isDashboard && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirectedFrom", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isDashboard && user) {
    const { data: profile } = await supabase.from("profiles").select("role_id,is_active").eq("id", user.id).maybeSingle();
    const roleId = typeof profile?.role_id === "string" ? profile.role_id : null;
    const { data: role } = roleId ? await supabase.from("roles").select("name").eq("id", roleId).maybeSingle() : { data: null };
    const roleName = typeof role?.name === "string" ? role.name : null;
    const administratorRoles = ["super_admin", "school_admin"];
    const roleHome: Record<string, string> = {
      teacher: "/teacher",
      student: "/student",
      parent: "/parent",
      super_admin: "/admin",
      school_admin: "/admin",
      hr_staff: "/hr",
      finance_officer: "/finance",
      it_support: "/it",
      librarian: "/library"
    };
    const isAdministrator = Boolean(roleName && administratorRoles.includes(roleName));
    const adminPathRoles = request.nextUrl.pathname.startsWith("/admin/staff")
      ? ["super_admin", "school_admin", "hr_staff"]
      : request.nextUrl.pathname.startsWith("/admin/fees")
        ? ["super_admin", "school_admin", "finance_officer"]
        : request.nextUrl.pathname.startsWith("/admin/settings")
          ? ["super_admin", "school_admin", "it_support"]
          : administratorRoles;
    const allowed = profile?.is_active !== false && (request.nextUrl.pathname.startsWith("/admin")
      ? Boolean(roleName && adminPathRoles.includes(roleName))
      : request.nextUrl.pathname.startsWith("/teacher")
        ? roleName === "teacher"
        : request.nextUrl.pathname.startsWith("/student")
          ? roleName === "student"
          : request.nextUrl.pathname.startsWith("/parent")
            ? roleName === "parent"
            : request.nextUrl.pathname.startsWith("/hr")
              ? roleName === "hr_staff" || isAdministrator
              : request.nextUrl.pathname.startsWith("/finance")
                ? roleName === "finance_officer" || isAdministrator
                : request.nextUrl.pathname.startsWith("/library")
                  ? roleName === "librarian" || isAdministrator
                  : roleName === "it_support" || isAdministrator);

    if (!allowed) {
      const destination = request.nextUrl.clone();
      destination.pathname = roleName ? roleHome[roleName] ?? "/login" : "/login";
      destination.search = "";
      return NextResponse.redirect(destination);
    }
  }

  return response;
}
