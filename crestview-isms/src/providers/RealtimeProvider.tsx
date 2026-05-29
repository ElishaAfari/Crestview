"use client";

import type { ReactNode } from "react";
import { useRealtime } from "@/hooks/useRealtime";
import { useAuthStore } from "@/store/authStore";

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const userId = useAuthStore((state) => state.user?.id ?? null);
  useRealtime(userId);
  return children;
}
