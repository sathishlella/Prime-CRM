"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import Avatar from "@/components/Avatar";
import Modal from "@/components/Modal";
import { useRealtime } from "@/lib/hooks/useRealtime";
import { useUIStore } from "@/lib/stores/uiStore";
import { createApplication, updateApplicationStatus } from "@/lib/api/applications";
import { getStudentResumes } from "@/lib/api/documents";
import type { ApplicationStatus } from "@/lib/supabase/database.types";
import type { CounselorStudent, CounselorApplication } from "./page";

// ─── Status dropdown component ───────────────────────────────────────────────
const ALL_STATUSES: ApplicationStatus[] = [
  "applied", "in_progress", "interview", "rejected", "offered",
];

function StatusDropdown({
  appId,
  current,
  onUpdate,
}: {
  appId:    string;
  current:  ApplicationStatus;
  onUpdate: (id: string, s: ApplicationStatus) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <StatusBadge status={current} onClick={() => setOpen((o) => !o)} />

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1   }}
            exit={{   opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
            style={{
              position:             "absolute",
              top:                  "calc(100% + 6px)",
              left:                 0,
              zIndex:               50,
              background:           "rgba(255,255,255,0.92)",
              backdropFilter:       "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border:               "1px solid rgba(255,255,255,0.75)",
              borderRadius:         12,
              boxShadow:            "0 8px 32px rgba(0,0,0,0.1)",
              padding:              6,
              minWidth:             150,
              display:              "flex",
              flexDirection:        "column",
              gap:                  2,
            }}
          >
            {ALL_STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => { onUpdate(appId, s); setOpen(false); }}
                style={{
                  background:  s === current ? "rgba(59,130,246,0.06)" : "transparent",
                  border:      "none",
                  borderRadius: 8,
                  padding:     "7px 10px",
                  cursor:      "pointer",
                  textAlign:   "left",
                  fontFamily:  "inherit",
                  display:     "flex",
                  alignItems:  "center",
                }}
              >
                <StatusBadge status={s} size="sm" />
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Add Application form schema ──────────────────────────────────────────────
const addAppSchema = z.object({
  student_id:      z.string().min(1, "Select a student"),
  company_name:    z.string().min(1, "Company is required"),
  job_role:        z.string().min(1, "Role is required"),
  job_link:        z.string().url("Enter a valid URL").or(z.literal("")),
  resume_used:     z.string(),
  job_description: z.string(),
  notes:           z.string(),
});
type AddAppForm = z.infer<typeof addAppSchema>;

function AddApplicationModal({
  isOpen,
  onClose,
  students,
  onAdded,
}: {
  isOpen:   boolean;
  onClose:  () => void;
  students: CounselorStudent[];
  onAdded:  (app: CounselorApplication) => void;
}) {
  const { addToast } = useUIStore();
  const [submitting,  setSubmitting]  = useState(false);
  const [resumes,     setResumes]     = useState<{ id: string; file_name: string }[]>([]);
  const [loadingRes,  setLoadingRes]  = useState(false);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<AddAppForm>({
    resolver: zodResolver(addAppSchema),
    defaultValues: { job_link: "", resume_used: "", job_description: "", notes: "" },
  });

  const watchedStudent = watch("student_id");

  // When student changes, fetch their uploaded resumes
  async function onStudentChange(studentId: string) {
    setValue("student_id", studentId);
    setValue("resume_used", "");
    if (!studentId) { setResumes([]); return; }
    setLoadingRes(true);
    const { data } = await getStudentResumes(studentId);
    setResumes(data as { id: string; file_name: string }[]);
    setLoadingRes(false);
  }

  async function onSubmit(data: AddAppForm) {
    setSubmitting(true);
    const { data: app, error } = await createApplication({
      student_id:      data.student_id,
      company_name:    data.company_name,
      job_role:        data.job_role,
      job_description: data.job_description || undefined,
      job_link:        data.job_link        || undefined,
      resume_used:     data.resume_used     || undefined,
      notes:           data.notes           || undefined,
    });

    setSubmitting(false);

    if (error || !app) {
      addToast("Failed to add application. Please try again.", "error");
      return;
    }

    addToast(`Application added: ${data.company_name} — ${data.job_role}`, "success");
    onAdded(app as unknown as CounselorApplication);
    reset();
    onClose();
  }

  const labelStyle: React.CSSProperties = {
    display:       "block",
    fontSize:      11,
    fontWeight:    700,
    color:         "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom:  5,
  };

  const inputStyle: React.CSSProperties = {
    width:       "100%",
    padding:     "10px 13px",
    border:      "1.5px solid rgba(0,0,0,0.08)",
    borderRadius: 10,
    background:  "rgba(255,255,255,0.6)",
    fontFamily:  "inherit",
    fontSize:    13.5,
    color:       "#1e293b",
    outline:     "none",
    transition:  "all 0.22s cubic-bezier(.4,0,.2,1)",
    marginBottom: 16,
  };

  const errorStyle: React.CSSProperties = {
    color:       "#ef4444",
    fontSize:    11.5,
    marginTop:   -12,
    marginBottom: 12,
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Application" maxWidth={540}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* Student */}
        <label style={labelStyle}>Student *</label>
        <select
          value={watchedStudent}
          onChange={(e) => onStudentChange(e.target.value)}
          style={{ ...inputStyle, cursor: "pointer" }}
          onFocus={(e) => { e.target.style.borderColor = "rgba(59,130,246,0.45)"; e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.08)"; }}
          onBlur={(e)  => { e.target.style.borderColor = "rgba(0,0,0,0.08)";      e.target.style.boxShadow = "none"; }}
        >
          <option value="">Select student…</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>{s.profile.full_name}</option>
          ))}
        </select>
        {errors.student_id && <p style={errorStyle}>{errors.student_id.message}</p>}

        {/* Company + Role side by side */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={labelStyle}>Company *</label>
            <input placeholder="Google" {...register("company_name")} style={inputStyle}
              onFocus={(e) => { e.target.style.borderColor = "rgba(59,130,246,0.45)"; e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.08)"; }}
              onBlur={(e)  => { e.target.style.borderColor = "rgba(0,0,0,0.08)";      e.target.style.boxShadow = "none"; }}
            />
            {errors.company_name && <p style={errorStyle}>{errors.company_name.message}</p>}
          </div>
          <div>
            <label style={labelStyle}>Role *</label>
            <input placeholder="SWE Intern" {...register("job_role")} style={inputStyle}
              onFocus={(e) => { e.target.style.borderColor = "rgba(59,130,246,0.45)"; e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.08)"; }}
              onBlur={(e)  => { e.target.style.borderColor = "rgba(0,0,0,0.08)";      e.target.style.boxShadow = "none"; }}
            />
            {errors.job_role && <p style={errorStyle}>{errors.job_role.message}</p>}
          </div>
        </div>

        {/* Job Link */}
        <label style={labelStyle}>Job Link</label>
        <input type="url" placeholder="https://careers.google.com/…" {...register("job_link")} style={inputStyle}
          onFocus={(e) => { e.target.style.borderColor = "rgba(59,130,246,0.45)"; e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.08)"; }}
          onBlur={(e)  => { e.target.style.borderColor = "rgba(0,0,0,0.08)";      e.target.style.boxShadow = "none"; }}
        />
        {errors.job_link && <p style={errorStyle}>{errors.job_link.message}</p>}

        {/* Resume — dropdown if student has uploads, text input otherwise */}
        <label style={labelStyle}>
          Resume {loadingRes && <span style={{ color: "#94a3b8", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>loading…</span>}
        </label>
        {resumes.length > 0 ? (
          <select {...register("resume_used")} style={{ ...inputStyle, cursor: "pointer" }}
            onFocus={(e) => { e.target.style.borderColor = "rgba(59,130,246,0.45)"; e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.08)"; }}
            onBlur={(e)  => { e.target.style.borderColor = "rgba(0,0,0,0.08)";      e.target.style.boxShadow = "none"; }}
          >
            <option value="">Select uploaded resume…</option>
            {resumes.map((r) => <option key={r.id} value={r.file_name}>{r.file_name}</option>)}
            <option value="__manual__">Enter manually…</option>
          </select>
        ) : (
          <input placeholder="sarah_resume_v3.pdf" {...register("resume_used")} style={inputStyle}
            onFocus={(e) => { e.target.style.borderColor = "rgba(59,130,246,0.45)"; e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.08)"; }}
            onBlur={(e)  => { e.target.style.borderColor = "rgba(0,0,0,0.08)";      e.target.style.boxShadow = "none"; }}
          />
        )}

        {/* JD */}
        <label style={labelStyle}>Job Description</label>
        <textarea
          placeholder="Paste the job description here…"
          {...register("job_description")}
          rows={4}
          style={{ ...inputStyle, resize: "vertical", marginBottom: 16 }}
          onFocus={(e) => { e.target.style.borderColor = "rgba(59,130,246,0.45)"; e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.08)"; }}
          onBlur={(e)  => { e.target.style.borderColor = "rgba(0,0,0,0.08)";      e.target.style.boxShadow = "none"; }}
        />

        {/* Internal notes */}
        <label style={labelStyle}>Internal Notes (not visible to student)</label>
        <textarea
          placeholder="Any notes for your records…"
          {...register("notes")}
          rows={2}
          style={{ ...inputStyle, resize: "vertical", marginBottom: 20 }}
          onFocus={(e) => { e.target.style.borderColor = "rgba(59,130,246,0.45)"; e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.08)"; }}
          onBlur={(e)  => { e.target.style.borderColor = "rgba(0,0,0,0.08)";      e.target.style.boxShadow = "none"; }}
        />

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button type="button" onClick={onClose} style={{ padding: "10px 18px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.08)", background: "transparent", color: "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            style={{
              padding:     "10px 22px",
              borderRadius: 10,
              border:      "none",
              background:  "linear-gradient(135deg, #3b82f6, #10b981)",
              color:       "#fff",
              fontSize:    13,
              fontWeight:  700,
              cursor:      submitting ? "not-allowed" : "pointer",
              fontFamily:  "inherit",
              opacity:     submitting ? 0.7 : 1,
              display:     "flex",
              alignItems:  "center",
              gap:         8,
              boxShadow:   "0 4px 14px rgba(59,130,246,0.25)",
              transition:  "all 0.25s cubic-bezier(.4,0,.2,1)",
            }}
          >
            {submitting ? (
              <>
                <span style={{ width: 13, height: 13, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
                Adding…
              </>
            ) : (
              "Add Application"
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Main Counselor Dashboard ────────────────────────────────────────────────
export default function CounselorDashboardClient({
  counselorId,
  counselorName,
  initialStudents,
  initialApplications,
}: {
  counselorId:         string;
  counselorName:       string;
  initialStudents:     CounselorStudent[];
  initialApplications: CounselorApplication[];
}) {
  const [apps,      setApps]      = useState<CounselorApplication[]>(initialApplications);
  const [students]                = useState<CounselorStudent[]>(initialStudents);
  const [modalOpen, setModalOpen] = useState(false);
  const [search,    setSearch]    = useState("");
  const { addToast } = useUIStore();

  // ── Real-time ─────────────────────────────────────────────────────────
  const studentIds = students.map((s) => s.id);

  useRealtime<Record<string, unknown>>({
    table: "applications",
    event: "*",
    onEvent: ({ eventType, new: n, old: o }) => {
      const newRow = n as unknown as CounselorApplication;
      const oldRow = o as unknown as CounselorApplication;

      // Only care about students assigned to this counselor
      if (newRow.student_id && !studentIds.includes(newRow.student_id)) return;

      if (eventType === "INSERT") {
        // Prevent duplicates - check if already exists
        setApps((prev) => {
          if (prev.some((a) => a.id === newRow.id)) return prev;
          return [newRow, ...prev];
        });
      }
      if (eventType === "UPDATE") {
        setApps((prev) => prev.map((a) => (a.id === newRow.id ? newRow : a)));
      }
      if (eventType === "DELETE") {
        setApps((prev) => prev.filter((a) => a.id !== oldRow.id));
      }
    },
  });

  // ── Status change ─────────────────────────────────────────────────────
  const handleStatusChange = useCallback(async (id: string, status: ApplicationStatus) => {
    const { error } = await updateApplicationStatus(id, status);
    if (error) {
      addToast("Failed to update status.", "error");
      return;
    }
    setApps((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    addToast(`Status updated to ${status.replace("_", " ")}`, "success");
  }, [addToast]);

  // ── Stats ─────────────────────────────────────────────────────────────
  const counts = {
    students:    students.length,
    applied:     apps.filter((a) => a.status === "applied").length,
    in_progress: apps.filter((a) => a.status === "in_progress").length,
    interview:   apps.filter((a) => a.status === "interview").length,
    total:       apps.length,
  };

  // ── Search filter ─────────────────────────────────────────────────────
  const q = search.toLowerCase();
  const filtered = apps.filter(
    (a) =>
      !q ||
      a.company_name.toLowerCase().includes(q) ||
      a.job_role.toLowerCase().includes(q) ||
      students.find((s) => s.id === a.student_id)?.profile.full_name.toLowerCase().includes(q)
  );

  function getStudent(studentId: string) {
    return students.find((s) => s.id === studentId);
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  return (
    <div>
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}
      >
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1e293b", margin: "0 0 3px" }}>
            Counselor Dashboard
          </h2>
          <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>
            Managing {counts.students} student{counts.students !== 1 ? "s" : ""} · {counts.total} total applications
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          style={{
            padding:     "10px 20px",
            borderRadius: 12,
            border:      "none",
            background:  "linear-gradient(135deg, #3b82f6, #10b981)",
            color:       "#fff",
            fontSize:    13.5,
            fontWeight:  700,
            cursor:      "pointer",
            fontFamily:  "inherit",
            display:     "flex",
            alignItems:  "center",
            gap:         7,
            boxShadow:   "0 4px 14px rgba(59,130,246,0.28)",
            transition:  "all 0.25s cubic-bezier(.4,0,.2,1)",
            whiteSpace:  "nowrap",
          }}
          onMouseEnter={(e) => { (e.currentTarget).style.transform = "translateY(-2px)"; (e.currentTarget).style.boxShadow = "0 8px 24px rgba(59,130,246,0.35)"; }}
          onMouseLeave={(e) => { (e.currentTarget).style.transform = "translateY(0)";    (e.currentTarget).style.boxShadow = "0 4px 14px rgba(59,130,246,0.28)"; }}
        >
          <span style={{ fontSize: 16, lineHeight: 1 }}>+</span>
          Add Application
        </button>
      </motion.div>

      {/* ── Stat cards ── */}
      <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginBottom: 24 }}>
        <StatCard icon="👥" value={counts.students}    label="My Students"  delay={0}   />
        <StatCard icon="📨" value={counts.applied}     label="Applied"      delay={60}  />
        <StatCard icon="⚙️" value={counts.in_progress} label="In Progress"  delay={120} />
        <StatCard icon="🎯" value={counts.interview}    label="Interview"    delay={180} />
        <StatCard icon="📊" value={counts.total}        label="Total"        delay={240} />
      </div>

      {/* ── Search ── */}
      <div style={{ marginBottom: 14 }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by student, company, or role…"
          style={{
            width:        "100%",
            maxWidth:     380,
            padding:      "9px 14px",
            border:       "1.5px solid rgba(0,0,0,0.07)",
            borderRadius: 10,
            background:   "rgba(255,255,255,0.6)",
            fontFamily:   "inherit",
            fontSize:     13.5,
            color:        "#1e293b",
            outline:      "none",
            transition:   "all 0.22s cubic-bezier(.4,0,.2,1)",
          }}
          onFocus={(e) => { e.target.style.borderColor = "rgba(59,130,246,0.4)"; e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.07)"; }}
          onBlur={(e)  => { e.target.style.borderColor = "rgba(0,0,0,0.07)";     e.target.style.boxShadow = "none"; }}
        />
      </div>

      {/* ── Application Table ── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1], delay: 0.15 }}
        style={{
          background:           "rgba(255,255,255,0.5)",
          backdropFilter:       "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border:               "1px solid rgba(255,255,255,0.65)",
          borderRadius:         18,
          boxShadow:            "0 4px 24px rgba(0,0,0,0.03)",
          overflow:             "visible",
        }}
      >
        <div style={{ overflow: "visible", borderRadius: 18 }}>
          <table className="responsive-table counselor-table" style={{ width: "100%", borderCollapse: "collapse", minWidth: 500 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.05)", background: "rgba(248,250,255,0.6)" }}>
                {["Student", "Company / Role", "Resume", "Status", "Date"].map((h) => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 10.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.7, whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: "48px 20px", textAlign: "center", color: "#94a3b8", fontSize: 13.5 }}>
                    {search ? "No applications match your search." : "No applications yet. Click \"+ Add Application\" to get started."}
                  </td>
                </tr>
              ) : (
                filtered.map((app, i) => {
                  const student = getStudent(app.student_id);
                  const initials = student?.profile.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() ?? "??";

                  return (
                    <motion.tr
                      key={app.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1], delay: i * 0.035 }}
                      style={{ borderBottom: "1px solid rgba(0,0,0,0.035)", transition: "background 0.18s" }}
                      onMouseEnter={(e) => { (e.currentTarget).style.background = "rgba(59,130,246,0.03)"; }}
                      onMouseLeave={(e) => { (e.currentTarget).style.background = "transparent"; }}
                    >
                      {/* Student */}
                      <td style={{ padding: "12px 16px", verticalAlign: "middle" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                          <Avatar initials={initials} size={32} color="#3b82f6" src={student?.profile.avatar_url} />
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 650, color: "#1e293b" }}>
                              {student?.profile.full_name ?? "—"}
                            </div>
                            <div style={{ fontSize: 11, color: "#94a3b8" }}>
                              {student?.university ?? ""}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Company / Role */}
                      <td style={{ padding: "12px 16px", verticalAlign: "middle" }}>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: "#1e293b" }}>{app.company_name}</div>
                        <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{app.job_role}</div>
                      </td>

                      {/* Resume */}
                      <td style={{ padding: "12px 16px", verticalAlign: "middle" }}>
                        {app.resume_used ? (
                          <span style={{ fontSize: 12.5, color: "#475569", display: "flex", alignItems: "center", gap: 5 }}>
                            <span>📄</span>{app.resume_used}
                          </span>
                        ) : (
                          <span style={{ color: "#cbd5e1", fontSize: 12 }}>—</span>
                        )}
                      </td>

                      {/* Status (clickable dropdown) */}
                      <td style={{ padding: "12px 16px", verticalAlign: "middle" }}>
                        <StatusDropdown
                          appId={app.id}
                          current={app.status}
                          onUpdate={handleStatusChange}
                        />
                      </td>

                      {/* Date */}
                      <td style={{ padding: "12px 16px", verticalAlign: "middle", fontSize: 12, color: "#94a3b8", whiteSpace: "nowrap" }}>
                        {formatDate(app.applied_at)}
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* ── Add Application Modal ── */}
      <AddApplicationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        students={students}
        onAdded={(app) => setApps((prev) => [app, ...prev])}
      />
    </div>
  );
}
