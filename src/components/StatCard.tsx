"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

interface StatCardProps {
  icon?:  string;   // kept for API compatibility, no longer rendered
  value:  number;
  label:  string;
  delay?: number;
  color?: string;
  trend?: { value: number; label: string }; // optional trend indicator
}

function useCountUp(target: number, duration = 900, startDelay = 0) {
  const [count, setCount] = useState(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    let startTime: number | null = null;
    const delayTimer = setTimeout(() => {
      const step = (ts: number) => {
        if (!startTime) startTime = ts;
        const elapsed  = ts - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased    = 1 - Math.pow(1 - progress, 3);
        setCount(Math.floor(eased * target));
        if (progress < 1) frameRef.current = requestAnimationFrame(step);
      };
      frameRef.current = requestAnimationFrame(step);
    }, startDelay);

    return () => {
      clearTimeout(delayTimer);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [target, duration, startDelay]);

  return count;
}

export default function StatCard({ value, label, delay = 0, color = "#0A6EBD" }: StatCardProps) {
  const count = useCountUp(value, 900, delay);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1], delay: delay / 1000 }}
      style={{
        background:    "#FFFFFF",
        border:        "1px solid rgba(0,0,0,0.06)",
        borderRadius:  20,
        boxShadow:     "0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)",
        padding:       "22px 22px 20px",
        position:      "relative",
        overflow:      "hidden",
      }}
    >
      {/* Top accent bar */}
      <div style={{
        position:     "absolute",
        top:          0,
        left:         0,
        right:        0,
        height:       3,
        background:   color,
        borderRadius: "20px 20px 0 0",
        opacity:      0.7,
      }} />

      {/* Value */}
      <div style={{
        fontSize:           36,
        fontWeight:         700,
        color:              "#0A0F1E",
        lineHeight:         1,
        fontVariantNumeric: "tabular-nums",
        letterSpacing:      "-1.5px",
        marginBottom:       8,
        marginTop:          4,
      }}>
        {count}
      </div>

      {/* Label */}
      <div style={{
        fontSize:      11,
        color:         "#9CA3AF",
        fontWeight:    600,
        textTransform: "uppercase",
        letterSpacing: "0.7px",
        lineHeight:    1.3,
      }}>
        {label}
      </div>

      {/* Color dot accent */}
      <div style={{
        position:     "absolute",
        bottom:       16,
        right:        18,
        width:        8,
        height:       8,
        borderRadius: "50%",
        background:   color,
        opacity:      0.35,
      }} />
    </motion.div>
  );
}
