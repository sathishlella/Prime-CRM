"use client";

import { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ModalProps {
  isOpen:    boolean;
  onClose:   () => void;
  title:     string;
  children:  React.ReactNode;
  maxWidth?: number;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 520,
}: ModalProps) {
  const handleKey = useCallback(
    (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKey]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
            style={{
              position:             "fixed",
              inset:                0,
              zIndex:               50,
              background:           "rgba(10,15,30,0.4)",
              backdropFilter:       "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
            }}
          />

          {/* ── Desktop: centered card ── */}
          <motion.div
            key="modal-desktop"
            className="modal-desktop-wrapper"
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{   opacity: 0, scale: 0.97, y: 10  }}
            transition={{ duration: 0.26, ease: [0.34, 1.1, 0.64, 1] }}
            style={{
              position:      "fixed",
              inset:         0,
              zIndex:        51,
              display:       "flex",
              alignItems:    "center",
              justifyContent: "center",
              padding:       "20px",
              pointerEvents: "none",
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width:                "100%",
                maxWidth,
                background:           "#FFFFFF",
                border:               "1px solid rgba(0,0,0,0.07)",
                borderRadius:         22,
                boxShadow:            "0 24px 64px rgba(0,0,0,0.14), 0 4px 16px rgba(0,0,0,0.06)",
                pointerEvents:        "auto",
                overflow:             "hidden",
              }}
            >
              {/* Header */}
              <div style={{
                display:        "flex",
                alignItems:     "center",
                justifyContent: "space-between",
                padding:        "20px 24px 16px",
                borderBottom:   "1px solid rgba(0,0,0,0.05)",
              }}>
                <h3 style={{
                  margin:        0,
                  fontSize:      16,
                  fontWeight:    700,
                  color:         "#0A0F1E",
                  letterSpacing: "-0.3px",
                }}>
                  {title}
                </h3>
                <button
                  onClick={onClose}
                  style={{
                    width:      32,
                    height:     32,
                    borderRadius: 10,
                    border:     "none",
                    background: "rgba(0,0,0,0.05)",
                    color:      "#6B7280",
                    cursor:     "pointer",
                    display:    "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.18s",
                    fontFamily: "inherit",
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget).style.background = "rgba(220,38,38,0.08)";
                    (e.currentTarget).style.color      = "#DC2626";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget).style.background = "rgba(0,0,0,0.05)";
                    (e.currentTarget).style.color      = "#6B7280";
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>

              {/* Body */}
              <div style={{ padding: "20px 24px 24px", maxHeight: "75vh", overflowY: "auto" }}>
                {children}
              </div>
            </div>
          </motion.div>

          {/* ── Mobile: bottom-sheet ── */}
          <motion.div
            key="modal-mobile"
            className="modal-mobile-sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            onClick={(e) => e.stopPropagation()}
            style={{
              position:   "fixed",
              bottom:     0,
              left:       0,
              right:      0,
              zIndex:     52,
              background: "#FFFFFF",
              borderRadius: "20px 20px 0 0",
              boxShadow:  "0 -8px 40px rgba(0,0,0,0.15)",
              maxHeight:  "92vh",
              display:    "flex",
              flexDirection: "column",
            }}
          >
            {/* Drag handle */}
            <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 0" }}>
              <div style={{ width: 36, height: 4, borderRadius: 4, background: "#E5E7EB" }} />
            </div>

            {/* Header */}
            <div style={{
              display:        "flex",
              alignItems:     "center",
              justifyContent: "space-between",
              padding:        "14px 20px 12px",
              borderBottom:   "1px solid rgba(0,0,0,0.05)",
            }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0A0F1E", letterSpacing: "-0.2px" }}>
                {title}
              </h3>
              <button
                onClick={onClose}
                style={{
                  width:      30,
                  height:     30,
                  borderRadius: 9,
                  border:     "none",
                  background: "rgba(0,0,0,0.05)",
                  color:      "#6B7280",
                  cursor:     "pointer",
                  display:    "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "inherit",
                }}
              >
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: "16px 20px 32px", overflowY: "auto", flex: 1 }}>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
