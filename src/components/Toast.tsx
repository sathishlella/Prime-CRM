"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useUIStore } from "@/lib/stores/uiStore";

const ICONS: Record<string, string> = {
  success: "✓",
  error:   "✕",
  info:    "ℹ",
};

const COLORS: Record<string, { border: string; icon: string; bg: string }> = {
  success: { border: "rgba(16,185,129,0.25)",  icon: "#10b981", bg: "rgba(16,185,129,0.06)"  },
  error:   { border: "rgba(239,68,68,0.25)",   icon: "#ef4444", bg: "rgba(239,68,68,0.06)"   },
  info:    { border: "rgba(59,130,246,0.25)",  icon: "#3b82f6", bg: "rgba(59,130,246,0.06)"  },
};

export default function ToastContainer() {
  const { toasts, removeToast } = useUIStore();

  return (
    <div
      style={{
        position:      "fixed",
        top:           20,
        right:         20,
        zIndex:        100,
        display:       "flex",
        flexDirection: "column",
        gap:           10,
        pointerEvents: "none",
      }}
    >
      <AnimatePresence>
        {toasts.map((toast) => {
          const c = COLORS[toast.type];
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 20, scale: 0.97 }}
              animate={{ opacity: 1, x: 0,  scale: 1    }}
              exit={{    opacity: 0, x: 20, scale: 0.97 }}
              transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
              onClick={() => removeToast(toast.id)}
              style={{
                background:           "rgba(255,255,255,0.85)",
                backdropFilter:       "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border:               `1px solid ${c.border}`,
                borderRadius:         14,
                boxShadow:            "0 8px 32px rgba(0,0,0,0.08)",
                padding:              "12px 16px",
                display:              "flex",
                alignItems:           "center",
                gap:                  10,
                minWidth:             260,
                maxWidth:             360,
                pointerEvents:        "auto",
                cursor:               "pointer",
              }}
            >
              {/* Icon circle */}
              <div
                style={{
                  width:           28,
                  height:          28,
                  borderRadius:    9,
                  background:      c.bg,
                  border:          `1px solid ${c.border}`,
                  display:         "flex",
                  alignItems:      "center",
                  justifyContent:  "center",
                  fontSize:        13,
                  color:           c.icon,
                  fontWeight:      700,
                  flexShrink:      0,
                }}
              >
                {ICONS[toast.type]}
              </div>

              <p
                style={{
                  margin:     0,
                  fontSize:   13,
                  color:      "#1e293b",
                  fontWeight: 500,
                  flex:       1,
                  lineHeight: 1.4,
                }}
              >
                {toast.message}
              </p>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
