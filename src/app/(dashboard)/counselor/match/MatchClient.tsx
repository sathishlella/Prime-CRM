"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import MatchCard from "@/components/MatchCard";
import { useUIStore } from "@/lib/stores/uiStore";
import { createClient } from "@/lib/supabase/client";

interface Student {
  id: string;
  profile_id: string;
  university: string | null;
  visa_status: string | null;
  profiles: { full_name: string; email: string; avatar_url: string | null };
}

interface JobMatch {
  id: string;
  job_lead_id: string;
  overall_score: number;
  grade: string;
  archetype: string | null;
  match_status: string;
  match_reasoning?: Record<string, unknown>;
  job_leads: { company_name: string; job_role: string; job_url: string | null };
}

export default function MatchClient({
  counselorId,
  role,
  initialStudents,
}: {
  counselorId: string;
  role: string;
  initialStudents: Student[];
}) {
  const [students] = useState<Student[]>(initialStudents);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(initialStudents[0]?.id || "");
  const [matches, setMatches] = useState<JobMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMatchIds, setSelectedMatchIds] = useState<Set<string>>(new Set());
  const [applying, setApplying] = useState(false);
  const { addToast } = useUIStore();

  const supabase = createClient();

  useEffect(() => {
    if (!selectedStudentId) return;
    setLoading(true);
    (async () => {
      const { data, error } = await supabase
        .from("job_matches")
        .select("id, job_lead_id, overall_score, grade, archetype, match_status, match_reasoning, job_leads(company_name, job_role, job_url)")
        .eq("student_id", selectedStudentId)
        .in("match_status", ["new", "reviewed"])
        .order("overall_score", { ascending: false });
      setLoading(false);
      if (error) {
        addToast("Failed to load matches", "error");
      } else {
        setMatches((data as any[]) || []);
        setSelectedMatchIds(new Set());
      }
    })();
  }, [selectedStudentId, supabase, addToast]);

  const gradeA = matches.filter((m) => m.grade.startsWith("A"));
  const gradeB = matches.filter((m) => m.grade.startsWith("B"));
  const rest = matches.filter((m) => !m.grade.startsWith("A") && !m.grade.startsWith("B"));

  function toggleMatch(id: string) {
    setSelectedMatchIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleAutoApply() {
    if (selectedMatchIds.size === 0) {
      addToast("Select at least one job to apply", "error");
      return;
    }
    if (selectedMatchIds.size > 50) {
      addToast("Max 50 jobs per batch", "error");
      return;
    }
    setApplying(true);
    const res = await fetch("/api/agent/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        student_id: selectedStudentId,
        job_match_ids: Array.from(selectedMatchIds),
      }),
    });
    setApplying(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      addToast(err.error || "Apply failed", "error");
      return;
    }
    addToast(`Auto-Apply queued for ${selectedMatchIds.size} jobs`, "success");
    setSelectedMatchIds(new Set());
  }

  async function handleMatchRun() {
    setLoading(true);
    const res = await fetch("/api/agent/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ student_id: selectedStudentId }),
    });
    setLoading(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      addToast(err.error || "Match run failed", "error");
      return;
    }
    const data = await res.json();
    if (data.run_id) {
      addToast(`Match run queued: ${data.matched} jobs`, "success");
    } else {
      addToast(data.message || "No new leads to match", "info");
    }
  }

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        style={{ marginBottom: 20 }}
      >
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1e293b", margin: "0 0 4px" }}>Job Matches</h2>
        <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>AI-ranked opportunities for your students</p>
      </motion.div>

      <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
        {/* Student picker */}
        <div style={{ width: 260, flexShrink: 0 }}>
          <div
            style={{
              background: "rgba(255,255,255,0.5)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.65)",
              borderRadius: 18,
              padding: 14,
              boxShadow: "0 4px 24px rgba(0,0,0,0.03)",
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10 }}>
              Select Student
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {students.map((s) => {
                const active = s.id === selectedStudentId;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedStudentId(s.id)}
                    style={{
                      textAlign: "left",
                      padding: "10px 12px",
                      borderRadius: 12,
                      border: "none",
                      background: active ? "rgba(59,130,246,0.08)" : "transparent",
                      color: active ? "#0A6EBD" : "#1e293b",
                      fontWeight: active ? 700 : 500,
                      fontSize: 13,
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    <div>{s.profiles.full_name}</div>
                    <div style={{ fontSize: 10.5, color: "#94a3b8", marginTop: 2 }}>{s.university || "No university"}</div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleMatchRun}
              disabled={loading || !selectedStudentId}
              style={{
                marginTop: 12,
                width: "100%",
                padding: "10px 0",
                borderRadius: 12,
                border: "1px solid rgba(139,92,246,0.35)",
                background: "rgba(139,92,246,0.06)",
                color: "#8b5cf6",
                fontSize: 12,
                fontWeight: 700,
                cursor: loading || !selectedStudentId ? "not-allowed" : "pointer",
                opacity: loading || !selectedStudentId ? 0.6 : 1,
              }}
            >
              {loading ? "Running…" : "✨ Run Match Agent"}
            </button>
          </div>
        </div>

        {/* Matches feed */}
        <div style={{ flex: 1, minWidth: 300 }}>
          {selectedStudent && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
                flexWrap: "wrap",
                gap: 10,
              }}
            >
              <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b" }}>
                {selectedStudent.profiles.full_name} — {matches.length} matches
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => setSelectedMatchIds(new Set())}
                  disabled={selectedMatchIds.size === 0}
                  style={{
                    padding: "7px 12px",
                    borderRadius: 10,
                    border: "1px solid rgba(0,0,0,0.08)",
                    background: "#fff",
                    color: "#64748b",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: selectedMatchIds.size === 0 ? "not-allowed" : "pointer",
                  }}
                >
                  Clear
                </button>
                <button
                  onClick={handleAutoApply}
                  disabled={applying || selectedMatchIds.size === 0}
                  style={{
                    padding: "7px 14px",
                    borderRadius: 10,
                    border: "none",
                    background: "linear-gradient(135deg, #3b82f6, #10b981)",
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: applying || selectedMatchIds.size === 0 ? "not-allowed" : "pointer",
                    opacity: applying || selectedMatchIds.size === 0 ? 0.7 : 1,
                  }}
                >
                  {applying ? "Queuing…" : `Auto-Apply (${selectedMatchIds.size})`}
                </button>
              </div>
            </div>
          )}

          {loading && matches.length === 0 && (
            <div style={{ color: "#94a3b8", fontSize: 13, padding: 20 }}>Loading matches…</div>
          )}

          {!loading && matches.length === 0 && (
            <div
              style={{
                background: "rgba(255,255,255,0.5)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.65)",
                borderRadius: 18,
                padding: "40px 20px",
                textAlign: "center",
                color: "#94a3b8",
              }}
            >
              No matches yet. Click “Run Match Agent” to find jobs for this student.
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {gradeA.length > 0 && (
              <>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#10b981", textTransform: "uppercase", letterSpacing: 0.6 }}>
                  Grade A ({gradeA.length})
                </div>
                {gradeA.map((m, i) => (
                  <MatchCard
                    key={m.id}
                    companyName={m.job_leads.company_name}
                    jobRole={m.job_leads.job_role}
                    score={m.overall_score}
                    grade={m.grade}
                    reasoning={(m.match_reasoning as any)?.summary || (m.match_reasoning as any)?.recommendation || ""}
                    selected={selectedMatchIds.has(m.id)}
                    onSelect={() => toggleMatch(m.id)}
                    delay={i * 0.03}
                  />
                ))}
              </>
            )}
            {gradeB.length > 0 && (
              <>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#3b82f6", textTransform: "uppercase", letterSpacing: 0.6, marginTop: 8 }}>
                  Grade B ({gradeB.length})
                </div>
                {gradeB.map((m, i) => (
                  <MatchCard
                    key={m.id}
                    companyName={m.job_leads.company_name}
                    jobRole={m.job_leads.job_role}
                    score={m.overall_score}
                    grade={m.grade}
                    reasoning={(m.match_reasoning as any)?.summary || (m.match_reasoning as any)?.recommendation || ""}
                    selected={selectedMatchIds.has(m.id)}
                    onSelect={() => toggleMatch(m.id)}
                    delay={i * 0.03}
                  />
                ))}
              </>
            )}
            {rest.length > 0 && (
              <>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.6, marginTop: 8 }}>
                  Other ({rest.length})
                </div>
                {rest.map((m, i) => (
                  <MatchCard
                    key={m.id}
                    companyName={m.job_leads.company_name}
                    jobRole={m.job_leads.job_role}
                    score={m.overall_score}
                    grade={m.grade}
                    reasoning={(m.match_reasoning as any)?.summary || (m.match_reasoning as any)?.recommendation || ""}
                    selected={selectedMatchIds.has(m.id)}
                    onSelect={() => toggleMatch(m.id)}
                    delay={i * 0.03}
                  />
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
