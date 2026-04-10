"use client";

import { useState } from "react";
import ScoreBadge from "./ScoreBadge";

interface EvaluationCardProps {
  evaluation: {
    overall_score: number;
    grade: string;
    archetype: string;
    recommendation: string;
    blocks: {
      a_role_summary?: { tldr: string; domain: string; seniority: string; remote: string };
      b_cv_match?: { score: number; matches: Array<{ requirement: string; cv_evidence: string }>; gaps: Array<{ gap: string; severity: string; mitigation: string }> };
      c_level_strategy?: { detected_level: string; strategy: string };
      d_compensation?: { market_range: string; score: number; notes: string };
      e_customization?: Array<{ section: string; proposed: string; reason: string }>;
      f_interview_prep?: Array<{ requirement: string; star_story: { situation: string; action: string; result: string } }>;
    };
    keywords?: string[];
    summary?: string;
  };
  compact?: boolean;
  hideCompensation?: boolean;
}

const recommendationColors: Record<string, { bg: string; text: string }> = {
  strong_apply: { bg: "#dbeafe", text: "#1d4ed8" },
  apply: { bg: "#d1fae5", text: "#065f46" },
  consider: { bg: "#fef3c7", text: "#92400e" },
  skip: { bg: "#fee2e2", text: "#991b1b" },
};

const recommendationLabels: Record<string, string> = {
  strong_apply: "Strong Apply",
  apply: "Apply",
  consider: "Consider",
  skip: "Skip",
};

export default function EvaluationCard({ evaluation, compact = false, hideCompensation = false }: EvaluationCardProps) {
  const [expandedBlock, setExpandedBlock] = useState<string | null>(null);
  const rec = recommendationColors[evaluation.recommendation] || recommendationColors.consider;

  const toggleBlock = (block: string) => {
    setExpandedBlock(expandedBlock === block ? null : block);
  };

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.9)",
        backdropFilter: "blur(20px)",
        borderRadius: 16,
        border: "1px solid rgba(0,0,0,0.06)",
        padding: compact ? 16 : 20,
        marginTop: 12,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
        <ScoreBadge score={evaluation.overall_score} size={compact ? "sm" : "md"} />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: "#0A0F1E",
              }}
            >
              Grade {evaluation.grade}
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: "3px 10px",
                borderRadius: 20,
                background: rec.bg,
                color: rec.text,
              }}
            >
              {recommendationLabels[evaluation.recommendation] || evaluation.recommendation}
            </span>
          </div>
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
            Archetype: {evaluation.archetype}
          </div>
        </div>
      </div>

      {evaluation.summary && (
        <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.5, marginBottom: 12 }}>
          {evaluation.summary}
        </p>
      )}

      {!compact && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {/* Block A */}
          {evaluation.blocks.a_role_summary && (
            <BlockSection
              title="A) Role Summary"
              isExpanded={expandedBlock === "a"}
              onToggle={() => toggleBlock("a")}
            >
              <p>{evaluation.blocks.a_role_summary.tldr}</p>
              <div style={{ display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
                <Tag label="Domain" value={evaluation.blocks.a_role_summary.domain} />
                <Tag label="Seniority" value={evaluation.blocks.a_role_summary.seniority} />
                <Tag label="Remote" value={evaluation.blocks.a_role_summary.remote} />
              </div>
            </BlockSection>
          )}

          {/* Block B */}
          {evaluation.blocks.b_cv_match && (
            <BlockSection
              title={`B) CV Match (${evaluation.blocks.b_cv_match.score}/5)`}
              isExpanded={expandedBlock === "b"}
              onToggle={() => toggleBlock("b")}
            >
              <div style={{ fontSize: 12 }}>
                <strong style={{ color: "#065f46" }}>
                  Matches ({evaluation.blocks.b_cv_match.matches.length}):
                </strong>
                {evaluation.blocks.b_cv_match.matches.slice(0, 5).map((m, i) => (
                  <div key={i} style={{ margin: "4px 0", padding: "4px 8px", background: "#f0fdf4", borderRadius: 6 }}>
                    <strong>{m.requirement}</strong>: {m.cv_evidence}
                  </div>
                ))}
                {evaluation.blocks.b_cv_match.gaps.length > 0 && (
                  <>
                    <strong style={{ color: "#991b1b", marginTop: 8, display: "block" }}>
                      Gaps ({evaluation.blocks.b_cv_match.gaps.length}):
                    </strong>
                    {evaluation.blocks.b_cv_match.gaps.map((g, i) => (
                      <div key={i} style={{ margin: "4px 0", padding: "4px 8px", background: "#fef2f2", borderRadius: 6 }}>
                        <strong>{g.gap}</strong> ({g.severity}): {g.mitigation}
                      </div>
                    ))}
                  </>
                )}
              </div>
            </BlockSection>
          )}

          {/* Block D - Compensation (hidden for students) */}
          {!hideCompensation && evaluation.blocks.d_compensation && (
            <BlockSection
              title={`D) Compensation (${evaluation.blocks.d_compensation.score}/5)`}
              isExpanded={expandedBlock === "d"}
              onToggle={() => toggleBlock("d")}
            >
              <p>Market range: {evaluation.blocks.d_compensation.market_range}</p>
              <p>{evaluation.blocks.d_compensation.notes}</p>
            </BlockSection>
          )}

          {/* Keywords */}
          {evaluation.keywords && evaluation.keywords.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", marginBottom: 4 }}>
                ATS Keywords:
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {evaluation.keywords.map((kw, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: 10,
                      padding: "2px 8px",
                      borderRadius: 12,
                      background: "#f3f4f6",
                      color: "#374151",
                    }}
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function BlockSection({
  title,
  isExpanded,
  onToggle,
  children,
}: {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div style={{ borderRadius: 10, border: "1px solid #e5e7eb", overflow: "hidden" }}>
      <button
        onClick={onToggle}
        style={{
          width: "100%",
          padding: "8px 12px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: isExpanded ? "#f9fafb" : "transparent",
          border: "none",
          cursor: "pointer",
          fontSize: 13,
          fontWeight: 600,
          color: "#374151",
        }}
      >
        {title}
        <span style={{ transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)", transition: "0.2s" }}>
          ›
        </span>
      </button>
      {isExpanded && <div style={{ padding: "8px 12px", fontSize: 12, color: "#4b5563" }}>{children}</div>}
    </div>
  );
}

function Tag({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ fontSize: 11 }}>
      <span style={{ color: "#9ca3af" }}>{label}: </span>
      <span style={{ fontWeight: 500, color: "#374151" }}>{value}</span>
    </div>
  );
}
