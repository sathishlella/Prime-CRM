"use client";

import { useState } from "react";
import { generateCV } from "@/lib/api/cvs";

interface GenerateCVModalProps {
  studentId: string;
  studentName: string;
  applicationId?: string;
  initialJD?: string;
  initialCompany?: string;
  initialRole?: string;
  onClose: () => void;
  onGenerated?: (result: { pdf_url: string; cv_id: string }) => void;
}

export default function GenerateCVModal({
  studentId,
  studentName,
  applicationId,
  initialJD = "",
  initialCompany = "",
  initialRole = "",
  onClose,
  onGenerated,
}: GenerateCVModalProps) {
  const [jobDescription, setJobDescription] = useState(initialJD);
  const [companyName, setCompanyName] = useState(initialCompany);
  const [jobRole, setJobRole] = useState(initialRole);
  const [format, setFormat] = useState<"letter" | "a4">("letter");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    pdf_url: string;
    cv_id: string;
    page_count: number;
    keyword_coverage: number;
  } | null>(null);

  const handleGenerate = async () => {
    if (!jobDescription || !companyName || !jobRole) {
      setError("All fields are required");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await generateCV(studentId, jobDescription, companyName, jobRole, {
        application_id: applicationId,
        format,
      });
      setResult(res);
      if (onGenerated) onGenerated(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "CV generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(10,15,30,0.6)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#ffffff",
          borderRadius: 20,
          padding: 28,
          width: "100%",
          maxWidth: 640,
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 30px 80px rgba(0,0,0,0.25)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0A0F1E", margin: 0 }}>
              Generate Tailored CV
            </h2>
            <p style={{ fontSize: 13, color: "#6b7280", marginTop: 4, margin: 0 }}>
              For {studentName}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              fontSize: 24,
              cursor: "pointer",
              color: "#6b7280",
              padding: 4,
            }}
          >
            ×
          </button>
        </div>

        {!result ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Field label="Company Name">
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g., Google"
                style={inputStyle}
                disabled={loading}
              />
            </Field>
            <Field label="Job Role">
              <input
                type="text"
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
                placeholder="e.g., Senior Software Engineer"
                style={inputStyle}
                disabled={loading}
              />
            </Field>
            <Field label="Job Description">
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the full job description here..."
                rows={8}
                style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
                disabled={loading}
              />
            </Field>
            <Field label="Page Format">
              <div style={{ display: "flex", gap: 8 }}>
                <FormatButton
                  active={format === "letter"}
                  onClick={() => setFormat("letter")}
                  disabled={loading}
                >
                  US Letter
                </FormatButton>
                <FormatButton
                  active={format === "a4"}
                  onClick={() => setFormat("a4")}
                  disabled={loading}
                >
                  A4
                </FormatButton>
              </div>
            </Field>

            {error && (
              <div
                style={{
                  padding: 10,
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: 8,
                  color: "#991b1b",
                  fontSize: 13,
                }}
              >
                {error}
              </div>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button
                onClick={onClose}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: "12px 20px",
                  borderRadius: 10,
                  border: "1px solid #e5e7eb",
                  background: "#ffffff",
                  color: "#374151",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={loading}
                style={{
                  flex: 2,
                  padding: "12px 20px",
                  borderRadius: 10,
                  border: "none",
                  background: loading
                    ? "#9ca3af"
                    : "linear-gradient(135deg, #0A6EBD, #6B46C1)",
                  color: "#ffffff",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "Generating... (30-60s)" : "Generate CV"}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div
              style={{
                padding: 20,
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: 12,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 8 }}>✓</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#065f46" }}>
                CV Generated Successfully
              </div>
              <div style={{ fontSize: 13, color: "#047857", marginTop: 4 }}>
                {result.page_count} page{result.page_count > 1 ? "s" : ""} · {result.keyword_coverage}% keyword coverage
              </div>
            </div>

            <a
              href={result.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block",
                textAlign: "center",
                padding: "14px 20px",
                borderRadius: 10,
                background: "linear-gradient(135deg, #0A6EBD, #6B46C1)",
                color: "#ffffff",
                fontSize: 14,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Download PDF
            </a>

            <button
              onClick={onClose}
              style={{
                padding: "12px 20px",
                borderRadius: 10,
                border: "1px solid #e5e7eb",
                background: "#ffffff",
                color: "#374151",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  fontSize: 14,
  color: "#0A0F1E",
  background: "#f9fafb",
  outline: "none",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function FormatButton({
  active,
  onClick,
  disabled,
  children,
}: {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: 1,
        padding: "10px 14px",
        borderRadius: 10,
        border: active ? "2px solid #0A6EBD" : "1px solid #e5e7eb",
        background: active ? "#eff6ff" : "#ffffff",
        color: active ? "#0A6EBD" : "#374151",
        fontSize: 13,
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {children}
    </button>
  );
}
