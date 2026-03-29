"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import type { Role } from "@/lib/supabase/database.types";

const ROLE_HOME: Record<Role, string> = {
  admin:     "/admin",
  counselor: "/counselor",
  student:   "/student",
};

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
console.log("Login page DEMO_MODE:", DEMO_MODE, "env value:", process.env.NEXT_PUBLIC_DEMO_MODE);

const loginSchema = z.object({
  email:    z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
type LoginForm = z.infer<typeof loginSchema>;

// ─── Floating Label Input ─────────────────────────────────────────────────────
function FloatingInput({
  id,
  label,
  type,
  error,
  registration,
}: {
  id: string;
  label: string;
  type: string;
  error?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  registration: any;
}) {
  const [focused,   setFocused]   = useState(false);
  const [hasValue,  setHasValue]  = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const floating = focused || hasValue;

  return (
    <div style={{ position: "relative", marginBottom: error ? 6 : 20 }}>
      {/* Floating label */}
      <label
        htmlFor={id}
        style={{
          position: "absolute",
          left: 14,
          top: floating ? 8 : "50%",
          transform: floating ? "translateY(0)" : "translateY(-50%)",
          fontSize: floating ? 10 : 14,
          fontWeight: floating ? 600 : 400,
          color: focused ? "#3b82f6" : error ? "#ef4444" : "#94a3b8",
          transition: "all 0.22s cubic-bezier(.4,0,.2,1)",
          pointerEvents: "none",
          letterSpacing: floating ? 0.4 : 0,
          textTransform: floating ? "uppercase" : "none",
          zIndex: 1,
        }}
      >
        {label}
      </label>

      <input
        id={id}
        type={type}
        ref={(el) => {
          inputRef.current = el;
          registration.ref(el);
        }}
        {...registration}
        onFocus={(e) => {
          setFocused(true);
          registration.onBlur && void 0;
          e.target.dispatchEvent(new Event("focus"));
        }}
        onBlur={(e) => {
          setFocused(false);
          setHasValue(e.target.value.length > 0);
          registration.onBlur?.(e);
        }}
        onChange={(e) => {
          setHasValue(e.target.value.length > 0);
          registration.onChange(e);
        }}
        style={{
          width: "100%",
          padding: floating ? "22px 14px 8px" : "14px",
          border: `1.5px solid ${error ? "rgba(239,68,68,0.5)" : focused ? "rgba(59,130,246,0.45)" : "rgba(0,0,0,0.08)"}`,
          borderRadius: 12,
          background: focused ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.6)",
          fontFamily: "'Outfit', system-ui, sans-serif",
          fontSize: 14,
          color: "#1e293b",
          outline: "none",
          transition: "all 0.25s cubic-bezier(.4,0,.2,1)",
          boxShadow: focused ? "0 0 0 3px rgba(59,130,246,0.08)" : error ? "0 0 0 3px rgba(239,68,68,0.06)" : "none",
          animation: error ? "shake 0.4s cubic-bezier(.4,0,.2,1) both" : undefined,
        }}
        autoComplete={type === "password" ? "current-password" : "email"}
      />
    </div>
  );
}

// ─── Login Page ───────────────────────────────────────────────────────────────
function LoginPageInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const supabase     = createClient();

  const [mounted,     setMounted]     = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [serverError, setServerError] = useState("");
  const [success,     setSuccess]     = useState(false);
  const [sessionMsg,  setSessionMsg]  = useState("");

  useEffect(() => {
    // Show session expired banner if redirected from SessionGuard
    if (searchParams.get("reason") === "session_expired") {
      setSessionMsg("Your session expired. Please sign in again.");
    }
    // Entrance animation
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(data: LoginForm) {
    setLoading(true);
    setServerError("");

    const { error } = await supabase.auth.signInWithPassword({
      email:    data.email,
      password: data.password,
    });

    if (error) {
      setLoading(false);
      setServerError("Invalid email or password. Please try again.");
      return;
    }

    // Fetch role for redirect
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", (await supabase.auth.getUser()).data.user?.id ?? "")
      .single();

    setSuccess(true);

    const home = ROLE_HOME[(profile?.role as Role) ?? "student"];
    router.push(home);
    router.refresh();
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(155deg, #f8faff 0%, #f0f5ff 40%, #f5f3ff 100%)",
        fontFamily: "'Outfit', system-ui, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* ── Animated blobs ── */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            width: 520,
            height: 520,
            top: "-8%",
            right: "-6%",
            background: "radial-gradient(circle, rgba(59,130,246,0.14) 0%, rgba(59,130,246,0.04) 40%, transparent 70%)",
            animation: "blobA 20s ease-in-out infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 440,
            height: 440,
            bottom: "-4%",
            left: "-5%",
            background: "radial-gradient(circle, rgba(16,185,129,0.12) 0%, rgba(16,185,129,0.03) 40%, transparent 70%)",
            animation: "blobB 25s ease-in-out infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 320,
            height: 320,
            top: "35%",
            left: "45%",
            background: "radial-gradient(circle, rgba(139,92,246,0.10) 0%, rgba(139,92,246,0.02) 40%, transparent 70%)",
            animation: "blobC 17s ease-in-out infinite",
          }}
        />
      </div>

      {/* ── Card container ── */}
      <div
        style={{
          zIndex: 1,
          width: "100%",
          maxWidth: 420,
          padding: "0 20px",
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0) scale(1)" : "translateY(24px) scale(0.97)",
          transition: "all 0.7s cubic-bezier(.4,0,.2,1)",
        }}
      >
        {/* Brand mark */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: 16,
              margin: "0 auto 16px",
              background: "linear-gradient(135deg, #3b82f6, #10b981)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 6px 20px rgba(59,130,246,0.28)",
              animation: "float 4s ease-in-out infinite",
            }}
          >
            <span style={{ color: "#fff", fontSize: 21, fontWeight: 800 }}>CP</span>
          </div>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 800,
              color: "#1e293b",
              margin: 0,
              letterSpacing: "-0.5px",
            }}
          >
            ConsultPro CRM
          </h1>
          <p style={{ color: "#94a3b8", fontSize: 13, marginTop: 6 }}>
            Sign in to your workspace
          </p>
        </div>

        {/* Session expired banner */}
        {sessionMsg && (
          <div style={{
            background: "rgba(251,191,36,0.15)",
            border: "1px solid rgba(251,191,36,0.35)",
            borderRadius: 10,
            padding: "10px 14px",
            marginBottom: 14,
            fontSize: 13,
            color: "#92400e",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}>
            <span>⏱</span> {sessionMsg}
          </div>
        )}

        {/* Glass card */}
        <div
          style={{
            background: "rgba(255,255,255,0.52)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.68)",
            borderRadius: 20,
            boxShadow: "0 4px 24px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.02)",
            padding: "32px 28px 28px",
          }}
        >
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* Email */}
            <FloatingInput
              id="email"
              label="Email address"
              type="email"
              error={errors.email?.message}
              registration={register("email")}
            />
            {errors.email && (
              <p style={{ color: "#ef4444", fontSize: 11.5, marginBottom: 14, marginTop: -2 }}>
                {errors.email.message}
              </p>
            )}

            {/* Password */}
            <FloatingInput
              id="password"
              label="Password"
              type="password"
              error={errors.password?.message}
              registration={register("password")}
            />
            {errors.password && (
              <p style={{ color: "#ef4444", fontSize: 11.5, marginBottom: 14, marginTop: -2 }}>
                {errors.password.message}
              </p>
            )}

            {/* Server error */}
            {serverError && (
              <div
                style={{
                  background: "rgba(239,68,68,0.06)",
                  border: "1px solid rgba(239,68,68,0.18)",
                  borderRadius: 10,
                  padding: "10px 14px",
                  marginBottom: 18,
                  color: "#dc2626",
                  fontSize: 13,
                  animation: "shake 0.4s cubic-bezier(.4,0,.2,1) both",
                }}
              >
                {serverError}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || success}
              style={{
                width: "100%",
                padding: "13px 20px",
                background: success
                  ? "linear-gradient(135deg, #10b981, #059669)"
                  : "linear-gradient(135deg, #3b82f6, #10b981)",
                color: "#fff",
                border: "none",
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 700,
                fontFamily: "inherit",
                cursor: loading || success ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                transition: "all 0.3s cubic-bezier(.4,0,.2,1)",
                boxShadow: "0 4px 14px rgba(59,130,246,0.28)",
                transform: loading ? "none" : undefined,
                opacity: loading ? 0.85 : 1,
                marginTop: 8,
              }}
              onMouseEnter={(e) => {
                if (!loading && !success) {
                  (e.currentTarget).style.transform = "translateY(-2px)";
                  (e.currentTarget).style.boxShadow = "0 8px 28px rgba(59,130,246,0.35)";
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget).style.transform = "translateY(0)";
                (e.currentTarget).style.boxShadow = "0 4px 14px rgba(59,130,246,0.28)";
              }}
            >
              {success ? (
                <>
                  <span style={{ fontSize: 15 }}>✓</span> Redirecting…
                </>
              ) : loading ? (
                <>
                  <span
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: "50%",
                      border: "2px solid rgba(255,255,255,0.35)",
                      borderTopColor: "#fff",
                      animation: "spin 0.8s linear infinite",
                      display: "inline-block",
                      flexShrink: 0,
                    }}
                  />
                  Signing in…
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", fontSize: 11, color: "#cbd5e1", marginTop: 20 }}>
          Sessions expire after 30 minutes of inactivity
          {DEMO_MODE && <span style={{ color: "#10b981", marginLeft: 8 }}>(Demo Active)</span>}
        </p>

        {/* Demo credentials hint */}
        {process.env.NEXT_PUBLIC_DEMO_MODE === "true" && (
          <div style={{
            marginTop: 24,
            padding: "14px 16px",
            background: "rgba(59,130,246,0.08)",
            border: "1px solid rgba(59,130,246,0.2)",
            borderRadius: 12,
            fontSize: 12,
            color: "#3b82f6",
          }}>
            <strong style={{ display: "block", marginBottom: 8, fontSize: 13 }}>🎮 Demo Mode</strong>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, opacity: 0.9 }}>
              <span><strong>Admin:</strong> admin@consultpro.com / demo123</span>
              <span><strong>Counselor:</strong> priya@consultpro.com / demo123</span>
              <span><strong>Student:</strong> sarah@student.com / demo123</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageInner />
    </Suspense>
  );
}
