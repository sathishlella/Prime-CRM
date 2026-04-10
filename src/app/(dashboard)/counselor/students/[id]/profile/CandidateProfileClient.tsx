"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useUIStore } from "@/lib/stores/uiStore";
import type { CandidateProfile } from "./page";

export default function CandidateProfileClient({
  studentId,
  studentName,
  initialProfile,
}: {
  studentId: string;
  studentName: string;
  initialProfile: CandidateProfile | null;
}) {
  const [cvMarkdown, setCvMarkdown] = useState(initialProfile?.cv_markdown ?? "");
  const [targetRoles, setTargetRoles] = useState((initialProfile?.target_roles ?? []).join(", "));
  const [skills, setSkills] = useState((initialProfile?.skills ?? []).join(", "));
  const [dealBreakers, setDealBreakers] = useState((initialProfile?.deal_breakers ?? []).join(", "));
  const [narrative, setNarrative] = useState(initialProfile?.narrative ?? "");
  const [salaryMin, setSalaryMin] = useState(
    (initialProfile?.compensation_target as { min?: number })?.min?.toString() ?? ""
  );
  const [salaryMax, setSalaryMax] = useState(
    (initialProfile?.compensation_target as { max?: number })?.max?.toString() ?? ""
  );
  const [saving, setSaving] = useState(false);
  const [parsing, setParsing] = useState(false);
  const { addToast } = useUIStore();

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/candidate-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: studentId,
          cv_markdown: cvMarkdown,
          target_roles: targetRoles.split(",").map((s) => s.trim()).filter(Boolean),
          skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
          deal_breakers: dealBreakers.split(",").map((s) => s.trim()).filter(Boolean),
          narrative,
          compensation_target: {
            min: salaryMin ? parseInt(salaryMin, 10) : null,
            max: salaryMax ? parseInt(salaryMax, 10) : null,
            currency: "USD",
          },
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      addToast("Profile saved", "success");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Save failed", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleParseRawCV() {
    const raw = prompt("Paste the raw CV text (from PDF, Word, or LinkedIn):");
    if (!raw) return;
    setParsing(true);
    try {
      const res = await fetch("/api/candidate-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "parse", raw_text: raw }),
      });
      if (!res.ok) throw new Error("Parse failed");
      const { markdown } = await res.json();
      setCvMarkdown(markdown);
      addToast("CV parsed into markdown", "success");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Parse failed", "error");
    } finally {
      setParsing(false);
    }
  }

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 24 }}
      >
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1e293b", margin: "0 0 3px" }}>
          Candidate Profile
        </h2>
        <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>
          {studentName} · This powers all AI features (evaluations, CVs, interview prep)
        </p>
      </motion.div>

      <div
        style={{
          background: "rgba(255,255,255,0.6)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.65)",
          borderRadius: 18,
          padding: 24,
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        <Section label="CV (Markdown)">
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <button
              onClick={handleParseRawCV}
              disabled={parsing}
              style={buttonSecondary}
            >
              {parsing ? "Parsing…" : "✨ Parse from raw text"}
            </button>
          </div>
          <textarea
            value={cvMarkdown}
            onChange={(e) => setCvMarkdown(e.target.value)}
            rows={12}
            placeholder="# Name&#10;## Summary&#10;...&#10;## Experience&#10;..."
            style={{ ...inputStyle, fontFamily: "monospace", fontSize: 12 }}
          />
        </Section>

        <Section label="Target Roles (comma-separated)">
          <input
            value={targetRoles}
            onChange={(e) => setTargetRoles(e.target.value)}
            placeholder="Senior Software Engineer, Staff Backend, AI Platform Engineer"
            style={inputStyle}
          />
        </Section>

        <Section label="Skills (comma-separated)">
          <input
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            placeholder="Python, TypeScript, React, PostgreSQL, AWS"
            style={inputStyle}
          />
        </Section>

        <Section label="Compensation Target (USD)">
          <div style={{ display: "flex", gap: 10 }}>
            <input
              type="number"
              value={salaryMin}
              onChange={(e) => setSalaryMin(e.target.value)}
              placeholder="Min (e.g. 120000)"
              style={{ ...inputStyle, flex: 1 }}
            />
            <input
              type="number"
              value={salaryMax}
              onChange={(e) => setSalaryMax(e.target.value)}
              placeholder="Max (e.g. 180000)"
              style={{ ...inputStyle, flex: 1 }}
            />
          </div>
        </Section>

        <Section label="Deal-Breakers (comma-separated)">
          <input
            value={dealBreakers}
            onChange={(e) => setDealBreakers(e.target.value)}
            placeholder="No on-site, no Java, no Series A startups"
            style={inputStyle}
          />
        </Section>

        <Section label="Narrative (what makes them unique)">
          <textarea
            value={narrative}
            onChange={(e) => setNarrative(e.target.value)}
            rows={4}
            placeholder="Their superpower, career goals, unique angle..."
            style={inputStyle}
          />
        </Section>

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: "12px 24px",
            borderRadius: 12,
            border: "none",
            background: saving ? "#9ca3af" : "linear-gradient(135deg, #3b82f6, #10b981)",
            color: "#fff",
            fontSize: 14,
            fontWeight: 700,
            cursor: saving ? "not-allowed" : "pointer",
            fontFamily: "inherit",
            alignSelf: "flex-start",
          }}
        >
          {saving ? "Saving…" : "Save Profile"}
        </button>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: 10,
  border: "1.5px solid rgba(0,0,0,0.08)",
  background: "rgba(255,255,255,0.7)",
  fontSize: 13,
  color: "#1e293b",
  fontFamily: "inherit",
  outline: "none",
  resize: "vertical",
};

const buttonSecondary: React.CSSProperties = {
  padding: "6px 12px",
  borderRadius: 9,
  border: "1px solid rgba(139,92,246,0.3)",
  background: "rgba(139,92,246,0.06)",
  color: "#8b5cf6",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "inherit",
};

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  );
}
