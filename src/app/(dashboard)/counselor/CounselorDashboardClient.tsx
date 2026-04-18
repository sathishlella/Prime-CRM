"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Avatar from "@/components/Avatar";
import StatCard from "@/components/StatCard";
import type { CounselorStudentCard } from "./page";

export default function CounselorDashboardClient({
  counselorName,
  students,
}: {
  counselorName: string;
  students: CounselorStudentCard[];
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return students;
    return students.filter(
      (s) =>
        s.full_name.toLowerCase().includes(q) ||
        (s.university || "").toLowerCase().includes(q) ||
        (s.major || "").toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q)
    );
  }, [students, search]);

  const totals = useMemo(() => {
    return {
      students: students.length,
      applications: students.reduce((s, x) => s + x.applications, 0),
      interviews: students.reduce((s, x) => s + x.interviews, 0),
      matches: students.reduce((s, x) => s + x.matches_total, 0),
      gradeA: students.reduce((s, x) => s + x.grade_a, 0),
    };
  }, [students]);

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        style={{ marginBottom: 20 }}
      >
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1e293b", margin: "0 0 3px" }}>
          My Students
        </h2>
        <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>
          Welcome back, {counselorName} · {totals.students} active
        </p>
      </motion.div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 10, marginBottom: 20 }}>
        <StatCard icon="👥" value={totals.students} label="Students" delay={0} />
        <StatCard icon="🎯" value={totals.matches} label="Total Matches" delay={60} />
        <StatCard icon="⭐" value={totals.gradeA} label="Grade A Matches" delay={120} />
        <StatCard icon="📨" value={totals.applications} label="Applications" delay={180} />
        <StatCard icon="🎤" value={totals.interviews} label="Interviews" delay={240} />
      </div>

      <div style={{ marginBottom: 14 }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search students by name, university, major…"
          style={{
            width: "100%",
            maxWidth: 380,
            padding: "9px 14px",
            border: "1.5px solid rgba(0,0,0,0.07)",
            borderRadius: 10,
            background: "rgba(255,255,255,0.6)",
            fontFamily: "inherit",
            fontSize: 13.5,
            color: "#1e293b",
            outline: "none",
          }}
        />
      </div>

      {filtered.length === 0 ? (
        <div
          style={{
            padding: "60px 20px",
            textAlign: "center",
            color: "#94a3b8",
            background: "rgba(255,255,255,0.5)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.65)",
            borderRadius: 18,
          }}
        >
          {search ? "No students match your search." : "No active students assigned yet."}
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 14,
          }}
        >
          {filtered.map((s, i) => (
            <StudentCard key={s.id} student={s} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

function StudentCard({ student, index }: { student: CounselorStudentCard; index: number }) {
  const initials = student.full_name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const gradeColor = (g: string | null) => {
    if (!g) return "#94a3b8";
    if (g.startsWith("A")) return "#10b981";
    if (g.startsWith("B")) return "#3b82f6";
    if (g.startsWith("C")) return "#f59e0b";
    return "#64748b";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1], delay: Math.min(index * 0.04, 0.3) }}
    >
      <Link
        href={`/counselor/student/${student.id}`}
        style={{ textDecoration: "none", color: "inherit", display: "block" }}
      >
        <div
          style={{
            background: "rgba(255,255,255,0.6)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.7)",
            borderRadius: 18,
            padding: 18,
            boxShadow: "0 4px 24px rgba(0,0,0,0.04)",
            transition: "all 0.24s cubic-bezier(.4,0,.2,1)",
            cursor: "pointer",
            height: "100%",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-3px)";
            e.currentTarget.style.boxShadow = "0 12px 34px rgba(59,130,246,0.12)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.04)";
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <Avatar initials={initials} size={44} color="#3b82f6" src={student.avatar_url} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontSize: 14.5,
                  fontWeight: 700,
                  color: "#1e293b",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {student.full_name}
              </div>
              <div
                style={{
                  fontSize: 11.5,
                  color: "#94a3b8",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {student.university || "—"}
              </div>
            </div>
            {student.top_grade && (
              <div
                style={{
                  padding: "4px 10px",
                  borderRadius: 999,
                  background: `${gradeColor(student.top_grade)}22`,
                  color: gradeColor(student.top_grade),
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: 0.3,
                }}
                title={`Best match grade: ${student.top_grade}`}
              >
                {student.top_grade}
              </div>
            )}
          </div>

          {student.major && (
            <div
              style={{
                fontSize: 12,
                color: "#64748b",
                marginBottom: 12,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {student.major}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 10 }}>
            <Stat label="Matches" value={student.matches_total} accent="#0A6EBD" />
            <Stat label="Apps" value={student.applications} accent="#0A6EBD" />
            <Stat label="Interviews" value={student.interviews} accent="#10b981" />
          </div>

          {student.matches_total > 0 && (
            <div style={{ display: "flex", gap: 6, fontSize: 11, color: "#64748b", marginBottom: 4 }}>
              <span style={{ color: "#10b981", fontWeight: 700 }}>A: {student.grade_a}</span>
              <span style={{ color: "#3b82f6", fontWeight: 700 }}>B: {student.grade_b}</span>
              {student.top_score !== null && (
                <span style={{ marginLeft: "auto", color: "#94a3b8" }}>
                  Top {Math.round(student.top_score)}%
                </span>
              )}
            </div>
          )}

          <div
            style={{
              marginTop: 10,
              paddingTop: 10,
              borderTop: "1px solid rgba(0,0,0,0.04)",
              fontSize: 12,
              color: "#3b82f6",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            View profile
            <span>→</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 16, fontWeight: 800, color: accent }}>{value}</div>
      <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 }}>
        {label}
      </div>
    </div>
  );
}
