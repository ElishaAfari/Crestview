"use client";

import { isAdminRole } from "@/config/roles";
import { useAuthStore } from "@/store/authStore";

export function useRole() {
  const role = useAuthStore((state) => state.role);

  return {
    role,
    isAdmin: isAdminRole(role)
  };
}
