"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Avatar from "@/components/Avatar";
import { useUIStore } from "@/lib/stores/uiStore";
import type { StudentMatch, StudentApplication } from "./page";

interface StudentHeader {
  full_name: string;
  email: string;
  avatar_url: string | null;
  university: string | null;
  major: string | null;
  visa_status: string | null;
}

interface CV {
  cv_markdown: string | null;
  target_roles: string[] | null;
  skills: string[] | null;
}

const GRADE_COLOR = (g: string) => {
  if (g?.startsWith("A")) return "#10b981";
  if (g?.startsWith("B")) return "#3b82f6";
  if (g?.startsWith("C")) return "#f59e0b";
  return "#64748b";
};

export default function StudentProfileClient({
  studentId,
  student,
  cv,
  matches: initialMatches,
  applications,
}: {
  studentId: string;
  student: StudentHeader;
  cv: CV;
  matches: StudentMatch[];
  applications: StudentApplication[];
}) {
  const [matches] = useState<StudentMatch[]>(initialMatches);
  const [running, setRunning] = useState<"run" | "deep" | null>(null);
  const [tab, setTab] = useState<"overview" | "cv" | "applications">("overview");
  const { addToast } = useUIStore();

  const initials = student.full_name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function handleMatchRun(deep: boolean) {
    setRunning(deep ? "deep" : "run");
    try {
      const res = await fetch("/api/agent/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: studentId, deep }),
      });
      const data = await res.json();
      if (!res.ok) {
        addToast(data.error || "Match run failed", "error");
        return;
      }
      if (data.run_id) {
        addToast(
          deep ? `Deep Match queued: ${data.matched} jobs` : `Match queued: ${data.matched} jobs`,
          "success"
        );
      } else {
        addToast(data.message || "No new leads to match", "info");
      }
    } finally {
      setRunning(null);
    }
  }

  const gradeA = matches.filter((m) => m.grade?.startsWith("A"));
  const gradeB = matches.filter((m) => m.grade?.startsWith("B"));
  const rest = matches.filter((m) => !m.grade?.startsWith("A") && !m.grade?.startsWith("B"));

  return (
    <div>
      {/* Back link */}
      <Link
        href="/counselor"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 12.5,
          color: "#64748b",
          textDecoration: "none",
          marginBottom: 14,
        }}
      >
        ← My Students
      </Link>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        style={{
          background: "rgba(255,255,255,0.6)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.7)",
          borderRadius: 18,
          padding: 18,
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <Avatar initials={initials} size={56} color="#3b82f6" src={student.avatar_url} />
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#1e293b" }}>{student.full_name}</div>
          <div style={{ fontSize: 12.5, color: "#64748b", marginTop: 2 }}>
            {student.email}
            {student.visa_status && (
              <span style={{ marginLeft: 10, padding: "2px 8px", borderRadius: 999, background: "rgba(59,130,246,0.08)", color: "#0A6EBD", fontSize: 11, fontWeight: 700 }}>
                {student.visa_status}
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
            {student.university || "—"}{student.major ? ` · ${student.major}` : ""}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 180 }}>
          <button
            onClick={() => handleMatchRun(false)}
            disabled={running !== null}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid rgba(139,92,246,0.35)",
              background: "rgba(139,92,246,0.08)",
              color: "#8b5cf6",
              fontSize: 12.5,
              fontWeight: 700,
              cursor: running ? "not-allowed" : "pointer",
              opacity: running ? 0.6 : 1,
            }}
          >
            {running === "run" ? "Running…" : "Run Match Agent"}
          </button>
          <button
            onClick={() => handleMatchRun(true)}
            disabled={running !== null}
            title="Uses full CV markdown — more accurate, uses more tokens"
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid rgba(16,185,129,0.35)",
              background: "rgba(16,185,129,0.08)",
              color: "#10b981",
              fontSize: 12.5,
              fontWeight: 700,
              cursor: running ? "not-allowed" : "pointer",
              opacity: running ? 0.6 : 1,
            }}
          >
            {running === "deep" ? "Running…" : "Deep Match Agent"}
          </button>
        </div>
      </motion.div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 14, borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
        {(["overview", "cv", "applications"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "10px 16px",
              background: "transparent",
              border: "none",
              borderBottom: tab === t ? "2px solid #0A6EBD" : "2px solid transparent",
              color: tab === t ? "#0A6EBD" : "#64748b",
              fontWeight: tab === t ? 700 : 500,
              fontSize: 13,
              cursor: "pointer",
              textTransform: "capitalize",
            }}
          >
            {t === "cv" ? "CV" : t} {t === "applications" && applications.length > 0 ? `(${applications.length})` : ""}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", margin: "0 0 10px" }}>
            Job Matches ({matches.length})
          </h3>

          {matches.length === 0 && (
            <div
              style={{
                padding: "40px 20px",
                textAlign: "center",
                color: "#94a3b8",
                background: "rgba(255,255,255,0.5)",
                border: "1px solid rgba(255,255,255,0.65)",
                borderRadius: 16,
              }}
            >
              No matches yet. Click <strong>Run Match Agent</strong> to find relevant jobs.
            </div>
          )}

          {gradeA.length > 0 && <MatchGroup label="Grade A" color="#10b981" items={gradeA} studentId={studentId} />}
          {gradeB.length > 0 && <MatchGroup label="Grade B" color="#3b82f6" items={gradeB} studentId={studentId} />}
          {rest.length > 0 && <MatchGroup label="Other" color="#64748b" items={rest} studentId={studentId} />}
        </div>
      )}

      {tab === "cv" && <CVPanel cv={cv} studentId={studentId} />}

      {tab === "applications" && <ApplicationsPanel apps={applications} />}
    </div>
  );
}

function MatchGroup({
  label,
  color,
  items,
  studentId,
}: {
  label: string;
  color: string;
  items: StudentMatch[];
  studentId: string;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color,
          textTransform: "uppercase",
          letterSpacing: 0.6,
          marginBottom: 8,
        }}
      >
        {label} ({items.length})
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((m) => (
          <MatchRow key={m.id} match={m} studentId={studentId} />
        ))}
      </div>
    </div>
  );
}

function MatchRow({ match, studentId }: { match: StudentMatch; studentId: string }) {
  const summary =
    (match.match_reasoning as any)?.summary ||
    (match.match_reasoning as any)?.recommendation ||
    "";
  const color = GRADE_COLOR(match.grade);

  return (
    <Link
      href={`/counselor/student/${studentId}/match/${match.id}`}
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <div
        style={{
          background: "rgba(255,255,255,0.6)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.7)",
          borderRadius: 14,
          padding: "12px 14px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          transition: "all 0.22s",
          cursor: "pointer",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 8px 22px rgba(59,130,246,0.1)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: 12,
            background: `${color}18`,
            color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            fontSize: 14,
            flexShrink: 0,
          }}
        >
          {match.grade}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13.5,
              fontWeight: 700,
              color: "#1e293b",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {match.job_leads.company_name} — {match.job_leads.job_role}
          </div>
          {match.job_leads.location && (
            <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 1 }}>{match.job_leads.location}</div>
          )}
          {summary && (
            <div
              style={{
                fontSize: 11.5,
                color: "#64748b",
                marginTop: 3,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {summary}
            </div>
          )}
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color }}>{Math.round(match.overall_score)}%</div>
          <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 }}>match</div>
        </div>
      </div>
    </Link>
  );
}

function CVPanel({ cv, studentId }: { cv: CV; studentId: string }) {
  const editLink = (
    <Link
      href={`/counselor/students/${studentId}/profile`}
      style={{
        fontSize: 11.5,
        color: "#0A6EBD",
        textDecoration: "none",
        padding: "4px 10px",
        borderRadius: 8,
        border: "1px solid rgba(10,110,189,0.25)",
        background: "rgba(10,110,189,0.06)",
        fontWeight: 600,
      }}
    >
      Edit CV →
    </Link>
  );
  if (!cv.cv_markdown) {
    return (
      <div
        style={{
          padding: "40px 20px",
          textAlign: "center",
          color: "#94a3b8",
          background: "rgba(255,255,255,0.5)",
          border: "1px solid rgba(255,255,255,0.65)",
          borderRadius: 16,
        }}
      >
        <div style={{ marginBottom: 14 }}>No CV on file. Student has not uploaded a CV yet.</div>
        {editLink}
      </div>
    );
  }
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>{editLink}</div>
      {(cv.target_roles?.length || cv.skills?.length) ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
          {(cv.target_roles || []).map((r) => (
            <span
              key={r}
              style={{
                padding: "3px 10px",
                borderRadius: 999,
                background: "rgba(16,185,129,0.1)",
                color: "#10b981",
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {r}
            </span>
          ))}
          {(cv.skills || []).map((s) => (
            <span
              key={s}
              style={{
                padding: "3px 10px",
                borderRadius: 999,
                background: "rgba(59,130,246,0.08)",
                color: "#0A6EBD",
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              {s}
            </span>
          ))}
        </div>
      ) : null}
      <div
        style={{
          background: "rgba(255,255,255,0.6)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.7)",
          borderRadius: 18,
          padding: 20,
          fontSize: 13,
          lineHeight: 1.65,
          color: "#1e293b",
          whiteSpace: "pre-wrap",
          fontFamily: "inherit",
          maxHeight: 700,
          overflow: "auto",
        }}
      >
        {cv.cv_markdown}
      </div>
    </div>
  );
}

function ApplicationsPanel({ apps }: { apps: StudentApplication[] }) {
  if (apps.length === 0) {
    return (
      <div
        style={{
          padding: "40px 20px",
          textAlign: "center",
          color: "#94a3b8",
          background: "rgba(255,255,255,0.5)",
          border: "1px solid rgba(255,255,255,0.65)",
          borderRadius: 16,
        }}
      >
        No applications yet.
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {apps.map((a) => (
        <div
          key={a.id}
          style={{
            padding: "12px 14px",
            borderRadius: 14,
            background: "rgba(255,255,255,0.6)",
            border: "1px solid rgba(255,255,255,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "#1e293b" }}>{a.company_name}</div>
            <div style={{ fontSize: 11.5, color: "#64748b" }}>{a.job_role}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                padding: "3px 10px",
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 700,
                background: "rgba(59,130,246,0.08)",
                color: "#0A6EBD",
                textTransform: "capitalize",
              }}
            >
              {a.status.replace("_", " ")}
            </span>
            <span style={{ fontSize: 11, color: "#94a3b8" }}>
              {new Date(a.applied_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
