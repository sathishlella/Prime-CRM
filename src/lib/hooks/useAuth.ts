"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Role } from "@/lib/supabase/database.types";

const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
console.log("useAuth DEMO_MODE:", DEMO_MODE, "env:", process.env.NEXT_PUBLIC_DEMO_MODE);

const ROLE_HOME: Record<Role, string> = {
  admin:     "/admin",
  counselor: "/counselor",
  student:   "/student",
};

// Demo users for testing without Supabase
const DEMO_USERS: Record<string, { password: string; profile: UserProfile }> = {
  "admin@consultpro.com": {
    password: "demo123",
    profile: {
      id: "00000000-0000-0000-0000-000000000001",
      full_name: "Raj Mehta",
      email: "admin@consultpro.com",
      role: "admin",
      phone: "+91 98765 00001",
      avatar_url: null,
      is_active: true,
    },
  },
  "priya@consultpro.com": {
    password: "demo123",
    profile: {
      id: "00000000-0000-0000-0000-000000000002",
      full_name: "Priya Sharma",
      email: "priya@consultpro.com",
      role: "counselor",
      phone: "+91 98765 00002",
      avatar_url: null,
      is_active: true,
    },
  },
  "sarah@student.com": {
    password: "demo123",
    profile: {
      id: "00000000-0000-0000-0000-000000000004",
      full_name: "Sarah Mitchell",
      email: "sarah@student.com",
      role: "student",
      phone: null,
      avatar_url: null,
      is_active: true,
    },
  },
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

    // Demo mode: check localStorage for session
    if (DEMO_MODE) {
      const demoSession = localStorage.getItem("demo_session");
      if (demoSession) {
        try {
          const { user: demoUser, profile: demoProfile, expires_at } = JSON.parse(demoSession);
          if (expires_at > Date.now()) {
            setUser(demoUser as User);
            setProfile(demoProfile as UserProfile);
            cleanup = attachIdleListeners();
          } else {
            localStorage.removeItem("demo_session");
          }
        } catch {
          localStorage.removeItem("demo_session");
        }
      }
      setIsLoading(false);
      return () => {
        if (cleanup) cleanup();
      };
    }

    supabase.auth.getSession().then(async ({ data: { session } }: { data: { session: { user: User } | null } }) => {
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
      async (event: string, session: { user: User } | null) => {
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

      // Demo mode: bypass Supabase
      if (DEMO_MODE) {
        const demoUser = DEMO_USERS[email.toLowerCase()];
        if (!demoUser || demoUser.password !== password) {
          setIsLoading(false);
          return { error: "Invalid email or password." };
        }
        if (!demoUser.profile.is_active) {
          setIsLoading(false);
          return { error: "Your account has been deactivated. Please contact your admin." };
        }
        
        // Create a mock User object
        const mockUser = {
          id: demoUser.profile.id,
          email: demoUser.profile.email,
          user_metadata: {},
          app_metadata: {},
          aud: "authenticated",
          created_at: new Date().toISOString(),
          role: "authenticated",
          updated_at: new Date().toISOString(),
          confirmed_at: new Date().toISOString(),
          last_sign_in_at: new Date().toISOString(),
          email_confirmed_at: new Date().toISOString(),
          phone: null,
          phone_confirmed_at: null,
          identities: [],
          factors: [],
        } as unknown as User;

        setUser(mockUser);
        setProfile(demoUser.profile);
        setIsLoading(false);
        
        // Store demo session in localStorage
        localStorage.setItem("demo_session", JSON.stringify({
          user: mockUser,
          profile: demoUser.profile,
          expires_at: Date.now() + IDLE_TIMEOUT_MS,
        }));

        router.push(ROLE_HOME[demoUser.profile.role]);
        router.refresh();
        return { error: null };
      }

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
    if (DEMO_MODE) {
      localStorage.removeItem("demo_session");
    } else {
      await supabase.auth.signOut();
    }
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
