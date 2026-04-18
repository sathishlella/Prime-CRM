"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useUIStore } from "@/lib/stores/uiStore";

interface Keywords {
  matched_keywords?: string[];
  gap_keywords?: string[];
  suggested_emphasis?: string[];
}

interface MatchInfo {
  overall_score: number;
  grade: string;
  archetype: string | null;
  match_status: string;
  reasoning: Record<string, unknown> | null;
}

interface JobInfo {
  company_name: string;
  job_role: string;
  job_description: string | null;
  job_url: string | null;
  location: string | null;
}

const GRADE_COLOR = (g: string) => {
  if (g?.startsWith("A")) return "#10b981";
  if (g?.startsWith("B")) return "#3b82f6";
  if (g?.startsWith("C")) return "#f59e0b";
  return "#64748b";
};

export default function MatchDetailClient({
  studentId,
  matchId,
  studentName,
  match,
  job,
  cachedKeywords,
}: {
  studentId: string;
  matchId: string;
  studentName: string;
  match: MatchInfo;
  job: JobInfo;
  cachedKeywords: Keywords | null;
}) {
  const [kw, setKw] = useState<Keywords | null>(cachedKeywords);
  const [selected, setSelected] = useState<Set<string>>(
    new Set(cachedKeywords?.suggested_emphasis ?? [])
  );
  const [loadingKw, setLoadingKw] = useState(false);
  const [cvResult, setCvResult] = useState<{
    pdf_url: string | null;
    html?: string;
    keyword_coverage: number;
  } | null>(null);
  const [letterResult, setLetterResult] = useState<{ markdown: string } | null>(null);
  const [generatingCv, setGeneratingCv] = useState(false);
  const [generatingLetter, setGeneratingLetter] = useState(false);
  const [recording, setRecording] = useState(false);
  const [pastedJd, setPastedJd] = useState("");
  const { addToast } = useUIStore();

  const jdOverride = pastedJd.trim().length > 40 ? pastedJd.trim() : undefined;
  const effectiveJdPresent = Boolean(job.job_description || jdOverride);

  const color = GRADE_COLOR(match.grade);

  async function fetchKeywords() {
    setLoadingKw(true);
    try {
      const res = await fetch("/api/match/keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          match_id: matchId,
          job_description_override: jdOverride,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        addToast(data.message || data.error || "Failed to extract keywords", "error");
        return;
      }
      const next: Keywords = {
        matched_keywords: data.matched_keywords ?? [],
        gap_keywords: data.gap_keywords ?? [],
        suggested_emphasis: data.suggested_emphasis ?? [],
      };
      setKw(next);
      setSelected((prev) =>
        prev.size > 0 ? prev : new Set(next.suggested_emphasis ?? [])
      );
    } finally {
      setLoadingKw(false);
    }
  }

  function toggleKeyword(k: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  }

  async function generateCv() {
    setGeneratingCv(true);
    try {
      const res = await fetch("/api/match/tailor-cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: studentId,
          match_id: matchId,
          emphasis_keywords: Array.from(selected),
          job_description_override: jdOverride,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        addToast(data.message || data.error || "CV generation failed", "error");
        return;
      }
      setCvResult({
        pdf_url: data.pdf_url ?? null,
        html: data.html,
        keyword_coverage: data.keyword_coverage ?? 0,
      });
      addToast(
        data.pdf_url ? "Tailored CV generated" : "CV ready — HTML preview only (PDF unavailable)",
        "success"
      );
    } finally {
      setGeneratingCv(false);
    }
  }

  async function generateLetter() {
    setGeneratingLetter(true);
    try {
      const res = await fetch("/api/match/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: studentId,
          match_id: matchId,
          emphasis_keywords: Array.from(selected),
          job_description_override: jdOverride,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        addToast(data.message || data.error || "Cover letter failed", "error");
        return;
      }
      setLetterResult({ markdown: data.markdown });
      addToast("Cover letter generated", "success");
    } finally {
      setGeneratingLetter(false);
    }
  }

  async function recordAndGo() {
    if (!job.job_url) {
      addToast("No apply URL on this job — cannot redirect", "error");
      return;
    }
    setRecording(true);
    try {
      const res = await fetch("/api/match/record-application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: studentId, match_id: matchId }),
      });
      const data = await res.json();
      if (!res.ok) {
        addToast(data.message || data.error || "Failed to record application", "error");
        return;
      }
      addToast(
        data.already_existed ? "Already tracked — opening apply page" : "Application tracked",
        "success"
      );
      window.open(data.job_url, "_blank", "noopener,noreferrer");
    } finally {
      setRecording(false);
    }
  }

  const canProceed = cvResult !== null;

  function openHtmlPreview() {
    if (!cvResult?.html) return;
    const win = window.open("", "_blank", "noopener,noreferrer");
    if (win) {
      win.document.open();
      win.document.write(cvResult.html);
      win.document.close();
    }
  }

  return (
    <div>
      <Link
        href={`/counselor/student/${studentId}`}
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
        ← {studentName}'s profile
      </Link>

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
          gap: 14,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: `${color}18`,
            color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            fontSize: 18,
          }}
        >
          {match.grade}
        </div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#1e293b" }}>
            {job.company_name} — {job.job_role}
          </div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 3 }}>
            {job.location || "—"}
            {match.archetype && (
              <span style={{ marginLeft: 10, color: "#94a3b8" }}>· {match.archetype}</span>
            )}
          </div>
        </div>
        <div style={{ textAlign: "right", minWidth: 110 }}>
          <div style={{ fontSize: 28, fontWeight: 800, color }}>
            {Math.round(match.overall_score)}%
          </div>
          <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 }}>
            match
          </div>
        </div>
      </motion.div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(280px, 380px)",
          gap: 14,
        }}
      >
        {/* Left column */}
        <div>
          {/* Job description */}
          <Section title="Job Description">
            {job.job_description ? (
              <div
                style={{
                  fontSize: 12.5,
                  lineHeight: 1.65,
                  color: "#334155",
                  whiteSpace: "pre-wrap",
                  maxHeight: 260,
                  overflow: "auto",
                }}
              >
                {job.job_description}
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8, lineHeight: 1.55 }}>
                  No description on file — scanner only caught the title. Paste the full JD from the
                  company posting for sharper keywords and a better CV.
                </div>
                <textarea
                  value={pastedJd}
                  onChange={(e) => setPastedJd(e.target.value)}
                  placeholder="Paste the full job description here (40+ chars to enable generation)…"
                  rows={8}
                  style={{
                    width: "100%",
                    borderRadius: 10,
                    border: "1px solid rgba(0,0,0,0.1)",
                    background: "rgba(255,255,255,0.7)",
                    padding: 10,
                    fontSize: 12.5,
                    lineHeight: 1.55,
                    color: "#1e293b",
                    fontFamily: "inherit",
                    resize: "vertical",
                  }}
                />
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
                  {jdOverride
                    ? `✓ Using pasted JD (${pastedJd.trim().length} chars). Saved to this lead on first AI call.`
                    : `${pastedJd.trim().length}/40 chars minimum`}
                </div>
              </div>
            )}
            {job.job_url && (
              <a
                href={job.job_url}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-block",
                  marginTop: 10,
                  fontSize: 12,
                  color: "#0A6EBD",
                  textDecoration: "none",
                }}
              >
                Open posting ↗
              </a>
            )}
          </Section>

          {/* Keywords */}
          <Section
            title="Matched Keywords"
            right={
              kw && (
                <span style={{ fontSize: 11, color: "#94a3b8" }}>
                  {selected.size} selected
                </span>
              )
            }
          >
            {!kw && (
              <div style={{ textAlign: "center", padding: "12px 0" }}>
                <button
                  onClick={fetchKeywords}
                  disabled={loadingKw || !effectiveJdPresent}
                  style={{
                    padding: "10px 16px",
                    borderRadius: 10,
                    border: "1px solid rgba(10,110,189,0.3)",
                    background: "rgba(10,110,189,0.08)",
                    color: "#0A6EBD",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: loadingKw ? "wait" : !effectiveJdPresent ? "not-allowed" : "pointer",
                    opacity: !effectiveJdPresent ? 0.55 : 1,
                  }}
                  title={!effectiveJdPresent ? "Paste a job description first" : undefined}
                >
                  {loadingKw ? "Analyzing CV vs JD…" : "Extract matched keywords"}
                </button>
                <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 8 }}>
                  {effectiveJdPresent
                    ? "Choose which keywords to emphasize in the tailored CV + cover letter."
                    : "Paste the job description above to unlock keyword extraction."}
                </div>
              </div>
            )}
            {kw && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <KeywordSection
                  label="In CV (pick to emphasize)"
                  color="#10b981"
                  items={kw.matched_keywords ?? []}
                  selected={selected}
                  onToggle={toggleKeyword}
                />
                <KeywordSection
                  label="Gaps (add only if truthful)"
                  color="#f59e0b"
                  items={kw.gap_keywords ?? []}
                  selected={selected}
                  onToggle={toggleKeyword}
                />
                <button
                  onClick={fetchKeywords}
                  disabled={loadingKw}
                  style={{
                    alignSelf: "flex-start",
                    padding: "6px 12px",
                    borderRadius: 8,
                    border: "1px solid rgba(0,0,0,0.08)",
                    background: "transparent",
                    color: "#64748b",
                    fontSize: 11.5,
                    cursor: "pointer",
                  }}
                >
                  {loadingKw ? "Refreshing…" : "Re-analyze"}
                </button>
              </div>
            )}
          </Section>

          {/* Generate actions */}
          <Section title="Generate">
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                onClick={generateCv}
                disabled={!kw || generatingCv}
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1px solid rgba(10,110,189,0.35)",
                  background: "rgba(10,110,189,0.08)",
                  color: "#0A6EBD",
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: !kw || generatingCv ? "not-allowed" : "pointer",
                  opacity: !kw || generatingCv ? 0.6 : 1,
                }}
              >
                {generatingCv ? "Tailoring CV…" : cvResult ? "Regenerate CV" : "Generate Full CV"}
              </button>
              <button
                onClick={generateLetter}
                disabled={!kw || generatingLetter}
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1px solid rgba(139,92,246,0.35)",
                  background: "rgba(139,92,246,0.08)",
                  color: "#8b5cf6",
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: !kw || generatingLetter ? "not-allowed" : "pointer",
                  opacity: !kw || generatingLetter ? 0.6 : 1,
                }}
              >
                {generatingLetter
                  ? "Writing letter…"
                  : letterResult
                  ? "Regenerate Letter"
                  : "Generate Cover Letter"}
              </button>
            </div>

            {cvResult && (
              <div
                style={{
                  marginTop: 12,
                  padding: 12,
                  borderRadius: 10,
                  background: "rgba(16,185,129,0.08)",
                  border: "1px solid rgba(16,185,129,0.25)",
                  fontSize: 12.5,
                  color: "#047857",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <span style={{ fontWeight: 700 }}>
                  CV ready · {cvResult.keyword_coverage}% keyword coverage
                </span>
                {cvResult.pdf_url ? (
                  <a
                    href={cvResult.pdf_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: "#047857", fontWeight: 700, textDecoration: "underline" }}
                  >
                    Open PDF ↗
                  </a>
                ) : cvResult.html ? (
                  <button
                    type="button"
                    onClick={openHtmlPreview}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 8,
                      border: "1px solid rgba(16,185,129,0.4)",
                      background: "rgba(16,185,129,0.15)",
                      color: "#047857",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Preview HTML ↗
                  </button>
                ) : (
                  <span style={{ fontSize: 11.5, color: "#b45309" }}>
                    PDF unavailable — try regenerating
                  </span>
                )}
              </div>
            )}
            {letterResult && (
              <div
                style={{
                  marginTop: 10,
                  padding: 12,
                  borderRadius: 10,
                  background: "rgba(139,92,246,0.06)",
                  border: "1px solid rgba(139,92,246,0.2)",
                  fontSize: 12.5,
                  whiteSpace: "pre-wrap",
                  color: "#1e293b",
                  lineHeight: 1.6,
                  maxHeight: 260,
                  overflow: "auto",
                }}
              >
                {letterResult.markdown}
              </div>
            )}
          </Section>

          {/* Next */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 10,
              marginTop: 14,
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={recordAndGo}
              disabled={!canProceed || recording}
              style={{
                padding: "12px 20px",
                borderRadius: 12,
                border: "none",
                background: canProceed ? "#0A6EBD" : "rgba(0,0,0,0.08)",
                color: canProceed ? "#fff" : "#94a3b8",
                fontSize: 13.5,
                fontWeight: 700,
                cursor: !canProceed || recording ? "not-allowed" : "pointer",
                letterSpacing: 0.2,
                transition: "all 0.22s",
              }}
              title={!canProceed ? "Generate the tailored CV first" : "Record + open apply page"}
            >
              {recording ? "Recording…" : canProceed ? "Next: Apply →" : "Next: Apply →"}
            </button>
          </div>
        </div>

        {/* Right column — match reasoning */}
        <aside>
          <Section title="Match Reasoning">
            <MatchReasoning reasoning={match.reasoning} />
          </Section>
        </aside>
      </div>
    </div>
  );
}

function Section({
  title,
  right,
  children,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.6)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.7)",
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <h3 style={{ fontSize: 13.5, fontWeight: 700, color: "#1e293b", margin: 0 }}>{title}</h3>
        {right}
      </div>
      {children}
    </div>
  );
}

function KeywordSection({
  label,
  color,
  items,
  selected,
  onToggle,
}: {
  label: string;
  color: string;
  items: string[];
  selected: Set<string>;
  onToggle: (k: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <div
        style={{
          fontSize: 10.5,
          fontWeight: 700,
          color,
          textTransform: "uppercase",
          letterSpacing: 0.6,
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {items.map((k) => {
          const on = selected.has(k);
          return (
            <button
              key={k}
              onClick={() => onToggle(k)}
              style={{
                padding: "5px 12px",
                borderRadius: 999,
                border: `1px solid ${on ? color : "rgba(0,0,0,0.1)"}`,
                background: on ? `${color}18` : "rgba(255,255,255,0.5)",
                color: on ? color : "#64748b",
                fontSize: 11.5,
                fontWeight: on ? 700 : 500,
                cursor: "pointer",
                transition: "all 0.18s",
              }}
            >
              {on ? "✓ " : ""}
              {k}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MatchReasoning({ reasoning }: { reasoning: Record<string, unknown> | null }) {
  if (!reasoning) {
    return (
      <div style={{ fontSize: 12, color: "#94a3b8" }}>
        No reasoning on file. Run a deep match for structured analysis.
      </div>
    );
  }
  const r = reasoning as Record<string, unknown>;
  const reasons = (r.reasons as string[] | undefined) ?? [];
  const summary = (r.summary as string | undefined) ?? (r.recommendation as string | undefined);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {summary && (
        <div style={{ fontSize: 12.5, color: "#334155", lineHeight: 1.55 }}>{summary}</div>
      )}
      {reasons.length > 0 && (
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "#64748b", lineHeight: 1.6 }}>
          {reasons.map((reason, i) => (
            <li key={i}>{reason}</li>
          ))}
        </ul>
      )}
      {reasons.length === 0 && !summary && (
        <div style={{ fontSize: 12, color: "#94a3b8" }}>No structured reasoning recorded.</div>
      )}
    </div>
  );
}
