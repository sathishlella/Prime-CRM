"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { DocumentType } from "@/lib/supabase/database.types";

const ACCEPTED = ".pdf,.doc,.docx";
const ACCEPTED_MIME = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export type FileType = DocumentType;

interface FileUploadProps {
  studentId:  string;
  uploadedBy: string;
  fileType?:  FileType;
  onUploaded: (doc: { id: string; file_name: string; file_type: FileType }) => void;
}

type UploadState = "idle" | "dragover" | "uploading" | "success" | "error";

export default function FileUpload({
  studentId,
  uploadedBy,
  fileType = "resume",
  onUploaded,
}: FileUploadProps) {
  const [state,    setState]    = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [fileName, setFileName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      // Validate type
      if (!ACCEPTED_MIME.includes(file.type)) {
        setErrorMsg("Only PDF, DOC, or DOCX files allowed.");
        setState("error");
        return;
      }
      // Validate size
      if (file.size > MAX_BYTES) {
        setErrorMsg("File must be under 10 MB.");
        setState("error");
        return;
      }

      setFileName(file.name);
      setState("uploading");
      setProgress(0);
      setErrorMsg("");

      // Lazy import to avoid SSR issues
      const { uploadDocument } = await import("@/lib/api/documents");
      const { data, error } = await uploadDocument({
        file,
        studentId,
        uploadedBy,
        fileType,
        onProgress: (pct) => setProgress(pct),
      });

      if (error || !data) {
        setErrorMsg(error ?? "Upload failed.");
        setState("error");
        return;
      }

      setState("success");
      onUploaded({ id: data.id, file_name: data.file_name, file_type: data.file_type });

      // Reset after 3s
      setTimeout(() => {
        setState("idle");
        setProgress(0);
        setFileName("");
      }, 3000);
    },
    [studentId, uploadedBy, fileType, onUploaded]
  );

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setState("idle");
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = ""; // allow re-selecting same file
  }

  const borderColor =
    state === "dragover" ? "#3b82f6"
    : state === "error"  ? "#ef4444"
    : state === "success" ? "#10b981"
    : "rgba(0,0,0,0.1)";

  const bgColor =
    state === "dragover" ? "rgba(59,130,246,0.04)"
    : state === "error"  ? "rgba(239,68,68,0.03)"
    : state === "success" ? "rgba(16,185,129,0.04)"
    : "rgba(255,255,255,0.35)";

  return (
    <div>
      {/* Drop zone */}
      <div
        onClick={() => state === "idle" || state === "error" ? inputRef.current?.click() : null}
        onDragEnter={(e) => { e.preventDefault(); if (state === "idle") setState("dragover"); }}
        onDragOver={(e)  => { e.preventDefault(); if (state === "idle") setState("dragover"); }}
        onDragLeave={(e) => { e.preventDefault(); setState("idle"); }}
        onDrop={onDrop}
        style={{
          border:         `2px dashed ${borderColor}`,
          borderRadius:   16,
          background:     bgColor,
          padding:        "28px 20px",
          textAlign:      "center",
          cursor:         state === "uploading" || state === "success" ? "default" : "pointer",
          transition:     "all 0.3s cubic-bezier(.4,0,.2,1)",
          userSelect:     "none",
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          style={{ display: "none" }}
          onChange={onInputChange}
        />

        <AnimatePresence mode="wait">
          {/* Idle */}
          {(state === "idle" || state === "dragover") && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>
                {state === "dragover" ? "📂" : "📁"}
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: state === "dragover" ? "#3b82f6" : "#475569", marginBottom: 4 }}>
                {state === "dragover" ? "Drop to upload" : "Drag & drop or click to browse"}
              </div>
              <div style={{ fontSize: 12, color: "#94a3b8" }}>PDF, DOC, DOCX · max 10 MB</div>
            </motion.div>
          )}

          {/* Uploading */}
          {state === "uploading" && (
            <motion.div key="uploading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 14 }}>
                Uploading <span style={{ color: "#3b82f6" }}>{fileName}</span>…
              </div>
              {/* Progress bar */}
              <div style={{ height: 6, borderRadius: 6, background: "rgba(0,0,0,0.07)", overflow: "hidden", maxWidth: 280, margin: "0 auto" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: "easeOut", duration: 0.4 }}
                  style={{ height: "100%", borderRadius: 6, background: "linear-gradient(90deg, #3b82f6, #10b981)" }}
                />
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 8 }}>{progress}%</div>
            </motion.div>
          )}

          {/* Success */}
          {state === "success" && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>✅</div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: "#10b981" }}>Uploaded successfully!</div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>{fileName}</div>
            </motion.div>
          )}

          {/* Error */}
          {state === "error" && (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
              style={{ animation: "shake 0.4s cubic-bezier(.4,0,.2,1) both" }}
            >
              <div style={{ fontSize: 28, marginBottom: 8 }}>❌</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#ef4444", marginBottom: 6 }}>{errorMsg}</div>
              <div style={{ fontSize: 12, color: "#94a3b8" }}>Click to try again</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
