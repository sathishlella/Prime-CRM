"use client";

import { create } from "zustand";

export interface Toast {
  id:      string;
  message: string;
  type:    "success" | "error" | "info";
}

interface UIState {
  sidebarOpen: boolean;
  toasts:      Toast[];

  toggleSidebar: ()                                                      => void;
  setSidebar:    (open: boolean)                                         => void;
  addToast:      (message: string, type?: Toast["type"])                 => void;
  removeToast:   (id: string)                                            => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  toasts:      [],

  toggleSidebar: ()     => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebar:    (open) => set({ sidebarOpen: open }),

  addToast: (message, type = "success") => {
    const id = crypto.randomUUID();
    set((s) => ({ toasts: [...s.toasts.slice(-2), { id, message, type }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 4000);
  },

  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
