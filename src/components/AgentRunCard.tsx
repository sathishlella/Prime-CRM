"use client";

import { motion } from "framer-motion";
import ProgressBar from "./ProgressBar";

interface AgentRunCardProps {
  runType: string;
  status: string;
  totalSteps: number;
  completedSteps: number;
  failedSteps: number;
  createdAt: string;
  delay?: number;
}

const statusLabel: Record<string, string> = {
  queued: "Queued",
  running: "Running",
  completed: "Completed",
  failed: "Failed",
  cancelled: "Cancelled",
};

const statusColor: Record<string, string> = {
  queued: "#94a3b8",
  running: "#3b82f6",
  completed: "#10b981",
  failed: "#ef4444",
  cancelled: "#64748b",
};

export default function AgentRunCard({
  runType,
  status,
  totalSteps,
  completedSteps,
  failedSteps,
  createdAt,
  delay = 0,
}: AgentRunCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1], delay }}
      style={{
        background: "rgba(255,255,255,0.55)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.65)",
        borderRadius: 16,
        padding: "14px 16px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: "#1e293b", textTransform: "capitalize" }}>
          {runType.replace("-", " ")} Run
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: statusColor[status] || "#64748b",
            background: `${statusColor[status] || "#64748b"}15`,
            padding: "3px 10px",
            borderRadius: 8,
          }}
        >
          {statusLabel[status] || status}
        </div>
      </div>
      <ProgressBar total={totalSteps} completed={completedSteps} failed={failedSteps} />
      <div style={{ fontSize: 10.5, color: "#94a3b8", marginTop: 8 }}>
        Started {new Date(createdAt).toLocaleString()}
      </div>
    </motion.div>
  );
}
