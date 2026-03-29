"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { createUserAction, type CreateUserState } from "@/lib/actions/createUser";
import { motion } from "framer-motion";

// ─── SVG Icons ────────────────────────────────────────────────────────────────
function IconStudent() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 2L2 6l8 4 8-4-8-4Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M6 8.5v4c0 1.66 1.79 3 4 3s4-1.34 4-3v-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M18 6v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}
function IconCounselor() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="3" y="3" width="14" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M7 17h6M10 13v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M7 8h6M7 10.5h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}
function IconAdmin() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 2l2 4h4l-3 3 1 4-4-2-4 2 1-4L4 6h4L10 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M6 18c0-2.21 1.79-4 4-4s4 1.79 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}
function IconEyeOff() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <path d="M1.5 1.5l12 12M6.2 6.3A2.5 2.5 0 0 0 7.5 11a2.5 2.5 0 0 0 2.4-1.85" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M3.3 3.8C2 4.8 1 6.5 1 6.5s2.3 4.5 6.5 4.5a7 7 0 0 0 2.75-.6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M7 2.5c.18-.02.33-.03.5-.03 4.2 0 6.5 4.5 6.5 4.5s-.7 1.3-1.9 2.45" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}
function IconEye() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <path d="M1 7.5S3.3 3 7.5 3s6.5 4.5 6.5 4.5S11.7 12 7.5 12 1 7.5 1 7.5Z" stroke="currentColor" strokeWidth="1.3"/>
      <circle cx="7.5" cy="7.5" r="2" stroke="currentColor" strokeWidth="1.3"/>
    </svg>
  );
}

// ─── Roles config ─────────────────────────────────────────────────────────────
const ROLES = [
  {
    value:  "student",
    label:  "Student",
    icon:   <IconStudent />,
    color:  "#059669",
    bg:     "rgba(5,150,105,0.06)",
    border: "rgba(5,150,105,0.2)",
    desc:   "Read-only view of their applications",
  },
  {
    value:  "counselor",
    label:  "Counselor",
    icon:   <IconCounselor />,
    color:  "#0A6EBD",
    bg:     "rgba(10,110,189,0.06)",
    border: "rgba(10,110,189,0.2)",
    desc:   "Can add and update applications",
  },
  {
    value:  "admin",
    label:  "Admin",
    icon:   <IconAdmin />,
    color:  "#7C3AED",
    bg:     "rgba(124,58,237,0.06)",
    border: "rgba(124,58,237,0.2)",
    desc:   "Full access to all data",
  },
];

// ─── Shared input styles ──────────────────────────────────────────────────────
const inp: React.CSSProperties = {
  width:         "100%",
  padding:       "10px 13px",
  border:        "1px solid rgba(0,0,0,0.09)",
  borderRadius:  12,
  background:    "#FFFFFF",
  fontFamily:    "'Inter', system-ui, sans-serif",
  fontSize:      13.5,
  color:         "#0A0F1E",
  outline:       "none",
  transition:    "all 0.2s ease",
  letterSpacing: "-0.01em",
};
const lbl: React.CSSProperties = {
  display:       "block",
  fontSize:      10.5,
  fontWeight:    700,
  color:         "#9CA3AF",
  textTransform: "uppercase",
  letterSpacing: "0.7px",
  marginBottom:  6,
};
const row: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 };

function Section({ title, children, accentColor, delay = 0 }: {
  title: string; children: React.ReactNode; accentColor?: string; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1], delay }}
      style={{
        background:    "#FFFFFF",
        border:        "1px solid rgba(0,0,0,0.06)",
        borderRadius:  20,
        boxShadow:     "0 1px 4px rgba(0,0,0,0.04)",
        padding:       "24px",
        marginBottom:  16,
        position:      "relative",
        overflow:      "hidden",
      }}
    >
      {accentColor && (
        <div style={{
          position:   "absolute",
          top:        0, left:   0, right: 0,
          height:     2,
          background: accentColor,
          opacity:    0.6,
        }} />
      )}
      <p style={{ fontSize: 10.5, fontWeight: 700, color: accentColor ?? "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 18 }}>
        {title}
      </p>
      {children}
    </motion.div>
  );
}

export default function CreateUserClient({
  counselors,
}: {
  counselors: { id: string; full_name: string; email: string }[];
}) {
  const router = useRouter();
  const [role, setRole]     = useState<"admin" | "counselor" | "student">("student");
  const [showPwd, setShowPwd] = useState(false);

  const [state, action, pending] = useActionState<CreateUserState, FormData>(createUserAction, {});

  const focusStyle = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.target.style.borderColor = "rgba(10,110,189,0.45)";
    e.target.style.boxShadow   = "0 0 0 3px rgba(10,110,189,0.07)";
  };
  const blurStyle = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.target.style.borderColor = "rgba(0,0,0,0.09)";
    e.target.style.boxShadow   = "none";
  };

  const selectedRole = ROLES.find((r) => r.value === role)!;

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "4px 0 40px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
        <button
          onClick={() => router.back()}
          style={{
            display:       "flex",
            alignItems:    "center",
            gap:           6,
            background:    "#FFFFFF",
            border:        "1px solid rgba(0,0,0,0.08)",
            borderRadius:  11,
            padding:       "8px 14px",
            fontSize:      13,
            fontWeight:    500,
            color:         "#6B7280",
            cursor:        "pointer",
            transition:    "all 0.2s ease",
            fontFamily:    "inherit",
            letterSpacing: "-0.01em",
          }}
          onMouseEnter={(e) => { (e.currentTarget).style.background = "#F7F9FC"; (e.currentTarget).style.color = "#0A0F1E"; }}
          onMouseLeave={(e) => { (e.currentTarget).style.background = "#FFFFFF"; (e.currentTarget).style.color = "#6B7280"; }}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M8 10L4 6.5 8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back
        </button>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0A0F1E", margin: 0, letterSpacing: "-0.5px" }}>Create Account</h1>
          <p style={{ fontSize: 12.5, color: "#9CA3AF", margin: "3px 0 0", letterSpacing: "-0.01em" }}>
            Accounts are activated immediately — no email verification required
          </p>
        </div>
      </div>

      <form action={action} noValidate>
        <input type="hidden" name="role" value={role} />

        {/* ── Role picker ── */}
        <Section title="Account Type" accentColor={selectedRole.color} delay={0}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {ROLES.map((r) => {
              const isActive = role === r.value;
              return (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value as typeof role)}
                  style={{
                    padding:    "16px 14px",
                    borderRadius: 14,
                    cursor:     "pointer",
                    textAlign:  "left",
                    border:     `1.5px solid ${isActive ? r.border : "rgba(0,0,0,0.07)"}`,
                    background: isActive ? r.bg : "transparent",
                    transition: "all 0.2s ease",
                    fontFamily: "inherit",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      (e.currentTarget).style.background   = "#F7F9FC";
                      (e.currentTarget).style.borderColor  = "rgba(0,0,0,0.12)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      (e.currentTarget).style.background  = "transparent";
                      (e.currentTarget).style.borderColor = "rgba(0,0,0,0.07)";
                    }
                  }}
                >
                  <div style={{ color: isActive ? r.color : "#9CA3AF", marginBottom: 8, display: "flex", alignItems: "center" }}>
                    {r.icon}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: isActive ? r.color : "#0A0F1E", letterSpacing: "-0.1px" }}>
                    {r.label}
                  </div>
                  <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 3, lineHeight: 1.4, letterSpacing: "-0.01em" }}>
                    {r.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </Section>

        {/* ── Basic info ── */}
        <Section title="Basic Information" delay={0.05}>
          <div style={row}>
            <div>
              <label style={lbl}>Full Name *</label>
              <input name="full_name" placeholder="Sarah Mitchell" required style={inp} onFocus={focusStyle} onBlur={blurStyle} />
            </div>
            <div>
              <label style={lbl}>Phone</label>
              <input name="phone" placeholder="+1 (555) 000-0001" style={inp} onFocus={focusStyle} onBlur={blurStyle} />
            </div>
          </div>

          <div style={{ ...row, marginTop: 14 }}>
            <div>
              <label style={lbl}>Email *</label>
              <input name="email" type="email" placeholder="sarah@example.com" required style={inp} onFocus={focusStyle} onBlur={blurStyle} />
            </div>
            <div>
              <label style={lbl}>Password *</label>
              <div style={{ position: "relative" }}>
                <input
                  name="password"
                  type={showPwd ? "text" : "password"}
                  placeholder="Min 8 characters"
                  required
                  style={{ ...inp, paddingRight: 40 }}
                  onFocus={focusStyle}
                  onBlur={blurStyle}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  style={{
                    position:   "absolute",
                    right:      11,
                    top:        "50%",
                    transform:  "translateY(-50%)",
                    background: "none",
                    border:     "none",
                    cursor:     "pointer",
                    color:      "#9CA3AF",
                    display:    "flex",
                    alignItems: "center",
                    padding:    2,
                  }}
                  onMouseEnter={(e) => { (e.currentTarget).style.color = "#6B7280"; }}
                  onMouseLeave={(e) => { (e.currentTarget).style.color = "#9CA3AF"; }}
                >
                  {showPwd ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
            </div>
          </div>
        </Section>

        {/* ── Student-only fields ── */}
        {role === "student" && (
          <Section title="Student Details" accentColor="#059669" delay={0.08}>
            <div style={row}>
              <div>
                <label style={lbl}>University</label>
                <input name="university" placeholder="MIT" style={inp} onFocus={focusStyle} onBlur={blurStyle} />
              </div>
              <div>
                <label style={lbl}>Major</label>
                <input name="major" placeholder="Computer Science" style={inp} onFocus={focusStyle} onBlur={blurStyle} />
              </div>
            </div>

            <div style={{ ...row, marginTop: 14 }}>
              <div>
                <label style={lbl}>Visa Status</label>
                <select name="visa_status" style={{ ...inp, appearance: "none" }} onFocus={focusStyle} onBlur={blurStyle}>
                  <option value="">Select visa status</option>
                  <option value="F-1 OPT">F-1 OPT</option>
                  <option value="F-1 CPT">F-1 CPT</option>
                  <option value="F-1 Student">F-1 Student</option>
                  <option value="H-1B">H-1B</option>
                  <option value="Green Card">Green Card</option>
                  <option value="US Citizen">US Citizen</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label style={lbl}>Graduation Date</label>
                <input name="graduation_date" type="date" style={inp} onFocus={focusStyle} onBlur={blurStyle} />
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <label style={lbl}>Assigned Counselor</label>
              <select name="assigned_counselor_id" style={{ ...inp, appearance: "none" }} onFocus={focusStyle} onBlur={blurStyle}>
                <option value="">Assign later</option>
                {counselors.map((c) => (
                  <option key={c.id} value={c.id}>{c.full_name} · {c.email}</option>
                ))}
              </select>
              {counselors.length === 0 && (
                <p style={{ fontSize: 11.5, color: "#D97706", marginTop: 7, letterSpacing: "-0.01em" }}>
                  No counselors yet — create a counselor account first, then assign.
                </p>
              )}
            </div>
          </Section>
        )}

        {/* ── Error ── */}
        {state?.error && (
          <div style={{
            background:    "rgba(220,38,38,0.05)",
            border:        "1px solid rgba(220,38,38,0.15)",
            borderRadius:  12,
            padding:       "12px 16px",
            marginBottom:  16,
            fontSize:      13,
            color:         "#DC2626",
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
            {state.error}
          </div>
        )}

        {/* ── Submit ── */}
        <motion.button
          type="submit"
          disabled={pending}
          whileHover={!pending ? { y: -2, boxShadow: "0 10px 30px rgba(10,110,189,0.3)" } : {}}
          whileTap={!pending ? { y: 0 } : {}}
          style={{
            width:         "100%",
            padding:       "13px 0",
            borderRadius:  14,
            border:        "none",
            background:    pending ? "rgba(10,110,189,0.55)" : "#0A6EBD",
            color:         "#fff",
            fontFamily:    "'Inter', system-ui, sans-serif",
            fontSize:      14.5,
            fontWeight:    600,
            cursor:        pending ? "not-allowed" : "pointer",
            boxShadow:     "0 4px 14px rgba(10,110,189,0.22)",
            transition:    "background 0.2s",
            letterSpacing: "-0.01em",
          }}
        >
          {pending ? (
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
              <span style={{
                width:          15,
                height:         15,
                border:         "2px solid rgba(255,255,255,0.35)",
                borderTopColor: "#fff",
                borderRadius:   "50%",
                display:        "inline-block",
                animation:      "spin 0.7s linear infinite",
              }} />
              Creating account…
            </span>
          ) : (
            `Create ${role.charAt(0).toUpperCase() + role.slice(1)} Account`
          )}
        </motion.button>
      </form>
    </div>
  );
}
