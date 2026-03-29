"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

/**
 * Watches for auth state changes. If the session is signed out
 * (e.g. token expired, user signed out on another tab), redirects
 * to /login with a ?reason=session_expired query param so the login
 * page can show an appropriate message.
 */
export default function SessionGuard() {
  const router = useRouter();
  const redirected = useRef(false);

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (
          (event === "SIGNED_OUT" || event === "TOKEN_REFRESHED") &&
          !redirected.current
        ) {
          // Only redirect on SIGNED_OUT, not on normal token refresh
          if (event === "SIGNED_OUT") {
            redirected.current = true;
            router.push("/login?reason=session_expired");
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [router]);

  return null;
}
