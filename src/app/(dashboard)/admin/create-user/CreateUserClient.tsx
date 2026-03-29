"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { createUserAction, type CreateUserState } from "@/lib/actions/createUser";
import { motion } from "framer-motion";

const ROLES = [
  { value: "student",   label: "Student",   icon: "🎓", color: "#3b82f6", desc: "Read-only view of their applications" },
  { value: "counselor", label: "Counselor", icon: "💼", color: "#10b981", desc: "Can add and update applications" },
  { value: "admin",     label: "Admin",     icon: "👑", color: "#8b5cf6", desc: "Full access to everything" },
];

const inp: React.CSSProperties = {
  width: "100%", padding: "10px 13px", border: "1.5px solid rgba(0,0,0,0.08)",
  borderRadius: 10, background: "rgba(255,255,255,0.65)", fontFamily: "inherit",
  fontSize: 14, color: "#1e293b", outline: "none", transition: "all 0.2s ease",
};
const lbl: React.CSSProperties = {
  display: "block", fontSize: 11, fontWeight: 700, color: "#64748b",
  textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6,
};
const row: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 };

export default function CreateUserClient({
  counselors,
}: {
  counselors: { id: string; full_name: string; email: string }[];
}) {
  const router = useRouter();
  const [role, setRole] = useState<"admin" | "counselor" | "student">("student");
  const [showPwd, setShowPwd] = useState(false);

  const [state, action, pending] = useActionState<CreateUserState, FormData>(
    createUserAction,
    {}
  );

  const focusStyle = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.target.style.borderColor = "rgba(59,130,246,0.45)";
    e.target.style.boxShadow   = "0 0 0 3px rgba(59,130,246,0.07)";
  };
  const blurStyle = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.target.style.borderColor = "rgba(0,0,0,0.08)";
    e.target.style.boxShadow   = "none";
  };

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "8px 0 40px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
        <button
          onClick={() => router.back()}
          style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(0,0,0,0.07)", borderRadius: 10, padding: "7px 14px", fontSize: 13, fontWeight: 500, color: "#64748b", cursor: "pointer" }}
        >
          ← Back
        </button>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1e293b", margin: 0 }}>Create Account</h1>
          <p style={{ fontSize: 13, color: "#94a3b8", margin: "3px 0 0" }}>Accounts are activated immediately — no email verification needed</p>
        </div>
      </div>

      <form action={action} noValidate>
        {/* Hidden role field (controlled by radio buttons below) */}
        <input type="hidden" name="role" value={role} />

        {/* ── Role picker ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: "rgba(255,255,255,0.5)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.65)", borderRadius: 18, padding: 24, marginBottom: 18 }}
        >
          <p style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 14 }}>Account Type *</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {ROLES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value as typeof role)}
                style={{
                  padding: "14px 12px", borderRadius: 12, cursor: "pointer", textAlign: "left",
                  border: `2px solid ${role === r.value ? r.color : "rgba(0,0,0,0.07)"}`,
                  background: role === r.value ? `${r.color}10` : "rgba(255,255,255,0.5)",
                  transition: "all 0.2s ease",
                }}
              >
                <div style={{ fontSize: 22, marginBottom: 6 }}>{r.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: role === r.value ? r.color : "#1e293b" }}>{r.label}</div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3, lineHeight: 1.4 }}>{r.desc}</div>
              </button>
            ))}
          </div>
        </motion.div>

        {/* ── Basic info ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          style={{ background: "rgba(255,255,255,0.5)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.65)", borderRadius: 18, padding: 24, marginBottom: 18 }}
        >
          <p style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 16 }}>Basic Information</p>

          <div style={row}>
            <div>
              <label style={lbl}>Full Name *</label>
              <input name="full_name" placeholder="Sarah Mitchell" required style={inp} onFocus={focusStyle} onBlur={blurStyle} />
            </div>
            <div>
              <label style={lbl}>Phone</label>
              <input name="phone" placeholder="+91 98765 00001" style={inp} onFocus={focusStyle} onBlur={blurStyle} />
            </div>
          </div>

          <div style={{ ...row, marginTop: 14 }}>
            <div>
              <label style={lbl}>Email *</label>
              <input name="email" type="email" placeholder="sarah@student.com" required style={inp} onFocus={focusStyle} onBlur={blurStyle} />
            </div>
            <div>
              <label style={lbl}>Password *</label>
              <div style={{ position: "relative" }}>
                <input
                  name="password" type={showPwd ? "text" : "password"}
                  placeholder="Min 8 characters" required style={{ ...inp, paddingRight: 40 }}
                  onFocus={focusStyle} onBlur={blurStyle}
                />
                <button
                  type="button" onClick={() => setShowPwd((v) => !v)}
                  style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#94a3b8" }}
                >
                  {showPwd ? "🙈" : "👁"}
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Student-only fields ── */}
        {role === "student" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: "rgba(59,130,246,0.04)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1.5px solid rgba(59,130,246,0.15)", borderRadius: 18, padding: 24, marginBottom: 18 }}
          >
            <p style={{ fontSize: 11, fontWeight: 700, color: "#3b82f6", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 16 }}>Student Details</p>

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
                <option value="">— Assign later —</option>
                {counselors.map((c) => (
                  <option key={c.id} value={c.id}>{c.full_name} ({c.email})</option>
                ))}
              </select>
              {counselors.length === 0 && (
                <p style={{ fontSize: 12, color: "#f59e0b", marginTop: 6 }}>
                  No counselors yet — create a counselor account first, then assign.
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* ── Error / submit ── */}
        {state?.error && (
          <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 12, padding: "12px 16px", marginBottom: 16, fontSize: 13.5, color: "#dc2626", display: "flex", alignItems: "center", gap: 8 }}>
            <span>⚠️</span> {state.error}
          </div>
        )}

        <motion.button
          type="submit"
          disabled={pending}
          whileHover={!pending ? { y: -2, boxShadow: "0 8px 28px rgba(59,130,246,0.35)" } : {}}
          whileTap={!pending ? { y: 0 } : {}}
          style={{
            width: "100%", padding: "13px 0", borderRadius: 12, border: "none",
            background: pending ? "rgba(59,130,246,0.5)" : "linear-gradient(135deg, #3b82f6, #10b981)",
            color: "#fff", fontFamily: "inherit", fontSize: 15, fontWeight: 700,
            cursor: pending ? "not-allowed" : "pointer",
            boxShadow: "0 4px 14px rgba(59,130,246,0.25)", transition: "background 0.2s",
          }}
        >
          {pending ? (
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
              <span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
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
