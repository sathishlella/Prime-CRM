"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import StatCard from "@/components/StatCard";
import type { FunnelRow, ScoreRow, ArchetypeRow, CounselorRow } from "./page";

const STATUS_COLOR: Record<string, string> = {
  applied: "#3b82f6",
  in_progress: "#f59e0b",
  interview: "#10b981",
  rejected: "#ef4444",
  offered: "#8b5cf6",
};

const SCORE_COLOR: Record<string, string> = {
  "4.5-5.0": "#3b82f6",
  "4.0-4.5": "#10b981",
  "3.5-4.0": "#f59e0b",
  "3.0-3.5": "#f97316",
  "<3.0": "#ef4444",
};

export default function AdminAnalyticsClient({
  funnel,
  scores,
  archetypes,
  counselors,
  cvCount,
  leadCount,
}: {
  funnel: FunnelRow[];
  scores: ScoreRow[];
  archetypes: ArchetypeRow[];
  counselors: CounselorRow[];
  cvCount: number;
  leadCount: number;
}) {
  const [insights, setInsights] = useState<string[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(false);

  const totalApps = funnel.reduce((sum, f) => sum + f.count, 0);
  const interviewCount = funnel.find((f) => f.status === "interview")?.count ?? 0;
  const offeredCount = funnel.find((f) => f.status === "offered")?.count ?? 0;
  const conversionRate = totalApps > 0 ? ((interviewCount / totalApps) * 100).toFixed(1) : "0";

  useEffect(() => {
    setLoadingInsights(true);
    fetch("/api/analytics?include_insights=true")
      .then((r) => r.json())
      .then((data) => {
        if (data.insights) setInsights(data.insights);
      })
      .catch(() => {})
      .finally(() => setLoadingInsights(false));
  }, []);

  const maxFunnel = Math.max(...funnel.map((f) => f.count), 1);
  const maxScore = Math.max(...scores.map((s) => s.count), 1);

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 24 }}
      >
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1e293b", margin: "0 0 3px" }}>
          AI Analytics
        </h2>
        <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>
          Pipeline performance · Score distribution · AI insights
        </p>
      </motion.div>

      {/* Top stats */}
      <div
        className="stats-grid"
        style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 24 }}
      >
        <StatCard icon="📊" value={totalApps} label="Total Applications" delay={0} />
        <StatCard icon="🎯" value={interviewCount} label="Interviews" delay={60} />
        <StatCard icon="✨" value={offeredCount} label="Offers" delay={120} />
        <StatCard icon="📈" value={`${conversionRate}%`} label="Interview Rate" delay={180} />
      </div>

      {/* Second row stats */}
      <div
        className="stats-grid"
        style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginBottom: 24 }}
      >
        <StatCard icon="📄" value={cvCount} label="CVs Generated" delay={0} />
        <StatCard icon="🔍" value={leadCount} label="Total Leads Discovered" delay={60} />
      </div>

      {/* AI Insights */}
      <Card title="✨ AI Insights" style={{ marginBottom: 20 }}>
        {loadingInsights ? (
          <div style={{ color: "#94a3b8", fontSize: 13 }}>Generating insights…</div>
        ) : insights.length === 0 ? (
          <div style={{ color: "#94a3b8", fontSize: 13 }}>
            Not enough data for AI insights yet. Keep adding applications.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {insights.map((insight, i) => (
              <div
                key={i}
                style={{
                  padding: 12,
                  background: "linear-gradient(135deg, rgba(59,130,246,0.05), rgba(139,92,246,0.05))",
                  borderLeft: "3px solid #8b5cf6",
                  borderRadius: 8,
                  fontSize: 13,
                  color: "#374151",
                  lineHeight: 1.5,
                }}
              >
                {insight}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Funnel */}
      <Card title="Application Pipeline">
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {funnel.map((row) => (
            <div key={row.status} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ minWidth: 100, fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "capitalize" }}>
                {row.status.replace("_", " ")}
              </div>
              <div
                style={{
                  flex: 1,
                  height: 24,
                  background: "#f3f4f6",
                  borderRadius: 6,
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    width: `${(row.count / maxFunnel) * 100}%`,
                    height: "100%",
                    background: STATUS_COLOR[row.status] ?? "#64748b",
                    transition: "width 0.4s",
                  }}
                />
              </div>
              <div style={{ minWidth: 40, fontSize: 13, fontWeight: 700, color: "#1e293b", textAlign: "right" }}>
                {row.count}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Score distribution */}
      <Card title="Evaluation Score Distribution" style={{ marginTop: 20 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end", height: 160 }}>
          {scores.length === 0 ? (
            <div style={{ color: "#94a3b8", fontSize: 13 }}>No evaluations yet.</div>
          ) : (
            scores.map((row) => (
              <div key={row.bucket} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#1e293b" }}>{row.count}</div>
                <div
                  style={{
                    width: "100%",
                    height: `${(row.count / maxScore) * 130}px`,
                    background: SCORE_COLOR[row.bucket] ?? "#cbd5e1",
                    borderRadius: "6px 6px 0 0",
                    transition: "height 0.4s",
                  }}
                />
                <div style={{ fontSize: 10.5, color: "#94a3b8", fontWeight: 600 }}>{row.bucket}</div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Archetype table */}
      <Card title="Archetype Performance" style={{ marginTop: 20 }}>
        {archetypes.length === 0 ? (
          <div style={{ color: "#94a3b8", fontSize: 13 }}>No archetype data yet.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                {["Archetype", "Total", "Applied", "Interviews", "Offers", "Conversion"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "10px 12px",
                      textAlign: "left",
                      fontSize: 10.5,
                      fontWeight: 700,
                      color: "#94a3b8",
                      textTransform: "uppercase",
                      letterSpacing: 0.6,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {archetypes.map((row) => {
                const conversion = row.total > 0 ? ((row.offers / row.total) * 100).toFixed(0) : "0";
                return (
                  <tr key={row.archetype} style={{ borderBottom: "1px solid rgba(0,0,0,0.03)" }}>
                    <td style={{ padding: "10px 12px", fontSize: 13, fontWeight: 600, color: "#1e293b" }}>
                      {row.archetype}
                    </td>
                    <td style={{ padding: "10px 12px", fontSize: 13, color: "#64748b" }}>{row.total}</td>
                    <td style={{ padding: "10px 12px", fontSize: 13, color: "#64748b" }}>{row.applied}</td>
                    <td style={{ padding: "10px 12px", fontSize: 13, color: "#10b981", fontWeight: 600 }}>
                      {row.interviews}
                    </td>
                    <td style={{ padding: "10px 12px", fontSize: 13, color: "#8b5cf6", fontWeight: 600 }}>
                      {row.offers}
                    </td>
                    <td style={{ padding: "10px 12px", fontSize: 13, color: "#3b82f6", fontWeight: 700 }}>
                      {conversion}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      {/* Counselor leaderboard */}
      <Card title="Counselor Performance" style={{ marginTop: 20 }}>
        {counselors.length === 0 ? (
          <div style={{ color: "#94a3b8", fontSize: 13 }}>No counselor data yet.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                {["Counselor", "Students", "Applications", "Avg Score"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "10px 12px",
                      textAlign: "left",
                      fontSize: 10.5,
                      fontWeight: 700,
                      color: "#94a3b8",
                      textTransform: "uppercase",
                      letterSpacing: 0.6,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {counselors.map((row) => (
                <tr key={row.counselor_id} style={{ borderBottom: "1px solid rgba(0,0,0,0.03)" }}>
                  <td style={{ padding: "10px 12px", fontSize: 13, fontWeight: 600, color: "#1e293b" }}>
                    {row.counselor_name}
                  </td>
                  <td style={{ padding: "10px 12px", fontSize: 13, color: "#64748b" }}>
                    {row.total_students}
                  </td>
                  <td style={{ padding: "10px 12px", fontSize: 13, color: "#64748b" }}>
                    {row.total_applications}
                  </td>
                  <td style={{ padding: "10px 12px", fontSize: 13, color: "#3b82f6", fontWeight: 700 }}>
                    {row.avg_score?.toFixed(2) ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

function Card({
  title,
  children,
  style,
}: {
  title: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.6)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.65)",
        borderRadius: 18,
        padding: 20,
        ...style,
      }}
    >
      <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", margin: "0 0 16px" }}>{title}</h3>
      {children}
    </div>
  );
}
