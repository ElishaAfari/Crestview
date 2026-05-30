"use client";

import { useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import { useAuthStore } from "@/store/authStore";
import type { Profile, RoleName } from "@/types/database.types";
import { useSupabase } from "./useSupabase";

export function useAuth() {
  const supabase = useSupabase();
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const role = useAuthStore((state) => state.role);
  const isLoading = useAuthStore((state) => state.isLoading);
  const setUser = useAuthStore((state) => state.setUser);
  const setProfile = useAuthStore((state) => state.setProfile);
  const setRole = useAuthStore((state) => state.setRole);
  const setLoading = useAuthStore((state) => state.setLoading);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  useEffect(() => {
    let mounted = true;

    async function hydrateUser(nextUser: User | null) {
      if (!nextUser) {
        clearAuth();
        return;
      }

      setUser(nextUser);
      const { data: profileRecord } = await supabase.from("profiles").select("*").eq("id", nextUser.id).maybeSingle();
      if (!mounted) return;
      const nextProfile = profileRecord as Profile | null;
      setProfile(nextProfile);

      if (typeof nextProfile?.role_id !== "string") {
        setRole(null);
        return;
      }

      const { data: roleRecord } = await supabase.from("roles").select("name").eq("id", nextProfile.role_id).maybeSingle();
      if (!mounted) return;
      const nextRole = roleRecord as { name?: unknown } | null;
      setRole(typeof nextRole?.name === "string" ? nextRole.name as RoleName : null);
    }

    async function loadUser() {
      setLoading(true);
      const { data: { user: nextUser } } = await supabase.auth.getUser();
      await hydrateUser(nextUser);
      if (mounted) setLoading(false);
    }

    void loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      void hydrateUser(session?.user ?? null).finally(() => setLoading(false));
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [clearAuth, setLoading, setProfile, setRole, setUser, supabase]);

  return { user, profile, role, isLoading };
}
