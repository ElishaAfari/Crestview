import type { User } from "@supabase/supabase-js";
import type { Profile, RoleName } from "./database.types";

export type AuthRole = RoleName;

export type SessionUser = {
  user: User;
  profile: Profile;
  role: AuthRole;
};
