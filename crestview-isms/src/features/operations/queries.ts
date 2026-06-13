import "server-only";

import { findOperationsWorkspace } from "@/config/operations";
import { requireRoles } from "@/features/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import type { RoleName } from "@/types/database.types";

function permittedRoles(roles: RoleName[]) {
  return Array.from(new Set<RoleName>(["super_admin", "school_admin", ...roles]));
}

export async function loadOperationsWorkspace(key: string) {
  const workspace = findOperationsWorkspace(key);
  if (!workspace) return null;
  await requireRoles(permittedRoles(workspace.roles));
  const admin = createAdminClient();
  const modules = await Promise.all(workspace.modules.map(async (workspaceModule) => {
    let query = admin.from(workspaceModule.table).select("*", { count: "exact", head: true }).is("deleted_at", null);
    if (workspaceModule.filter) query = query.eq(workspaceModule.filter.key, workspaceModule.filter.value);
    const { count } = await query;
    return { ...workspaceModule, count: count ?? 0 };
  }));
  return { ...workspace, modules };
}

export async function loadOperationsModule(workspaceKey: string, moduleKey: string) {
  const workspace = findOperationsWorkspace(workspaceKey);
  const workspaceModule = workspace?.modules.find((item) => item.key === moduleKey);
  if (!workspace || !workspaceModule) return null;
  await requireRoles(permittedRoles(workspace.roles));
  const admin = createAdminClient();
  let query = admin.from(workspaceModule.table).select("*", { count: "exact" }).is("deleted_at", null).order("created_at", { ascending: false }).limit(40);
  if (workspaceModule.filter) query = query.eq(workspaceModule.filter.key, workspaceModule.filter.value);
  const { data, count } = await query;
  return { workspace, module: workspaceModule, count: count ?? 0, records: (data ?? []) as Array<Record<string, unknown>> };
}
