"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Avatar from "@/components/Avatar";
import Modal from "@/components/Modal";
import FileUpload from "@/components/FileUpload";
import { useUIStore } from "@/lib/stores/uiStore";
import type { CounselorStudentEntry } from "./page";

function ini(name: string) {
  return name.split(" ").map((n) => n[0] ?? "").slice(0, 2).join("").toUpperCase();
}

function fmt(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export default function CounselorStudentsClient({
  counselorId,
  students,
}: {
  counselorId: string;
  students:    CounselorStudentEntry[];
}) {
  const { addToast } = useUIStore();
  const [uploadTarget, setUploadTarget] = useState<CounselorStudentEntry | null>(null);

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1e293b", margin: "0 0 3px" }}>My Students</h2>
        <p style={{ fontSize: 13, color: "#94a3b8", margin: "0 0 24px" }}>
          {students.length} student{students.length !== 1 ? "s" : ""} assigned to you.
        </p>
      </motion.div>

      {students.length === 0 ? (
        <div style={{ background: "rgba(255,255,255,0.5)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.65)", borderRadius: 18, padding: "48px 20px", textAlign: "center", color: "#94a3b8", fontSize: 14 }}>
          No students assigned yet.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px,1fr))", gap: 14 }}>
          {students.map((s, i) => (
            <motion.div key={s.id}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.42, ease: [0.4, 0, 0.2, 1], delay: i * 0.06 }}
              style={{ background: "rgba(255,255,255,0.5)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.65)", borderRadius: 18, padding: "20px", boxShadow: "0 4px 24px rgba(0,0,0,0.03)" }}
            >
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <Avatar initials={ini(s.profile.full_name)} size={42} color="#10b981" src={s.profile.avatar_url} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>{s.profile.full_name}</div>
                  <div style={{ fontSize: 11.5, color: "#94a3b8" }}>{s.profile.email}</div>
                </div>
              </div>

              {/* Info rows */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
                {([
                  ["🎓", s.university ?? "—"],
                  ["📚", s.major      ?? "—"],
                  ["🌍", s.visa_status ?? "—"],
                  ["📅", fmt(s.graduation_date)],
                ] as [string, string][]).map(([icon, val]) => (
                  <div key={icon} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "#475569" }}>
                    <span style={{ fontSize: 15, flexShrink: 0 }}>{icon}</span>
                    <span>{val}</span>
                  </div>
                ))}
              </div>

              {/* Upload button */}
              <button
                onClick={() => setUploadTarget(s)}
                style={{ width: "100%", padding: "9px", borderRadius: 10, border: "1.5px dashed rgba(59,130,246,0.3)", background: "rgba(59,130,246,0.04)", color: "#3b82f6", fontSize: 12.5, fontWeight: 650, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, transition: "all 0.22s cubic-bezier(.4,0,.2,1)" }}
                onMouseEnter={(e) => { (e.currentTarget).style.background = "rgba(59,130,246,0.08)"; (e.currentTarget).style.borderStyle = "solid"; }}
                onMouseLeave={(e) => { (e.currentTarget).style.background = "rgba(59,130,246,0.04)"; (e.currentTarget).style.borderStyle = "dashed"; }}
              >
                <span style={{ fontSize: 14 }}>📤</span> Upload Document
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <Modal
        isOpen={!!uploadTarget}
        onClose={() => setUploadTarget(null)}
        title={`Upload for ${uploadTarget?.profile.full_name ?? ""}`}
        maxWidth={480}
      >
        {uploadTarget && (
          <div>
            <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 16px" }}>
              Upload a resume, cover letter, or JD for this student. They will be notified and can download it.
            </p>

            {/* File type selector */}
            <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
              {(["resume","cover_letter","jd","other"] as const).map((t) => (
                <button key={t}
                  style={{ padding: "5px 12px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.08)", background: "rgba(255,255,255,0.5)", fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", color: "#64748b", transition: "all 0.2s" }}
                  onClick={(e) => {
                    document.querySelectorAll(".doc-type-btn").forEach((b) => {
                      (b as HTMLButtonElement).style.background = "rgba(255,255,255,0.5)";
                      (b as HTMLButtonElement).style.color = "#64748b";
                      (b as HTMLButtonElement).style.borderColor = "rgba(0,0,0,0.08)";
                    });
                    (e.currentTarget).style.background = "rgba(59,130,246,0.1)";
                    (e.currentTarget).style.color = "#3b82f6";
                    (e.currentTarget).style.borderColor = "rgba(59,130,246,0.3)";
                    // Store chosen type in data attr on upload zone wrapper
                    const zone = document.getElementById("upload-zone");
                    if (zone) zone.dataset.filetype = t;
                  }}
                  className="doc-type-btn"
                >
                  {t === "resume" ? "📄 Resume" : t === "cover_letter" ? "✉️ Cover Letter" : t === "jd" ? "📋 JD" : "📎 Other"}
                </button>
              ))}
            </div>

            <div id="upload-zone" data-filetype="resume">
              <FileUpload
                studentId={uploadTarget.id}
                uploadedBy={counselorId}
                fileType="resume"
                onUploaded={(doc) => {
                  addToast(`${doc.file_name} uploaded successfully!`, "success");
                  setUploadTarget(null);
                }}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
