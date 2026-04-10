"use client";

import { motion } from "framer-motion";
import type { GeneratedCV } from "./page";

export default function StudentCVsClient({ cvs }: { cvs: GeneratedCV[] }) {
  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ marginBottom: 24 }}
      >
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1e293b", margin: "0 0 3px" }}>
          My CVs
        </h2>
        <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>
          AI-tailored CVs generated for each application · Download anytime
        </p>
      </motion.div>

      {cvs.length === 0 ? (
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
          No CVs yet. Your counselor will generate tailored CVs as you apply.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
          {cvs.map((cv, i) => (
            <motion.div
              key={cv.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
              style={{
                background: "rgba(255,255,255,0.7)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.7)",
                borderRadius: 16,
                padding: 20,
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20,
                    color: "#fff",
                  }}
                >
                  📄
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b" }}>
                    {cv.company_name}
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{cv.job_role}</div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, fontSize: 11, color: "#94a3b8", flexWrap: "wrap" }}>
                <span>{cv.page_count} page{cv.page_count > 1 ? "s" : ""}</span>
                <span>·</span>
                <span>{cv.keyword_coverage}% keyword match</span>
                <span>·</span>
                <span>{cv.format.toUpperCase()}</span>
              </div>

              <div style={{ fontSize: 11, color: "#94a3b8" }}>
                Generated {new Date(cv.created_at).toLocaleDateString()}
              </div>

              {cv.pdf_url && (
                <a
                  href={cv.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "block",
                    textAlign: "center",
                    padding: "10px 16px",
                    borderRadius: 10,
                    background: "linear-gradient(135deg, #3b82f6, #10b981)",
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  Download PDF
                </a>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
