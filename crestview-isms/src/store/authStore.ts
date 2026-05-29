import { create } from "zustand";
import type { User } from "@supabase/supabase-js";
import type { Profile, RoleName } from "@/types/database.types";

type AuthState = {
  user: User | null;
  profile: Profile | null;
  role: RoleName | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (isLoading: boolean) => void;
  clearAuth: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  role: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile, role: null }),
  setLoading: (isLoading) => set({ isLoading }),
  clearAuth: () => set({ user: null, profile: null, role: null, isLoading: false })
}));
