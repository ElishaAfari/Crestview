"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { useSupabase } from "./useSupabase";

export function useAuth() {
  const supabase = useSupabase();
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const role = useAuthStore((state) => state.role);
  const isLoading = useAuthStore((state) => state.isLoading);
  const setUser = useAuthStore((state) => state.setUser);
  const setLoading = useAuthStore((state) => state.setLoading);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      setLoading(true);
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!mounted) {
        return;
      }

      setUser(user);
      setLoading(false);
    }

    void loadUser();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        clearAuth();
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [clearAuth, setLoading, setUser, supabase]);

  return { user, profile, role, isLoading };
}
