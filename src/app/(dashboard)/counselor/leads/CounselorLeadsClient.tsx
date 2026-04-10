"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import StatCard from "@/components/StatCard";
import { useUIStore } from "@/lib/stores/uiStore";
import { assignLead } from "@/lib/api/leads";
import type { JobLead } from "./page";

interface Student {
  id: string;
  profile: { id: string; full_name: string };
}

const SOURCE_COLORS: Record<string, { bg: string; text: string }> = {
  greenhouse: { bg: "#d1fae5", text: "#065f46" },
  ashby: { bg: "#dbeafe", text: "#1d4ed8" },
  lever: { bg: "#fef3c7", text: "#92400e" },
  workday: { bg: "#fee2e2", text: "#991b1b" },
  direct: { bg: "#f3e8ff", text: "#6b21a8" },
  other: { bg: "#f3f4f6", text: "#374151" },
};

export default function CounselorLeadsClient({
  counselorId: _counselorId,
  initialLeads,
  students,
}: {
  counselorId: string;
  initialLeads: JobLead[];
  students: Student[];
}) {
  const [leads, setLeads] = useState<JobLead[]>(initialLeads);
  const [statusFilter, setStatusFilter] = useState<string>("new");
  const [companyFilter, setCompanyFilter] = useState("");
  const [assigning, setAssigning] = useState<string | null>(null);
  const { addToast } = useUIStore();

  const filtered = leads.filter((l) => {
    if (statusFilter !== "all" && l.status !== statusFilter) return false;
    if (companyFilter && !l.company_name.toLowerCase().includes(companyFilter.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: leads.length,
    new: leads.filter((l) => l.status === "new").length,
    assigned: leads.filter((l) => l.status === "assigned").length,
    today: leads.filter((l) => {
      const today = new Date();
      const d = new Date(l.discovered_at);
      return d.toDateString() === today.toDateString();
    }).length,
  };

  async function handleAssign(leadId: string, studentId: string) {
    setAssigning(leadId);
    try {
      await assignLead(leadId, studentId);
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, status: "assigned", assigned_to: studentId } : l))
      );
      addToast("Lead assigned and application created", "success");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Assign failed", "error");
    } finally {
      setAssigning(null);
    }
  }

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ marginBottom: 24 }}
      >
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1e293b", margin: "0 0 3px" }}>
          Job Leads
        </h2>
        <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>
          AI-discovered jobs from portal scanning · Assign to your students
        </p>
      </motion.div>

      {/* Stats */}
      <div
        className="stats-grid"
        style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 20 }}
      >
        <StatCard icon="🎯" value={stats.total} label="Total Leads" delay={0} />
        <StatCard icon="✨" value={stats.new} label="New" delay={60} />
        <StatCard icon="📅" value={stats.today} label="Today" delay={120} />
        <StatCard icon="✅" value={stats.assigned} label="Assigned" delay={180} />
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {["all", "new", "reviewed", "assigned", "dismissed"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            style={{
              padding: "6px 14px",
              borderRadius: 9,
              border: "none",
              fontSize: 11.5,
              fontWeight: 650,
              cursor: "pointer",
              background: statusFilter === s ? "linear-gradient(135deg, #3b82f6, #10b981)" : "rgba(255,255,255,0.45)",
              color: statusFilter === s ? "#fff" : "#64748b",
              textTransform: "capitalize",
              fontFamily: "inherit",
            }}
          >
            {s}
          </button>
        ))}
        <input
          value={companyFilter}
          onChange={(e) => setCompanyFilter(e.target.value)}
          placeholder="Filter by company…"
          style={{
            padding: "6px 14px",
            borderRadius: 9,
            border: "1.5px solid rgba(0,0,0,0.07)",
            background: "rgba(255,255,255,0.6)",
            fontSize: 12,
            fontFamily: "inherit",
            outline: "none",
            flex: 1,
            maxWidth: 260,
          }}
        />
      </div>

      {/* Leads grid */}
      {filtered.length === 0 ? (
        <div
          style={{
            background: "rgba(255,255,255,0.5)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.65)",
            borderRadius: 18,
            padding: "48px 20px",
            textAlign: "center",
            color: "#94a3b8",
            fontSize: 14,
          }}
        >
          No leads match your filters. Run a scan from the Admin Scanner page.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 12 }}>
          {filtered.map((lead, i) => {
            const sourceColor = SOURCE_COLORS[lead.source] || SOURCE_COLORS.other;
            return (
              <motion.div
                key={lead.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                style={{
                  background: "rgba(255,255,255,0.7)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255,255,255,0.7)",
                  borderRadius: 16,
                  padding: 18,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b" }}>
                      {lead.company_name}
                    </div>
                    <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>{lead.job_role}</div>
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      padding: "3px 8px",
                      borderRadius: 12,
                      background: sourceColor.bg,
                      color: sourceColor.text,
                      textTransform: "capitalize",
                      flexShrink: 0,
                    }}
                  >
                    {lead.source}
                  </span>
                </div>

                {lead.location && (
                  <div style={{ fontSize: 11.5, color: "#94a3b8" }}>📍 {lead.location}</div>
                )}

                <div style={{ fontSize: 11, color: "#94a3b8" }}>
                  Discovered {new Date(lead.discovered_at).toLocaleDateString()}
                </div>

                <a
                  href={lead.job_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 12, color: "#3b82f6", textDecoration: "none" }}
                >
                  View Posting ↗
                </a>

                {lead.status === "new" && (
                  <select
                    disabled={assigning === lead.id}
                    onChange={(e) => e.target.value && handleAssign(lead.id, e.target.value)}
                    defaultValue=""
                    style={{
                      padding: "8px 12px",
                      borderRadius: 10,
                      border: "1px solid rgba(59,130,246,0.3)",
                      background: "rgba(59,130,246,0.06)",
                      color: "#3b82f6",
                      fontSize: 12,
                      fontWeight: 600,
                      fontFamily: "inherit",
                      cursor: "pointer",
                      marginTop: 4,
                    }}
                  >
                    <option value="">
                      {assigning === lead.id ? "Assigning…" : "Assign to student…"}
                    </option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.profile.full_name}
                      </option>
                    ))}
                  </select>
                )}

                {lead.status === "assigned" && (
                  <div
                    style={{
                      padding: "6px 12px",
                      borderRadius: 10,
                      background: "#d1fae5",
                      color: "#065f46",
                      fontSize: 11.5,
                      fontWeight: 600,
                      textAlign: "center",
                    }}
                  >
                    ✓ Assigned
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
