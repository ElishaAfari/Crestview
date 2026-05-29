import { create } from "zustand";

type UIState = {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  activeModal: string | null;
  toggleSidebar: () => void;
  setSidebarOpen: (sidebarOpen: boolean) => void;
  setSidebarCollapsed: (sidebarCollapsed: boolean) => void;
  openModal: (id: string) => void;
  closeModal: () => void;
};

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  sidebarCollapsed: false,
  activeModal: null,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
  openModal: (id) => set({ activeModal: id }),
  closeModal: () => set({ activeModal: null })
}));
