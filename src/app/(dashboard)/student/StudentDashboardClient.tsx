"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import { useRealtime } from "@/lib/hooks/useRealtime";
import { useUIStore } from "@/lib/stores/uiStore";
import type { ApplicationStatus } from "@/lib/supabase/database.types";
import type { Application } from "./page";

const FILTERS: { key: ApplicationStatus | "all"; label: string }[] = [
  { key: "all",         label: "All"         },
  { key: "applied",     label: "Applied"     },
  { key: "in_progress", label: "In Progress" },
  { key: "interview",   label: "Interview"   },
  { key: "rejected",    label: "Rejected"    },
  { key: "offered",     label: "Offered"     },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ─── Application Card ─────────────────────────────────────────────────────────
function AppCard({ app, index }: { app: Application; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0  }}
      transition={{ duration: 0.38, ease: [0.4, 0, 0.2, 1], delay: index * 0.055 }}
      onClick={() => setOpen((o) => !o)}
      style={{
        background:           "rgba(255,255,255,0.5)",
        backdropFilter:       "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border:               open
          ? "1.5px solid rgba(59,130,246,0.18)"
          : "1px solid rgba(255,255,255,0.65)",
        borderRadius:         18,
        boxShadow:            "0 4px 24px rgba(0,0,0,0.03)",
        overflow:             "hidden",
        cursor:               "pointer",
        transition:           "border 0.25s cubic-bezier(.4,0,.2,1)",
      }}
      whileHover={{ y: open ? 0 : -1 }}
    >
      {/* ── Main row ── */}
      <div style={{ padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
        {/* Company initial */}
        <div
          style={{
            width:          42,
            height:         42,
            borderRadius:   13,
            background:     "rgba(59,130,246,0.06)",
            border:         "1.5px solid rgba(59,130,246,0.1)",
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            fontSize:       17,
            fontWeight:     800,
            color:          "#3b82f6",
            flexShrink:     0,
            userSelect:     "none",
          }}
        >
          {app.company_name[0]}
        </div>

        {/* Company + role */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>
                {app.company_name}
              </div>
              <div style={{ fontSize: 12.5, color: "#64748b", marginTop: 1 }}>
                {app.job_role}
              </div>
            </div>
            <StatusBadge status={app.status} />
          </div>

          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 7, display: "flex", alignItems: "center", gap: 4 }}>
            Applied by{" "}
            <strong style={{ color: "#64748b" }}>
              {(app.applied_by_profile as { full_name: string } | null)?.full_name ?? "Counselor"}
            </strong>
            {" "}·{" "}
            {formatDate(app.applied_at)}
          </div>
        </div>

        {/* Expand chevron */}
        <div
          style={{
            fontSize:   14,
            color:      "#cbd5e1",
            transform:  open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.3s cubic-bezier(.4,0,.2,1)",
            flexShrink: 0,
          }}
        >
          ▾
        </div>
      </div>

      {/* ── Expanded details ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{   height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                padding:    "0 18px 18px",
                borderTop:  "1px solid rgba(0,0,0,0.04)",
                paddingTop: 16,
                display:    "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              {/* Job description */}
              {app.job_description && (
                <div>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6 }}>
                    Job Description
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: "#475569", lineHeight: 1.6 }}>
                    {app.job_description}
                  </p>
                </div>
              )}

              {/* Meta row */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
                {app.resume_used && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 14 }}>📄</span>
                    <span style={{ fontSize: 12.5, color: "#475569", fontWeight: 500 }}>
                      {app.resume_used}
                    </span>
                  </div>
                )}

                {app.job_link && (
                  <a
                    href={app.job_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display:        "flex",
                      alignItems:     "center",
                      gap:            5,
                      fontSize:       12.5,
                      color:          "#3b82f6",
                      textDecoration: "none",
                      fontWeight:     500,
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span style={{ fontSize: 14 }}>🔗</span>
                    View Job Posting ↗
                  </a>
                )}
              </div>

              <div style={{ fontSize: 11, color: "#94a3b8" }}>
                Last updated: {formatDate(app.updated_at)}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Student Dashboard Client ────────────────────────────────────────────────
export default function StudentDashboardClient({
  firstName,
  studentId,
  initialApplications,
}: {
  firstName:           string;
  studentId:           string | null;
  initialApplications: Application[];
}) {
  const [apps,   setApps]   = useState<Application[]>(initialApplications);
  const [filter, setFilter] = useState<ApplicationStatus | "all">("all");
  const { addToast } = useUIStore();

  // ── Real-time subscription ──────────────────────────────────────────────
  useRealtime<Record<string, unknown>>({
    table:  "applications",
    event:  "*",
    filter: studentId ? `student_id=eq.${studentId}` : undefined,
    onEvent: ({ eventType, new: newRow, old: oldRow }) => {
      if (eventType === "INSERT") {
        setApps((prev) => [newRow as unknown as Application, ...prev]);
        addToast(`New application: ${(newRow as Record<string,string>).company_name} — ${(newRow as Record<string,string>).job_role}`);
      }
      if (eventType === "UPDATE") {
        setApps((prev) =>
          prev.map((a) => (a.id === (newRow as { id: string }).id ? (newRow as unknown as Application) : a))
        );
        const updated = newRow as Record<string, string>;
        if ((oldRow as Record<string,string>).status !== updated.status) {
          addToast(`${updated.company_name} → ${updated.status.replace("_", " ")}`);
        }
      }
      if (eventType === "DELETE") {
        setApps((prev) => prev.filter((a) => a.id !== (oldRow as { id: string }).id));
      }
    },
  });

  // ── Derived counts ──────────────────────────────────────────────────────
  const counts = {
    total:       apps.length,
    applied:     apps.filter((a) => a.status === "applied").length,
    in_progress: apps.filter((a) => a.status === "in_progress").length,
    interview:   apps.filter((a) => a.status === "interview").length,
    offered:     apps.filter((a) => a.status === "offered").length,
  };

  const filtered = filter === "all" ? apps : apps.filter((a) => a.status === filter);

  return (
    <div>
      {/* ── Greeting ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0  }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      >
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1e293b", margin: "0 0 3px" }}>
          Hi {firstName} 👋
        </h2>
        <p style={{ fontSize: 13, color: "#94a3b8", margin: "0 0 24px" }}>
          Here&rsquo;s everything we&rsquo;re doing for you — full transparency.
        </p>
      </motion.div>

      {/* ── Stat cards ── */}
      <div
        className="stats-grid"
        style={{
          display:             "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap:                 10,
          marginBottom:        24,
        }}
      >
        <StatCard icon="📨" value={counts.applied}     label="Applied"     delay={0}   />
        <StatCard icon="⚙️" value={counts.in_progress} label="In Progress" delay={70}  />
        <StatCard icon="🎯" value={counts.interview}    label="Interview"   delay={140} />
        <StatCard icon="📊" value={counts.total}        label="Total"       delay={210} />
      </div>

      {/* ── Filter tabs ── */}
      <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                padding:     "6px 14px",
                borderRadius: 9,
                border:      "none",
                fontSize:    11.5,
                fontWeight:  650,
                cursor:      "pointer",
                transition:  "all 0.25s cubic-bezier(.4,0,.2,1)",
                fontFamily:  "inherit",
                background:  active
                  ? "linear-gradient(135deg, #3b82f6, #10b981)"
                  : "rgba(255,255,255,0.45)",
                color:       active ? "#fff" : "#64748b",
                boxShadow:   active ? "0 3px 12px rgba(59,130,246,0.22)" : "none",
              }}
            >
              {f.label}
              {f.key !== "all" && (
                <span style={{ marginLeft: 5, opacity: 0.7 }}>
                  {apps.filter((a) => a.status === f.key).length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Application cards ── */}
      {filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            background:           "rgba(255,255,255,0.5)",
            backdropFilter:       "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border:               "1px solid rgba(255,255,255,0.65)",
            borderRadius:         18,
            padding:              "48px 20px",
            textAlign:            "center",
            color:                "#94a3b8",
            fontSize:             14,
          }}
        >
          {filter === "all"
            ? "No applications yet. Your counselor will add them here."
            : `No ${filter.replace("_", " ")} applications.`}
        </motion.div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((app, i) => (
            <AppCard key={app.id} app={app} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
