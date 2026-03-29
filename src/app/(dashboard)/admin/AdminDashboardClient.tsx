"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import Avatar from "@/components/Avatar";
import Modal from "@/components/Modal";
import { useUIStore } from "@/lib/stores/uiStore";
import { updateApplicationStatus } from "@/lib/api/applications";
import { createClient } from "@/lib/supabase/client";
import type { ApplicationStatus } from "@/lib/supabase/database.types";
import type { AdminProfile, AdminStudent, AdminApplication } from "./page";

// ─── Palette ─────────────────────────────────────────────────────────────────
const STATUS_COLOR: Record<ApplicationStatus, string> = {
  applied:     "#3b82f6",
  in_progress: "#f59e0b",
  interview:   "#10b981",
  rejected:    "#ef4444",
  offered:     "#8b5cf6",
};
const STATUS_LABEL: Record<ApplicationStatus, string> = {
  applied: "Applied", in_progress: "In Progress", interview: "Interview",
  rejected: "Rejected", offered: "Offered",
};
const ALL_STATUSES: ApplicationStatus[] = ["applied","in_progress","interview","rejected","offered"];

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function initials(name: string) {
  return name.split(" ").map((n) => n[0] ?? "").slice(0, 2).join("").toUpperCase();
}

// ─── Pipeline Bar ─────────────────────────────────────────────────────────────
function PipelineBar({ apps }: { apps: AdminApplication[] }) {
  const total = apps.length || 1;
  const counts = ALL_STATUSES.map((s) => ({
    status: s,
    count: apps.filter((a) => a.status === s).length,
  })).filter((x) => x.count > 0);

  return (
    <div style={{ background: "rgba(255,255,255,0.5)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.65)", borderRadius: 18, boxShadow: "0 4px 24px rgba(0,0,0,0.03)", padding: "20px 22px", marginBottom: 22 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 14 }}>
        Pipeline Overview
      </div>

      {/* Segmented bar */}
      <div style={{ display: "flex", borderRadius: 10, overflow: "hidden", height: 12, marginBottom: 14, background: "rgba(0,0,0,0.04)" }}>
        {counts.map(({ status, count }, i) => (
          <motion.div
            key={status}
            initial={{ width: 0 }}
            animate={{ width: `${(count / total) * 100}%` }}
            transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1], delay: i * 0.07 }}
            style={{ background: STATUS_COLOR[status], height: "100%", minWidth: count > 0 ? 4 : 0 }}
          />
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 20px" }}>
        {counts.map(({ status, count }) => (
          <div key={status} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: STATUS_COLOR[status], flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>
              {STATUS_LABEL[status]} <strong style={{ color: "#1e293b" }}>{count}</strong>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Counselor performance card ───────────────────────────────────────────────
function CounselorCard({
  counselor,
  students,
  apps,
  index,
}: {
  counselor: AdminProfile;
  students:  AdminStudent[];
  apps:      AdminApplication[];
  index:     number;
}) {
  const myStudentIds  = students.filter((s) => s.counselor?.id === counselor.id).map((s) => s.id);
  const myApps        = apps.filter((a) => myStudentIds.includes(a.student_id));
  const interviewCount = myApps.filter((a) => a.status === "interview" || a.status === "offered").length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1], delay: index * 0.07 }}
      style={{ background: "rgba(255,255,255,0.5)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.65)", borderRadius: 16, boxShadow: "0 4px 24px rgba(0,0,0,0.03)", padding: "18px 20px" }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <Avatar initials={initials(counselor.full_name)} size={38} color="#3b82f6" src={counselor.avatar_url} />
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>{counselor.full_name}</div>
          <div style={{ fontSize: 11.5, color: "#94a3b8" }}>{counselor.email}</div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
        {[
          { label: "Students",     value: myStudentIds.length },
          { label: "Applications", value: myApps.length       },
          { label: "Interviews",   value: interviewCount       },
        ].map(({ label, value }) => (
          <div key={label} style={{ textAlign: "center", background: "rgba(248,250,255,0.7)", borderRadius: 10, padding: "10px 8px" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#1e293b" }}>{value}</div>
            <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Student drill-down ───────────────────────────────────────────────────────
function StudentDrillDown({
  student,
  apps,
  onBack,
  onStatusChange,
}: {
  student:        AdminStudent;
  apps:           AdminApplication[];
  onBack:         () => void;
  onStatusChange: (id: string, status: ApplicationStatus) => void;
}) {
  const myApps = apps.filter((a) => a.student_id === student.id);
  const counts = {
    applied:     myApps.filter((a) => a.status === "applied").length,
    in_progress: myApps.filter((a) => a.status === "in_progress").length,
    interview:   myApps.filter((a) => a.status === "interview").length,
    offered:     myApps.filter((a) => a.status === "offered").length,
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0  }}
      exit={{   opacity: 0, x: 20  }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Back + header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 22 }}>
        <button
          onClick={onBack}
          style={{ background: "rgba(255,255,255,0.5)", border: "1px solid rgba(0,0,0,0.07)", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 600, color: "#64748b", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s" }}
          onMouseEnter={(e) => { (e.currentTarget).style.color = "#1e293b"; }}
          onMouseLeave={(e) => { (e.currentTarget).style.color = "#64748b"; }}
        >
          ← Back
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Avatar initials={initials(student.profile.full_name)} size={42} color="#10b981" src={student.profile.avatar_url} />
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#1e293b" }}>{student.profile.full_name}</div>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>
              {student.profile.email} · {student.university ?? ""}
              {student.counselor ? ` · Counselor: ${student.counselor.full_name}` : ""}
            </div>
          </div>
        </div>
      </div>

      {/* Mini stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 22 }}>
        <StatCard icon="📨" value={counts.applied}     label="Applied"     delay={0}   />
        <StatCard icon="⚙️" value={counts.in_progress} label="In Progress" delay={60}  />
        <StatCard icon="🎯" value={counts.interview}    label="Interview"   delay={120} />
        <StatCard icon="🎉" value={counts.offered}      label="Offered"     delay={180} />
      </div>

      {/* Applications table */}
      <div style={{ background: "rgba(255,255,255,0.5)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.65)", borderRadius: 18, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.03)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "rgba(248,250,255,0.6)", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
              {["Company / Role", "Status", "Applied By", "Date"].map((h) => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 10.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.7 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {myApps.length === 0 ? (
              <tr><td colSpan={4} style={{ padding: "40px", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>No applications yet.</td></tr>
            ) : (
              myApps.map((app, i) => (
                <motion.tr key={app.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: i * 0.03 }} style={{ borderBottom: "1px solid rgba(0,0,0,0.035)", transition: "background 0.18s" }}
                  onMouseEnter={(e) => { (e.currentTarget).style.background = "rgba(59,130,246,0.03)"; }}
                  onMouseLeave={(e) => { (e.currentTarget).style.background = "transparent"; }}
                >
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: "#1e293b" }}>{app.company_name}</div>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{app.job_role}</div>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <StatusDropdownSimple appId={app.id} current={app.status} onUpdate={onStatusChange} />
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 12.5, color: "#475569" }}>
                    {(app.applied_by_profile as { full_name: string } | null)?.full_name ?? "—"}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "#94a3b8", whiteSpace: "nowrap" }}>{fmt(app.applied_at)}</td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

// Inline status dropdown (used in drill-down + admin table)
function StatusDropdownSimple({ appId, current, onUpdate }: { appId: string; current: ApplicationStatus; onUpdate: (id: string, s: ApplicationStatus) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <StatusBadge status={current} onClick={() => setOpen((o) => !o)} />
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.16 }}
            style={{ position: "absolute", top: "calc(100% + 5px)", left: 0, zIndex: 60, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.7)", borderRadius: 12, boxShadow: "0 8px 28px rgba(0,0,0,0.1)", padding: 5, minWidth: 145, display: "flex", flexDirection: "column", gap: 2 }}
          >
            {ALL_STATUSES.map((s) => (
              <button key={s} onClick={() => { onUpdate(appId, s); setOpen(false); }}
                style={{ background: s === current ? "rgba(59,130,246,0.06)" : "transparent", border: "none", borderRadius: 8, padding: "6px 10px", cursor: "pointer", textAlign: "left", fontFamily: "inherit", display: "flex", alignItems: "center" }}
              ><StatusBadge status={s} size="sm" /></button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Create User form ─────────────────────────────────────────────────────────
const createUserSchema = z.object({
  full_name: z.string().min(2, "Name required"),
  email:     z.string().email("Valid email required"),
  password:  z.string().min(8, "Min 8 characters"),
  role:      z.enum(["admin", "counselor", "student"]),
  assigned_counselor_id: z.string().optional(),
});
type CreateUserForm = z.infer<typeof createUserSchema>;

function CreateUserModal({
  isOpen,
  onClose,
  counselors,
  onCreated,
}: {
  isOpen:     boolean;
  onClose:    () => void;
  counselors: AdminProfile[];
  onCreated:  (p: AdminProfile) => void;
}) {
  const { addToast } = useUIStore();
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { role: "student" },
  });
  const role = watch("role");

  async function onSubmit(data: CreateUserForm) {
    setSubmitting(true);
    const supabase = createClient();

    // Use Supabase Auth signUp — admin creates user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email:    data.email,
      password: data.password,
      options:  { data: { full_name: data.full_name, role: data.role } },
    });

    if (authError || !authData.user) {
      addToast(authError?.message ?? "Failed to create user.", "error");
      setSubmitting(false);
      return;
    }

    // Upsert profile (trigger may have already created it)
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .upsert({ 
        id: authData.user.id, 
        full_name: data.full_name, 
        email: data.email, 
        role: data.role,
        phone: null,
        avatar_url: null,
        is_active: true
      })
      .select()
      .single();

    if (profileError || !profile) {
      addToast("User auth created but profile failed. Check Supabase.", "error");
      setSubmitting(false);
      return;
    }

    // If student, create student record
    if (data.role === "student") {
      await supabase.from("students").insert({
        profile_id:            authData.user.id,
        assigned_counselor_id: data.assigned_counselor_id || null,
        university: null,
        major: null,
        graduation_date: null,
        visa_status: null,
        status: "active"
      } as any);
    }

    addToast(`${data.role} account created for ${data.full_name}`, "success");
    onCreated(profile as AdminProfile);
    reset();
    onClose();
    setSubmitting(false);
  }

  const inputCls: React.CSSProperties = { width: "100%", padding: "10px 13px", border: "1.5px solid rgba(0,0,0,0.08)", borderRadius: 10, background: "rgba(255,255,255,0.6)", fontFamily: "inherit", fontSize: 13.5, color: "#1e293b", outline: "none", transition: "all 0.2s", marginBottom: 14 };
  const labelCls: React.CSSProperties = { display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 5 };
  const errCls: React.CSSProperties   = { color: "#ef4444", fontSize: 11.5, marginTop: -10, marginBottom: 10 };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New User" maxWidth={480}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <label style={labelCls}>Full Name *</label>
        <input placeholder="Sarah Mitchell" {...register("full_name")} style={inputCls}
          onFocus={(e) => { e.target.style.borderColor = "rgba(59,130,246,0.45)"; e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.07)"; }}
          onBlur={(e)  => { e.target.style.borderColor = "rgba(0,0,0,0.08)"; e.target.style.boxShadow = "none"; }}
        />
        {errors.full_name && <p style={errCls}>{errors.full_name.message}</p>}

        <label style={labelCls}>Email *</label>
        <input type="email" placeholder="sarah@student.com" {...register("email")} style={inputCls}
          onFocus={(e) => { e.target.style.borderColor = "rgba(59,130,246,0.45)"; e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.07)"; }}
          onBlur={(e)  => { e.target.style.borderColor = "rgba(0,0,0,0.08)"; e.target.style.boxShadow = "none"; }}
        />
        {errors.email && <p style={errCls}>{errors.email.message}</p>}

        <label style={labelCls}>Password *</label>
        <input type="password" placeholder="Min 8 characters" {...register("password")} style={inputCls}
          onFocus={(e) => { e.target.style.borderColor = "rgba(59,130,246,0.45)"; e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.07)"; }}
          onBlur={(e)  => { e.target.style.borderColor = "rgba(0,0,0,0.08)"; e.target.style.boxShadow = "none"; }}
        />
        {errors.password && <p style={errCls}>{errors.password.message}</p>}

        <label style={labelCls}>Role *</label>
        <select {...register("role")} style={{ ...inputCls, cursor: "pointer" }}
          onFocus={(e) => { e.target.style.borderColor = "rgba(59,130,246,0.45)"; }}
          onBlur={(e)  => { e.target.style.borderColor = "rgba(0,0,0,0.08)"; }}
        >
          <option value="student">Student</option>
          <option value="counselor">Counselor</option>
          <option value="admin">Admin</option>
        </select>

        {role === "student" && counselors.length > 0 && (
          <>
            <label style={labelCls}>Assign Counselor</label>
            <select {...register("assigned_counselor_id")} style={{ ...inputCls, cursor: "pointer" }}
              onFocus={(e) => { e.target.style.borderColor = "rgba(59,130,246,0.45)"; }}
              onBlur={(e)  => { e.target.style.borderColor = "rgba(0,0,0,0.08)"; }}
            >
              <option value="">Unassigned</option>
              {counselors.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
            </select>
          </>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 6 }}>
          <button type="button" onClick={onClose} style={{ padding: "10px 18px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.08)", background: "transparent", color: "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
          <button type="submit" disabled={submitting} style={{ padding: "10px 22px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #3b82f6, #10b981)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: submitting ? 0.7 : 1, display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 14px rgba(59,130,246,0.25)" }}>
            {submitting ? (<><span style={{ width: 13, height: 13, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "spin 0.8s linear infinite", display: "inline-block" }} />Creating…</>) : "Create User"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Main Admin Dashboard ─────────────────────────────────────────────────────
type Tab = "overview" | "users";

export default function AdminDashboardClient({
  allProfiles,
  allStudents,
  allApplications,
  recentCount,
}: {
  allProfiles:     AdminProfile[];
  allStudents:     AdminStudent[];
  allApplications: AdminApplication[];
  recentCount:     number;
}) {
  const router = useRouter();
  const [profiles, setProfiles]     = useState<AdminProfile[]>(allProfiles);
  const [apps, setApps]             = useState<AdminApplication[]>(allApplications);
  const [tab, setTab]               = useState<Tab>("overview");
  const [drillStudent, setDrill]    = useState<AdminStudent | null>(null);
  const { addToast } = useUIStore();

  // Show success toast when redirected back after creating a user
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.search.includes("created=1")) {
      addToast("Account created successfully!", "success");
      const url = new URL(window.location.href);
      url.searchParams.delete("created");
      window.history.replaceState({}, "", url.toString());
    }
  }, [addToast]);

  const counselors = useMemo(() => profiles.filter((p) => p.role === "counselor"), [profiles]);
  const students   = useMemo(() => allStudents, [allStudents]);

  const counts = {
    students:    allStudents.length,
    counselors:  counselors.length,
    total:       apps.length,
    recent:      recentCount,
  };

  async function handleStatusChange(id: string, status: ApplicationStatus) {
    const { error } = await updateApplicationStatus(id, status);
    if (error) { addToast("Failed to update status.", "error"); return; }
    setApps((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    addToast(`Status → ${status.replace("_", " ")}`, "success");
  }

  async function handleDeactivate(profileId: string, currentActive: boolean) {
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ is_active: !currentActive })
      .eq("id", profileId);
    if (error) { addToast("Failed to update user.", "error"); return; }
    setProfiles((prev) => prev.map((p) => p.id === profileId ? { ...p, is_active: !currentActive } : p));
    addToast(`User ${currentActive ? "deactivated" : "activated"}.`, "success");
  }

  const ROLE_COLOR: Record<string, string> = { admin: "#8b5cf6", counselor: "#3b82f6", student: "#10b981" };

  // ── Drill-down view ──
  if (drillStudent) {
    return (
      <StudentDrillDown
        student={drillStudent}
        apps={apps}
        onBack={() => setDrill(null)}
        onStatusChange={handleStatusChange}
      />
    );
  }

  return (
    <div>
      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}
      >
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0A0F1E", margin: "0 0 3px", letterSpacing: "-0.5px" }}>Admin Overview</h2>
          <p style={{ fontSize: 13, color: "#9CA3AF", margin: 0, letterSpacing: "-0.01em" }}>Full system visibility across all students and counselors.</p>
        </div>
        <button onClick={() => router.push("/admin/create-user")}
          style={{ padding: "10px 20px", borderRadius: 12, border: "none", background: "#0A6EBD", color: "#fff", fontSize: 13.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 7, boxShadow: "0 4px 14px rgba(10,110,189,0.25)", transition: "all 0.25s", whiteSpace: "nowrap", letterSpacing: "-0.01em" }}
          onMouseEnter={(e) => { (e.currentTarget).style.background = "#0857A0"; (e.currentTarget).style.transform = "translateY(-1px)"; (e.currentTarget).style.boxShadow = "0 8px 24px rgba(10,110,189,0.3)"; }}
          onMouseLeave={(e) => { (e.currentTarget).style.background = "#0A6EBD"; (e.currentTarget).style.transform = "translateY(0)"; (e.currentTarget).style.boxShadow = "0 4px 14px rgba(10,110,189,0.25)"; }}
        >
          <span style={{ fontSize: 18, lineHeight: 1, fontWeight: 400 }}>+</span> New User
        </button>
      </motion.div>

      {/* ── Stat cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 22 }}>
        <StatCard icon="🎓" value={counts.students}   label="Total Students"   delay={0}   />
        <StatCard icon="📋" value={counts.counselors} label="Counselors"        delay={70}  />
        <StatCard icon="📊" value={counts.total}      label="Applications"      delay={140} />
        <StatCard icon="🔥" value={counts.recent}     label="Recent (48h)"      delay={210} />
      </div>

      {/* ── Pipeline bar ── */}
      <PipelineBar apps={apps} />

      {/* ── Tabs ── */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
        {([["overview", "Students & Team"], ["users", "User Management"]] as [Tab, string][]).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            style={{ padding: "8px 18px", borderRadius: 10, border: tab === key ? "none" : "1px solid rgba(0,0,0,0.07)", fontFamily: "inherit", fontSize: 12.5, fontWeight: 600, cursor: "pointer", transition: "all 0.22s", background: tab === key ? "#0A0F1E" : "#FFFFFF", color: tab === key ? "#fff" : "#6B7280", letterSpacing: "-0.01em" }}
          >{label}</button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ══ OVERVIEW TAB ══ */}
        {tab === "overview" && (
          <motion.div key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
            {/* Team Performance */}
            {counselors.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 12 }}>Team Performance</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: 12 }}>
                  {counselors.map((c, i) => (
                    <CounselorCard key={c.id} counselor={c} students={students} apps={apps} index={i} />
                  ))}
                </div>
              </div>
            )}

            {/* All Students */}
            <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 12 }}>All Students</div>
            <div style={{ background: "rgba(255,255,255,0.5)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.65)", borderRadius: 18, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.03)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "rgba(248,250,255,0.6)", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                    {["Student", "Counselor", "Applications", ""].map((h) => (
                      <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 10.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.7 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {students.length === 0 ? (
                    <tr><td colSpan={4} style={{ padding: "40px", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>No students yet.</td></tr>
                  ) : (
                    students.map((s, i) => {
                      const myApps = apps.filter((a) => a.student_id === s.id);
                      return (
                        <motion.tr key={s.id}
                          initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24, delay: i * 0.03 }}
                          onClick={() => setDrill(s)}
                          style={{ borderBottom: "1px solid rgba(0,0,0,0.035)", cursor: "pointer", transition: "background 0.18s" }}
                          onMouseEnter={(e) => { (e.currentTarget).style.background = "rgba(59,130,246,0.03)"; }}
                          onMouseLeave={(e) => { (e.currentTarget).style.background = "transparent"; }}
                        >
                          <td style={{ padding: "12px 16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <Avatar initials={initials(s.profile.full_name)} size={32} color="#10b981" src={s.profile.avatar_url} />
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 650, color: "#1e293b" }}>{s.profile.full_name}</div>
                                <div style={{ fontSize: 11, color: "#94a3b8" }}>{s.university ?? s.profile.email}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "12px 16px", fontSize: 13, color: "#64748b" }}>
                            {s.counselor?.full_name ?? <span style={{ color: "#cbd5e1" }}>Unassigned</span>}
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                              {ALL_STATUSES.map((st) => {
                                const c = myApps.filter((a) => a.status === st).length;
                                if (!c) return null;
                                return (
                                  <span key={st} style={{ fontSize: 10.5, fontWeight: 600, padding: "2px 7px", borderRadius: 6, background: `${STATUS_COLOR[st]}12`, color: STATUS_COLOR[st] }}>
                                    {STATUS_LABEL[st]} {c}
                                  </span>
                                );
                              })}
                            </div>
                          </td>
                          <td style={{ padding: "12px 16px", textAlign: "right", fontSize: 12, color: "#94a3b8" }}>
                            View ›
                          </td>
                        </motion.tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* ══ USER MANAGEMENT TAB ══ */}
        {tab === "users" && (
          <motion.div key="users" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
            <div style={{ background: "rgba(255,255,255,0.5)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.65)", borderRadius: 18, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.03)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "rgba(248,250,255,0.6)", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                    {["User", "Role", "Joined", "Status", "Action"].map((h) => (
                      <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 10.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.7 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {profiles.map((p, i) => (
                    <motion.tr key={p.id}
                      initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24, delay: i * 0.025 }}
                      style={{ borderBottom: "1px solid rgba(0,0,0,0.035)", transition: "background 0.18s" }}
                      onMouseEnter={(e) => { (e.currentTarget).style.background = "rgba(59,130,246,0.025)"; }}
                      onMouseLeave={(e) => { (e.currentTarget).style.background = "transparent"; }}
                    >
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <Avatar initials={initials(p.full_name)} size={32} color={ROLE_COLOR[p.role] ?? "#3b82f6"} src={p.avatar_url} />
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 650, color: "#1e293b" }}>{p.full_name}</div>
                            <div style={{ fontSize: 11, color: "#94a3b8" }}>{p.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 7, background: `${ROLE_COLOR[p.role]}12`, color: ROLE_COLOR[p.role], textTransform: "capitalize" }}>{p.role}</span>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 12, color: "#94a3b8" }}>{fmt(p.created_at)}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 7, background: p.is_active ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.07)", color: p.is_active ? "#10b981" : "#ef4444" }}>
                          {p.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <button
                          onClick={() => handleDeactivate(p.id, p.is_active)}
                          style={{ padding: "5px 12px", borderRadius: 8, border: `1px solid ${p.is_active ? "rgba(239,68,68,0.2)" : "rgba(16,185,129,0.2)"}`, background: "transparent", color: p.is_active ? "#ef4444" : "#10b981", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" }}
                        >
                          {p.is_active ? "Deactivate" : "Activate"}
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create user now handled at /admin/create-user */}
    </div>
  );
}
