"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import type { Role } from "@/lib/supabase/database.types";

const ROLE_HOME: Record<Role, string> = {
  admin:     "/admin",
  counselor: "/counselor",
  student:   "/student",
};

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

const loginSchema = z.object({
  email:    z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
type LoginForm = z.infer<typeof loginSchema>;

// ─── Eye SVG ──────────────────────────────────────────────────────────────────
function IconEye({ off }: { off?: boolean }) {
  return off ? (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 2l12 12M6.5 6.6A3 3 0 0 0 8 12a3 3 0 0 0 2.9-2.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M3.5 4.5C2.2 5.5 1 7 1 7s2.5 5 7 5a7.3 7.3 0 0 0 3-0.65" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M7.2 3.1C7.46 3.04 7.73 3 8 3c4.5 0 7 5 7 5s-.7 1.36-2 2.56" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5Z" stroke="currentColor" strokeWidth="1.4"/>
      <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.4"/>
    </svg>
  );
}

// ─── Floating Label Input ─────────────────────────────────────────────────────
function FloatingInput({
  id, label, type, error, registration, suffix,
}: {
  id:           string;
  label:        string;
  type:         string;
  error?:       string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  registration: any;
  suffix?:      React.ReactNode;
}) {
  const [focused,  setFocused]  = useState(false);
  const [hasValue, setHasValue] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const floating = focused || hasValue;

  return (
    <div style={{ position: "relative", marginBottom: error ? 6 : 18 }}>
      <label
        htmlFor={id}
        style={{
          position:        "absolute",
          left:            14,
          top:             floating ? 9 : "50%",
          transform:       floating ? "translateY(0)" : "translateY(-50%)",
          fontSize:        floating ? 9.5 : 14,
          fontWeight:      floating ? 600 : 400,
          color:           focused ? "#0A6EBD" : error ? "#DC2626" : "#9CA3AF",
          transition:      "all 0.2s cubic-bezier(.4,0,.2,1)",
          pointerEvents:   "none",
          letterSpacing:   floating ? "0.5px" : "-0.01em",
          textTransform:   floating ? "uppercase" : "none",
          zIndex:          1,
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
        onFocus={() => setFocused(true)}
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
          width:          "100%",
          padding:        floating ? "22px 14px 8px" : "15px 14px",
          paddingRight:   suffix ? 42 : 14,
          border:         `1.5px solid ${error ? "rgba(220,38,38,0.45)" : focused ? "rgba(10,110,189,0.5)" : "rgba(0,0,0,0.09)"}`,
          borderRadius:   14,
          background:     focused ? "#FFFFFF" : "rgba(255,255,255,0.7)",
          fontFamily:     "'Inter', system-ui, sans-serif",
          fontSize:       14,
          color:          "#0A0F1E",
          outline:        "none",
          transition:     "all 0.22s cubic-bezier(.4,0,.2,1)",
          boxShadow:      focused
            ? "0 0 0 3px rgba(10,110,189,0.08)"
            : error
            ? "0 0 0 3px rgba(220,38,38,0.06)"
            : "none",
          letterSpacing:  "-0.01em",
        }}
        autoComplete={type === "password" ? "current-password" : "email"}
      />

      {suffix && (
        <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)" }}>
          {suffix}
        </div>
      )}
    </div>
  );
}

// ─── Main Login Page ──────────────────────────────────────────────────────────
function LoginPageInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const supabase     = createClient();

  const [mounted,     setMounted]     = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [serverError, setServerError] = useState("");
  const [success,     setSuccess]     = useState(false);
  const [sessionMsg,  setSessionMsg]  = useState("");
  const [showPwd,     setShowPwd]     = useState(false);

  useEffect(() => {
    if (searchParams.get("reason") === "session_expired") {
      setSessionMsg("Your session expired. Please sign in again.");
    }
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, [searchParams]);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

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
    <div style={{
      minHeight:   "100vh",
      display:     "flex",
      alignItems:  "center",
      justifyContent: "center",
      background:  "linear-gradient(160deg, #F7F9FC 0%, #F5F8FD 50%, #F3F6FB 100%)",
      fontFamily:  "'Inter', system-ui, sans-serif",
      position:    "relative",
      overflow:    "hidden",
    }}>
      {/* Ambient blobs */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{
          position:   "absolute",
          width:      500,
          height:     500,
          top:        "-10%",
          right:      "-8%",
          background: "radial-gradient(circle, rgba(10,110,189,0.07) 0%, transparent 65%)",
          animation:  "blobA 22s ease-in-out infinite",
        }} />
        <div style={{
          position:   "absolute",
          width:      420,
          height:     420,
          bottom:     "-5%",
          left:       "-6%",
          background: "radial-gradient(circle, rgba(5,150,105,0.05) 0%, transparent 65%)",
          animation:  "blobB 28s ease-in-out infinite",
        }} />
        <div style={{
          position:   "absolute",
          width:      300,
          height:     300,
          top:        "38%",
          left:       "42%",
          background: "radial-gradient(circle, rgba(124,58,237,0.04) 0%, transparent 65%)",
          animation:  "blobC 16s ease-in-out infinite",
        }} />
      </div>

      {/* Card */}
      <div style={{
        zIndex:     1,
        width:      "100%",
        maxWidth:   430,
        padding:    "0 20px",
        opacity:    mounted ? 1 : 0,
        transform:  mounted ? "translateY(0)" : "translateY(20px)",
        transition: "all 0.6s cubic-bezier(.4,0,.2,1)",
      }}>

        {/* Logo & Brand */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width:          64,
            height:         64,
            borderRadius:   20,
            margin:         "0 auto 16px",
            background:     "linear-gradient(145deg, #0A0F1E, #1a2744)",
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            boxShadow:      "0 8px 32px rgba(10,15,30,0.25)",
            position:       "relative",
            overflow:       "hidden",
            animation:      "float 5s ease-in-out infinite",
          }}>
            <Image
              src="/logo.png"
              alt="F1 Dream Jobs"
              width={64}
              height={64}
              style={{ objectFit: "cover", width: "100%", height: "100%" }}
              priority
            />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#0A0F1E", margin: 0, letterSpacing: "-0.5px" }}>
            F1 Dream Jobs
          </h1>
          <p style={{ color: "#6B7280", fontSize: 14, marginTop: 4, fontWeight: 500 }}>
            CRM Dashboard
          </p>
          <p style={{ color: "#9CA3AF", fontSize: 12, marginTop: 2, fontWeight: 400 }}>
            Sign in to your workspace
          </p>
        </div>

        {/* Session expired */}
        {sessionMsg && (
          <div style={{
            background:    "rgba(217,119,6,0.07)",
            border:        "1px solid rgba(217,119,6,0.2)",
            borderRadius:  12,
            padding:       "10px 14px",
            marginBottom:  16,
            fontSize:      13,
            color:         "#92400E",
            display:       "flex",
            alignItems:    "center",
            gap:           8,
            letterSpacing: "-0.01em",
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="6" stroke="#D97706" strokeWidth="1.3"/>
              <path d="M7 4v3.5" stroke="#D97706" strokeWidth="1.4" strokeLinecap="round"/>
              <circle cx="7" cy="10" r="0.7" fill="#D97706"/>
            </svg>
            {sessionMsg}
          </div>
        )}

        {/* Glass form card */}
        <div style={{
          background:           "rgba(255,255,255,0.82)",
          backdropFilter:       "blur(40px)",
          WebkitBackdropFilter: "blur(40px)",
          border:               "1px solid rgba(255,255,255,0.8)",
          borderRadius:         24,
          boxShadow:            "0 4px 24px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.03)",
          padding:              "32px 28px 28px",
        }}>
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
              <p style={{ color: "#DC2626", fontSize: 11.5, marginBottom: 14, marginTop: -2, letterSpacing: "-0.01em" }}>
                {errors.email.message}
              </p>
            )}

            {/* Password */}
            <FloatingInput
              id="password"
              label="Password"
              type={showPwd ? "text" : "password"}
              error={errors.password?.message}
              registration={register("password")}
              suffix={
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", padding: 2, display: "flex", alignItems: "center" }}
                  onMouseEnter={(e) => { (e.currentTarget).style.color = "#6B7280"; }}
                  onMouseLeave={(e) => { (e.currentTarget).style.color = "#9CA3AF"; }}
                >
                  <IconEye off={showPwd} />
                </button>
              }
            />
            {errors.password && (
              <p style={{ color: "#DC2626", fontSize: 11.5, marginBottom: 14, marginTop: -2, letterSpacing: "-0.01em" }}>
                {errors.password.message}
              </p>
            )}

            {/* Server error */}
            {serverError && (
              <div style={{
                background:    "rgba(220,38,38,0.05)",
                border:        "1px solid rgba(220,38,38,0.15)",
                borderRadius:  11,
                padding:       "10px 14px",
                marginBottom:  18,
                color:         "#DC2626",
                fontSize:      13,
                display:       "flex",
                alignItems:    "center",
                gap:           8,
                letterSpacing: "-0.01em",
              }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="6" stroke="#DC2626" strokeWidth="1.3"/>
                  <path d="M7 4v3.5" stroke="#DC2626" strokeWidth="1.4" strokeLinecap="round"/>
                  <circle cx="7" cy="10" r="0.7" fill="#DC2626"/>
                </svg>
                {serverError}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || success}
              style={{
                width:         "100%",
                padding:       "13px 20px",
                background:    success
                  ? "#059669"
                  : loading
                  ? "rgba(10,110,189,0.7)"
                  : "#0A6EBD",
                color:         "#fff",
                border:        "none",
                borderRadius:  14,
                fontSize:      14.5,
                fontWeight:    600,
                fontFamily:    "inherit",
                cursor:        loading || success ? "not-allowed" : "pointer",
                display:       "flex",
                alignItems:    "center",
                justifyContent: "center",
                gap:           8,
                transition:    "all 0.3s cubic-bezier(.4,0,.2,1)",
                boxShadow:     success
                  ? "0 4px 14px rgba(5,150,105,0.3)"
                  : "0 4px 14px rgba(10,110,189,0.25)",
                letterSpacing: "-0.01em",
                marginTop:     8,
              }}
              onMouseEnter={(e) => {
                if (!loading && !success) {
                  (e.currentTarget).style.background  = "#0857A0";
                  (e.currentTarget).style.transform   = "translateY(-1px)";
                  (e.currentTarget).style.boxShadow   = "0 8px 24px rgba(10,110,189,0.3)";
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget).style.background  = success ? "#059669" : "#0A6EBD";
                (e.currentTarget).style.transform   = "translateY(0)";
                (e.currentTarget).style.boxShadow   = "0 4px 14px rgba(10,110,189,0.25)";
              }}
            >
              {success ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2.5 7l3 3 6-6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Redirecting…
                </>
              ) : loading ? (
                <>
                  <span style={{
                    width:          14,
                    height:         14,
                    borderRadius:   "50%",
                    border:         "2px solid rgba(255,255,255,0.3)",
                    borderTopColor: "#fff",
                    animation:      "spin 0.8s linear infinite",
                    display:        "inline-block",
                    flexShrink:     0,
                  }} />
                  Signing in…
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", fontSize: 11, color: "#C4CADB", marginTop: 20, letterSpacing: "-0.01em" }}>
          Sessions expire after 30 minutes of inactivity
          {DEMO_MODE && <span style={{ color: "#059669", marginLeft: 6 }}>· Demo Mode Active</span>}
        </p>

        {/* Demo credentials */}
        {DEMO_MODE && (
          <div style={{
            marginTop:     20,
            padding:       "16px",
            background:    "rgba(10,110,189,0.05)",
            border:        "1px solid rgba(10,110,189,0.12)",
            borderRadius:  16,
            fontSize:      12,
            color:         "#374151",
          }}>
            <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 12.5, color: "#0A0F1E", letterSpacing: "-0.2px" }}>
              Demo Credentials
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5, lineHeight: 1.6 }}>
              <div style={{ display: "flex", gap: 6 }}>
                <span style={{ fontWeight: 600, color: "#7C3AED", fontSize: 10, background: "rgba(124,58,237,0.08)", padding: "1px 6px", borderRadius: 4 }}>Admin</span>
                <span style={{ color: "#6B7280" }}>admin@f1dreamjobs.com</span>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <span style={{ fontWeight: 600, color: "#0A6EBD", fontSize: 10, background: "rgba(10,110,189,0.08)", padding: "1px 6px", borderRadius: 4 }}>Counselor</span>
                <span style={{ color: "#6B7280" }}>priya@f1dreamjobs.com</span>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <span style={{ fontWeight: 600, color: "#059669", fontSize: 10, background: "rgba(5,150,105,0.08)", padding: "1px 6px", borderRadius: 4 }}>Student</span>
                <span style={{ color: "#6B7280" }}>sarah@student.com</span>
              </div>
              <div style={{ marginTop: 4, color: "#9CA3AF", fontSize: 11 }}>Password: demo123</div>
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
