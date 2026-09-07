import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import { referenceRouteAliases } from "@/config/referenceRouteAliases";

type CookieToSet = {
  name: string;
  value: string;
  options: CookieOptions;
};

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
  librarian: "/library",
};

const operationalRouteRoles: Array<{ root: string; roles: string[] }> = [
  { root: "/students", roles: administratorRoles },
  {
    root: "/dashboard",
    roles: [
      "super_admin",
      "school_admin",
      "teacher",
      "student",
      "parent",
      "hr_staff",
      "finance_officer",
      "it_support",
      "librarian",
    ],
  },
  { root: "/staff", roles: [...administratorRoles, "hr_staff"] },
  { root: "/classes", roles: administratorRoles },
  { root: "/attendance", roles: administratorRoles },
  { root: "/assessment", roles: administratorRoles },
  { root: "/admissions-office", roles: administratorRoles },
  { root: "/messages", roles: [...administratorRoles, "it_support"] },
  { root: "/calendar", roles: administratorRoles },
  { root: "/reports", roles: administratorRoles },
  { root: "/front-office", roles: [...administratorRoles, "hr_staff"] },
  {
    root: "/id-cards",
    roles: [
      ...administratorRoles,
      "finance_officer",
      "it_support",
      "teacher",
      "hr_staff",
    ],
  },
  { root: "/preschool", roles: [...administratorRoles, "teacher", "hr_staff"] },
  { root: "/academics-office", roles: [...administratorRoles, "teacher"] },
  { root: "/exams", roles: [...administratorRoles, "teacher"] },
  { root: "/communication", roles: [...administratorRoles, "it_support"] },
  { root: "/bursary", roles: [...administratorRoles, "finance_officer"] },
  { root: "/accounting", roles: [...administratorRoles, "finance_officer"] },
  {
    root: "/feeding",
    roles: [...administratorRoles, "finance_officer", "teacher"],
  },
  {
    root: "/extra-classes",
    roles: [...administratorRoles, "finance_officer", "teacher"],
  },
  {
    root: "/boarding",
    roles: [...administratorRoles, "teacher", "hr_staff", "finance_officer"],
  },
  {
    root: "/transport",
    roles: [...administratorRoles, "finance_officer", "it_support"],
  },
  {
    root: "/inventory",
    roles: [...administratorRoles, "finance_officer", "it_support"],
  },
  {
    root: "/learner-care",
    roles: [...administratorRoles, "teacher", "hr_staff"],
  },
  { root: "/platform-audit", roles: [...administratorRoles, "it_support"] },
  { root: "/settings", roles: [...administratorRoles, "it_support"] },
];

function isWithinRoot(pathname: string, root: string) {
  return pathname === root || pathname.startsWith(`${root}/`);
}

function allowedRolesForPath(pathname: string) {
  const normalizedPathname = referenceRouteAliases[pathname] ?? pathname;

  if (isWithinRoot(normalizedPathname, "/admin")) {
    if (normalizedPathname.startsWith("/admin/staff"))
      return [...administratorRoles, "hr_staff"];
    if (normalizedPathname.startsWith("/admin/fees"))
      return [...administratorRoles, "finance_officer"];
    if (normalizedPathname.startsWith("/admin/settings"))
      return [...administratorRoles, "it_support"];
    return administratorRoles;
  }

  if (isWithinRoot(normalizedPathname, "/teacher")) return ["teacher"];
  if (isWithinRoot(normalizedPathname, "/student")) return ["student"];
  if (isWithinRoot(normalizedPathname, "/parent")) return ["parent"];
  if (isWithinRoot(normalizedPathname, "/hr"))
    return [...administratorRoles, "hr_staff"];
  if (isWithinRoot(normalizedPathname, "/finance"))
    return [...administratorRoles, "finance_officer"];
  if (isWithinRoot(normalizedPathname, "/library"))
    return [...administratorRoles, "librarian"];
  if (isWithinRoot(normalizedPathname, "/it"))
    return [...administratorRoles, "it_support"];

  return (
    operationalRouteRoles.find((route) =>
      isWithinRoot(normalizedPathname, route.root),
    )?.roles ?? null
  );
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !publishableKey) {
    return response;
  }

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const allowedRoleNames = allowedRolesForPath(request.nextUrl.pathname);
  const isDashboard = Boolean(allowedRoleNames);

  if (isDashboard && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirectedFrom", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isDashboard && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role_id,is_active")
      .eq("id", user.id)
      .maybeSingle();
    const roleId =
      typeof profile?.role_id === "string" ? profile.role_id : null;
    const { data: role } = roleId
      ? await supabase
          .from("roles")
          .select("name")
          .eq("id", roleId)
          .maybeSingle()
      : { data: null };
    const roleName = typeof role?.name === "string" ? role.name : null;
    const allowed =
      profile?.is_active !== false &&
      Boolean(roleName && allowedRoleNames?.includes(roleName));

    if (!allowed) {
      const destination = request.nextUrl.clone();
      destination.pathname = roleName
        ? (roleHome[roleName] ?? "/login")
        : "/login";
      destination.search = "";
      return NextResponse.redirect(destination);
    }
  }

  return response;
}
