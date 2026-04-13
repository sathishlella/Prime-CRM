"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Run = {
  id: string;
  run_type: string;
  status: string;
  total_steps: number;
  completed_steps: number;
  failed_steps: number;
  created_at: string;
};

type Step = {
  id: string;
  run_id: string;
  step_type: string;
  status: string;
  error?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
};

export default function AgentRunsViewer({
  runs,
  steps,
}: {
  runs: Run[];
  steps: Step[];
}) {
  const [openRunId, setOpenRunId] = useState<string | null>(null);

  const stepsByRun = new Map<string, Step[]>();
  for (const s of steps) {
    const arr = stepsByRun.get(s.run_id) || [];
    arr.push(s);
    stepsByRun.set(s.run_id, arr);
  }

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        style={{ marginBottom: 20 }}
      >
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1e293b", margin: "0 0 4px" }}>Agent Runs</h2>
        <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>Track apply-agent workflows and step-by-step progress</p>
      </motion.div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {runs.length === 0 && (
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
            No agent runs yet.
          </div>
        )}

        {runs.map((run) => {
          const isOpen = openRunId === run.id;
          const runSteps = stepsByRun.get(run.id) || [];
          const pct = run.total_steps > 0 ? Math.round((run.completed_steps / run.total_steps) * 100) : 0;
          return (
            <div
              key={run.id}
              style={{
                background: "rgba(255,255,255,0.6)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.65)",
                borderRadius: 16,
                overflow: "hidden",
                boxShadow: "0 4px 18px rgba(0,0,0,0.03)",
              }}
            >
              <button
                onClick={() => setOpenRunId(isOpen ? null : run.id)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: 14,
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: "#1e293b" }}>
                      {run.run_type.toUpperCase()} — {run.id.slice(0, 8)}
                    </div>
                    <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 2 }}>
                      {new Date(run.created_at).toLocaleString()} · {run.total_steps} steps
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <StatusBadge status={run.status} />
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: "#64748b", minWidth: 36 }}>{pct}%</div>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      style={{
                        transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 0.2s",
                        opacity: 0.6,
                      }}
                    >
                      <path d="M3 5L7 9L11 5" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ marginTop: 10, height: 6, borderRadius: 999, background: "rgba(0,0,0,0.06)", overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${pct}%`,
                      height: "100%",
                      borderRadius: 999,
                      background:
                        run.status === "failed"
                          ? "linear-gradient(90deg, #ef4444, #f87171)"
                          : run.status === "completed"
                          ? "linear-gradient(90deg, #10b981, #34d399)"
                          : "linear-gradient(90deg, #3b82f6, #60a5fa)",
                    }}
                  />
                </div>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                    style={{ overflow: "hidden" }}
                  >
                    <div style={{ padding: "0 14px 14px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {runSteps.length === 0 && (
                          <div style={{ fontSize: 12, color: "#94a3b8" }}>No steps loaded</div>
                        )}
                        {runSteps.map((s) => (
                          <div
                            key={s.id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "10px 12px",
                              borderRadius: 12,
                              background: "rgba(255,255,255,0.5)",
                            }}
                          >
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 600, color: "#1e293b" }}>{s.step_type}</div>
                              {s.error ? (
                                <div style={{ fontSize: 11, color: "#ef4444", marginTop: 2 }}>{s.error}</div>
                              ) : null}
                            </div>
                            <StepBadge status={s.status} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    pending: { bg: "#f59e0b15", color: "#f59e0b" },
    running: { bg: "#3b82f615", color: "#3b82f6" },
    completed: { bg: "#10b98115", color: "#10b981" },
    done: { bg: "#10b98115", color: "#10b981" },
    failed: { bg: "#ef444415", color: "#ef4444" },
  };
  const st = map[status] || { bg: "#94a3b815", color: "#64748b" };
  return (
    <span
      style={{
        fontSize: 10.5,
        fontWeight: 700,
        color: st.color,
        background: st.bg,
        padding: "3px 8px",
        borderRadius: 999,
      }}
    >
      {status}
    </span>
  );
}

function StepBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    pending: { bg: "#f59e0b15", color: "#f59e0b" },
    running: { bg: "#3b82f615", color: "#3b82f6" },
    completed: { bg: "#10b98115", color: "#10b981" },
    done: { bg: "#10b98115", color: "#10b981" },
    failed: { bg: "#ef444415", color: "#ef4444" },
  };
  const st = map[status] || { bg: "#94a3b815", color: "#64748b" };
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        color: st.color,
        background: st.bg,
        padding: "2px 8px",
        borderRadius: 999,
      }}
    >
      {status}
    </span>
  );
}
