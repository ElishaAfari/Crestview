import { create } from "zustand";

type ThemeState = {
  theme: "dark" | "light" | "system";
  setTheme: (theme: ThemeState["theme"]) => void;
};

export const useThemeStore = create<ThemeState>((set) => ({
  theme: "dark",
  setTheme: (theme) => set({ theme })
}));
