"use client";

import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Role } from "@/lib/supabase/database.types";
import type { UserProfile } from "@/lib/hooks/useAuth";

interface AuthState {
  user:      User | null;
  profile:   UserProfile | null;
  role:      Role | null;
  isLoading: boolean;

  setUser:    (user: User | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setLoading: (v: boolean) => void;

  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user:      null,
  profile:   null,
  role:      null,
  isLoading: true,

  setUser:    (user)    => set({ user }),
  setProfile: (profile) => set({ profile, role: profile?.role ?? null }),
  setLoading: (v)       => set({ isLoading: v }),

  signOut: async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    set({ user: null, profile: null, role: null });
  },
}));
