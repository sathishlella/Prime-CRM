"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";

type Row = {
  feature: string;
  provider: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  latency_ms: number;
  created_at: string;
};

function formatDate(d: string) {
  const date = new Date(d);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function AiCostsClient({ rows }: { rows: Row[] }) {
  const [featureFilter, setFeatureFilter] = useState<string>("all");

  const features = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) set.add(r.feature);
    return Array.from(set).sort();
  }, [rows]);

  const filtered = useMemo(() => {
    return featureFilter === "all" ? rows : rows.filter((r) => r.feature === featureFilter);
  }, [rows, featureFilter]);

  const totals = useMemo(() => {
    let cost = 0;
    let prompts = 0;
    let completions = 0;
    let latency = 0;
    for (const r of filtered) {
      cost += r.cost_usd || 0;
      prompts += r.input_tokens || 0;
      completions += r.output_tokens || 0;
      latency += r.latency_ms || 0;
    }
    return {
      cost,
      prompts,
      completions,
      avgLatency: filtered.length ? Math.round(latency / filtered.length) : 0,
      calls: filtered.length,
    };
  }, [filtered]);

  const byDay = useMemo(() => {
    const map = new Map<string, { cost: number; calls: number }>();
    for (const r of filtered) {
      const key = formatDate(r.created_at);
      const cur = map.get(key) || { cost: 0, calls: 0 };
      cur.cost += r.cost_usd || 0;
      cur.calls += 1;
      map.set(key, cur);
    }
    return Array.from(map.entries()).map(([date, v]) => ({ date, ...v })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filtered]);

  const byFeature = useMemo(() => {
    const map = new Map<string, { cost: number; calls: number }>();
    for (const r of filtered) {
      const cur = map.get(r.feature) || { cost: 0, calls: 0 };
      cur.cost += r.cost_usd || 0;
      cur.calls += 1;
      map.set(r.feature, cur);
    }
    return Array.from(map.entries()).map(([feature, v]) => ({ feature, ...v })).sort((a, b) => b.cost - a.cost);
  }, [filtered]);

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        style={{ marginBottom: 20 }}
      >
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1e293b", margin: "0 0 4px" }}>AI Costs</h2>
        <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>Usage, latency, and spend by feature and day</p>
      </motion.div>

      <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
        {features.map((f) => (
          <button
            key={f}
            onClick={() => setFeatureFilter(f)}
            style={{
              padding: "6px 12px",
              borderRadius: 10,
              border: `1px solid ${featureFilter === f ? "rgba(59,130,246,0.45)" : "rgba(0,0,0,0.08)"}`,
              background: featureFilter === f ? "rgba(59,130,246,0.08)" : "#fff",
              color: featureFilter === f ? "#0A6EBD" : "#64748b",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {f}
          </button>
        ))}
        <button
          onClick={() => setFeatureFilter("all")}
          style={{
            padding: "6px 12px",
            borderRadius: 10,
            border: `1px solid ${featureFilter === "all" ? "rgba(59,130,246,0.45)" : "rgba(0,0,0,0.08)"}`,
            background: featureFilter === "all" ? "rgba(59,130,246,0.08)" : "#fff",
            color: featureFilter === "all" ? "#0A6EBD" : "#64748b",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          All
        </button>
      </div>

      {/* Totals */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
        <StatCard label="Total Cost" value={`$${totals.cost.toFixed(4)}`} color="#10b981" />
        <StatCard label="Calls" value={String(totals.calls)} color="#3b82f6" />
        <StatCard label="Input Tokens" value={totals.prompts.toLocaleString()} color="#8b5cf6" />
        <StatCard label="Output Tokens" value={totals.completions.toLocaleString()} color="#f59e0b" />
        <StatCard label="Avg Latency" value={`${totals.avgLatency}ms`} color="#64748b" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
        {/* By day */}
        <div
          style={{
            background: "rgba(255,255,255,0.6)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.65)",
            borderRadius: 18,
            padding: 16,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginBottom: 12 }}>Spend by day</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {byDay.length === 0 && <div style={{ fontSize: 12, color: "#94a3b8" }}>No data</div>}
            {byDay.map((d) => (
              <div key={d.date} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: "#475569" }}>{d.date}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#1e293b" }}>${d.cost.toFixed(4)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* By feature */}
        <div
          style={{
            background: "rgba(255,255,255,0.6)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.65)",
            borderRadius: 18,
            padding: 16,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginBottom: 12 }}>Spend by feature</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {byFeature.length === 0 && <div style={{ fontSize: 12, color: "#94a3b8" }}>No data</div>}
            {byFeature.map((f) => (
              <div key={f.feature} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: "#475569" }}>{f.feature}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#1e293b" }}>${f.cost.toFixed(4)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.6)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.65)",
        borderRadius: 14,
        padding: "14px 16px",
      }}
    >
      <div style={{ fontSize: 11.5, color: "#94a3b8", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color }}>{value}</div>
    </div>
  );
}
