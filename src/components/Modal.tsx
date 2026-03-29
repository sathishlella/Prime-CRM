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
  // Close on Escape
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
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position:        "fixed",
              inset:           0,
              zIndex:          50,
              background:      "rgba(15,23,42,0.35)",
              backdropFilter:  "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
            }}
          />

          {/* Card */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{   opacity: 0, scale: 0.96, y: 12  }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            style={{
              position:   "fixed",
              inset:      0,
              zIndex:     51,
              display:    "flex",
              alignItems: "center",
              justifyContent: "center",
              padding:    "20px",
              pointerEvents: "none",
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width:                "100%",
                maxWidth,
                background:           "rgba(255,255,255,0.72)",
                backdropFilter:       "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                border:               "1px solid rgba(255,255,255,0.75)",
                borderRadius:         22,
                boxShadow:            "0 20px 60px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)",
                pointerEvents:        "auto",
                overflow:             "hidden",
              }}
            >
              {/* Header */}
              <div
                style={{
                  display:        "flex",
                  alignItems:     "center",
                  justifyContent: "space-between",
                  padding:        "22px 24px 18px",
                  borderBottom:   "1px solid rgba(0,0,0,0.05)",
                }}
              >
                <h3
                  style={{
                    margin:      0,
                    fontSize:    16,
                    fontWeight:  800,
                    color:       "#1e293b",
                    letterSpacing: "-0.2px",
                  }}
                >
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
                    color:      "#64748b",
                    fontSize:   16,
                    cursor:     "pointer",
                    display:    "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s cubic-bezier(.4,0,.2,1)",
                    fontFamily: "inherit",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget).style.background = "rgba(239,68,68,0.1)";
                    (e.currentTarget).style.color = "#ef4444";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget).style.background = "rgba(0,0,0,0.05)";
                    (e.currentTarget).style.color = "#64748b";
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Body */}
              <div style={{ padding: "20px 24px 24px", maxHeight: "70vh", overflowY: "auto" }}>
                {children}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
