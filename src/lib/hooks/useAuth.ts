"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Role } from "@/lib/supabase/database.types";

const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

const ROLE_HOME: Record<Role, string> = {
  admin:     "/admin",
  counselor: "/counselor",
  student:   "/student",
};

export interface UserProfile {
  id:         string;
  full_name:  string;
  email:      string;
  role:       Role;
  phone:      string | null;
  avatar_url: string | null;
  is_active:  boolean;
}

interface UseAuthReturn {
  user:      User | null;
  profile:   UserProfile | null;
  role:      Role | null;
  isLoading: boolean;
  signIn:    (email: string, password: string) => Promise<{ error: string | null }>;
  signOut:   () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const router   = useRouter();
  const supabase = createClient();

  const [user,      setUser]      = useState<User | null>(null);
  const [profile,   setProfile]   = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Fetch profile from DB ─────────────────────────────────────────────────
  const fetchProfile = useCallback(
    async (userId: string): Promise<UserProfile | null> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, role, phone, avatar_url, is_active")
        .eq("id", userId)
        .single();

      if (error || !data) return null;
      return data as UserProfile;
    },
    [supabase]
  );

  // ── Idle-logout reset ─────────────────────────────────────────────────────
  const resetIdleTimer = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(async () => {
      await supabase.auth.signOut();
      router.push("/login");
    }, IDLE_TIMEOUT_MS);
  }, [supabase, router]);

  const attachIdleListeners = useCallback(() => {
    const events = ["mousemove", "keydown", "mousedown", "touchstart", "scroll"];
    events.forEach((e) => window.addEventListener(e, resetIdleTimer));
    resetIdleTimer();
    return () => {
      events.forEach((e) => window.removeEventListener(e, resetIdleTimer));
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [resetIdleTimer]);

  // ── Bootstrap: read session on mount ─────────────────────────────────────
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const p = await fetchProfile(session.user.id);
        setUser(session.user);
        setProfile(p);
        cleanup = attachIdleListeners();
      }
      setIsLoading(false);
    });

    // Listen for auth state changes (login / logout / token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          const p = await fetchProfile(session.user.id);
          setUser(session.user);
          setProfile(p);
          if (cleanup) cleanup();
          cleanup = attachIdleListeners();
        }
        if (event === "SIGNED_OUT") {
          setUser(null);
          setProfile(null);
          if (cleanup) cleanup();
        }
        if (event === "TOKEN_REFRESHED" && session?.user) {
          setUser(session.user);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
      if (cleanup) cleanup();
    };
  }, [supabase, fetchProfile, attachIdleListeners]);

  // ── signIn ────────────────────────────────────────────────────────────────
  const signIn = useCallback(
    async (email: string, password: string): Promise<{ error: string | null }> => {
      setIsLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error || !data.user) {
        setIsLoading(false);
        return { error: "Invalid email or password." };
      }

      const p = await fetchProfile(data.user.id);

      if (!p) {
        await supabase.auth.signOut();
        setIsLoading(false);
        return { error: "Account not found. Please contact your admin." };
      }

      if (!p.is_active) {
        await supabase.auth.signOut();
        setIsLoading(false);
        return { error: "Your account has been deactivated. Please contact your admin." };
      }

      setUser(data.user);
      setProfile(p);
      setIsLoading(false);

      router.push(ROLE_HOME[p.role]);
      router.refresh();

      return { error: null };
    },
    [supabase, fetchProfile, router]
  );

  // ── signOut ───────────────────────────────────────────────────────────────
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    router.push("/login");
    router.refresh();
  }, [supabase, router]);

  return {
    user,
    profile,
    role: profile?.role ?? null,
    isLoading,
    signIn,
    signOut,
  };
}
