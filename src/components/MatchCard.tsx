"use client";

import { motion } from "framer-motion";

export default function MatchCard({
  companyName,
  jobRole,
  score,
  grade,
  reasoning,
  selected,
  onSelect,
  delay = 0,
}: {
  companyName: string;
  jobRole: string;
  score: number;
  grade: string;
  reasoning?: string;
  selected?: boolean;
  onSelect?: () => void;
  delay?: number;
}) {
  const gradeColor = grade.startsWith("A")
    ? "#10b981"
    : grade.startsWith("B")
    ? "#3b82f6"
    : grade.startsWith("C")
    ? "#f59e0b"
    : "#64748b";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1], delay }}
      style={{
        background: "rgba(255,255,255,0.62)",
        backdropFilter: "blur(20px)",
        border: `1px solid ${selected ? "rgba(59,130,246,0.45)" : "rgba(255,255,255,0.65)"}`,
        borderRadius: 16,
        padding: 14,
        boxShadow: selected ? "0 6px 24px rgba(59,130,246,0.12)" : "0 4px 18px rgba(0,0,0,0.03)",
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        cursor: onSelect ? "pointer" : "default",
        transition: "border 0.2s, box-shadow 0.2s",
      }}
      onClick={onSelect}
    >
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: 7,
          border: `2px solid ${selected ? "#3b82f6" : "rgba(0,0,0,0.12)"}`,
          background: selected ? "#3b82f6" : "transparent",
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
          marginTop: 2,
        }}
      >
        {selected && (
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <path d="M3 8L6.5 11.5L13 4.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>{companyName}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: gradeColor,
                background: `${gradeColor}15`,
                padding: "2px 8px",
                borderRadius: 999,
              }}
            >
              {grade}
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>{score}%</span>
          </div>
        </div>
        <div style={{ fontSize: 12.5, fontWeight: 500, color: "#475569", marginTop: 2 }}>{jobRole}</div>
        {reasoning ? (
          <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 6, lineHeight: 1.45 }}>{reasoning}</div>
        ) : null}
      </div>
    </motion.div>
  );
}
