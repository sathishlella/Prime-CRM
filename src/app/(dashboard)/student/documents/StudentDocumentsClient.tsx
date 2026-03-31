"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { getSignedDownloadUrl } from "@/lib/api/documents";
import { useUIStore } from "@/lib/stores/uiStore";
import type { StudentDoc } from "./page";

const TYPE_ICON: Record<string, string>  = { resume: "📄", cover_letter: "✉️", jd: "📋", other: "📎" };
const TYPE_LABEL: Record<string, string> = { resume: "Resume", cover_letter: "Cover Letter", jd: "Job Description", other: "Document" };
const TYPE_COLOR: Record<string, string> = { resume: "#3b82f6", cover_letter: "#10b981", jd: "#f59e0b", other: "#94a3b8" };

// Client-safe date formatter to avoid hydration mismatches
function fmt(iso: string) {
  const date = new Date(iso);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = months[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month} ${day}, ${year}`;
}

function DocCard({ doc, index }: { doc: StudentDoc; index: number }) {
  const { addToast }   = useUIStore();
  const [downloading, setDownloading] = useState(false);
  const color = TYPE_COLOR[doc.file_type] ?? "#94a3b8";

  async function handleDownload() {
    setDownloading(true);
    const { url, error } = await getSignedDownloadUrl(doc.file_url);
    setDownloading(false);

    if (error || !url) {
      addToast("Could not generate download link.", "error");
      return;
    }
    // Open in new tab
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0  }}
      transition={{ duration: 0.38, ease: [0.4, 0, 0.2, 1], delay: index * 0.055 }}
      style={{
        background:           "rgba(255,255,255,0.5)",
        backdropFilter:       "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border:               "1px solid rgba(255,255,255,0.65)",
        borderRadius:         16,
        boxShadow:            "0 4px 24px rgba(0,0,0,0.03)",
        padding:              "16px 18px",
        display:              "flex",
        alignItems:           "center",
        gap:                  14,
      }}
    >
      {/* Icon */}
      <div style={{ width: 44, height: 44, borderRadius: 13, background: `${color}10`, border: `1.5px solid ${color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
        {TYPE_ICON[doc.file_type] ?? "📎"}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 650, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {doc.file_name}
        </div>
        <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 3, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ color, fontWeight: 600 }}>{TYPE_LABEL[doc.file_type] ?? "Document"}</span>
          <span>·</span>
          <span>Uploaded by {(doc.uploaded_by_profile as { full_name: string } | null)?.full_name ?? "Counselor"}</span>
          <span>·</span>
          <span>{fmt(doc.created_at)}</span>
        </div>
      </div>

      {/* Download button */}
      <button
        onClick={handleDownload}
        disabled={downloading}
        style={{
          padding:     "7px 16px",
          borderRadius: 10,
          border:      `1px solid ${color}25`,
          background:  `${color}08`,
          color,
          fontSize:    12,
          fontWeight:  650,
          cursor:      downloading ? "not-allowed" : "pointer",
          fontFamily:  "inherit",
          display:     "flex",
          alignItems:  "center",
          gap:         6,
          transition:  "all 0.22s cubic-bezier(.4,0,.2,1)",
          whiteSpace:  "nowrap",
          flexShrink:  0,
          opacity:     downloading ? 0.7 : 1,
        }}
        onMouseEnter={(e) => { if (!downloading) { (e.currentTarget).style.background = `${color}14`; (e.currentTarget).style.transform = "translateY(-1px)"; } }}
        onMouseLeave={(e) => { (e.currentTarget).style.background = `${color}08`; (e.currentTarget).style.transform = "translateY(0)"; }}
      >
        {downloading ? (
          <><span style={{ width: 11, height: 11, borderRadius: "50%", border: `2px solid ${color}30`, borderTopColor: color, animation: "spin 0.8s linear infinite", display: "inline-block" }} /> Getting link…</>
        ) : (
          <><span style={{ fontSize: 13 }}>⬇</span> Download</>
        )}
      </button>
    </motion.div>
  );
}

export default function StudentDocumentsClient({
  studentId,
  initialDocs,
}: {
  studentId:   string | null;
  initialDocs: StudentDoc[];
}) {
  const [docs] = useState<StudentDoc[]>(initialDocs);
  const [filter, setFilter] = useState<string>("all");

  const types = ["all", "resume", "cover_letter", "jd", "other"];
  const filtered = filter === "all" ? docs : docs.filter((d) => d.file_type === filter);

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1e293b", margin: "0 0 3px" }}>My Documents</h2>
        <p style={{ fontSize: 13, color: "#94a3b8", margin: "0 0 22px" }}>
          Resumes, cover letters and JDs your counselor has uploaded for you. Download any time.
        </p>
      </motion.div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
        {types.map((t) => {
          const active = filter === t;
          const count  = t === "all" ? docs.length : docs.filter((d) => d.file_type === t).length;
          return (
            <button key={t} onClick={() => setFilter(t)}
              style={{ padding: "6px 14px", borderRadius: 9, border: "none", fontSize: 11.5, fontWeight: 650, cursor: "pointer", transition: "all 0.22s cubic-bezier(.4,0,.2,1)", fontFamily: "inherit", background: active ? "linear-gradient(135deg,#3b82f6,#10b981)" : "rgba(255,255,255,0.45)", color: active ? "#fff" : "#64748b", boxShadow: active ? "0 3px 12px rgba(59,130,246,0.2)" : "none" }}
            >
              {TYPE_LABEL[t] ?? "All"}{t !== "all" && count > 0 && <span style={{ marginLeft: 5, opacity: 0.75 }}>{count}</span>}
              {t === "all" && <span style={{ marginLeft: 5, opacity: 0.75 }}>{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Document list */}
      {filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ background: "rgba(255,255,255,0.5)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.65)", borderRadius: 18, padding: "52px 20px", textAlign: "center" }}
        >
          <div style={{ fontSize: 32, marginBottom: 10 }}>📭</div>
          <div style={{ fontSize: 14, color: "#94a3b8" }}>
            {filter === "all" ? "No documents uploaded yet." : `No ${TYPE_LABEL[filter]?.toLowerCase() ?? filter} files yet.`}
          </div>
        </motion.div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((doc, i) => (
            <DocCard key={doc.id} doc={doc} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
