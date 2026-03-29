"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

interface StatCardProps {
  icon:   string;
  value:  number;
  label:  string;
  delay?: number; // ms for stagger
  color?: string;
}

function useCountUp(target: number, duration = 800, startDelay = 0) {
  const [count, setCount] = useState(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    let startTime: number | null = null;

    const delayTimer = setTimeout(() => {
      const step = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const elapsed  = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // ease-out-cubic
        const eased = 1 - Math.pow(1 - progress, 3);
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

export default function StatCard({ icon, value, label, delay = 0, color }: StatCardProps) {
  const count = useCountUp(value, 800, delay);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1], delay: delay / 1000 }}
      style={{
        background:           "rgba(255,255,255,0.5)",
        backdropFilter:       "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border:               "1px solid rgba(255,255,255,0.65)",
        borderRadius:         18,
        boxShadow:            "0 4px 24px rgba(0,0,0,0.03)",
        padding:              "18px 16px",
        textAlign:            "center",
      }}
    >
      <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
      <div
        style={{
          fontSize:   28,
          fontWeight: 800,
          color:      color ?? "#1e293b",
          lineHeight: 1.1,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {count}
      </div>
      <div
        style={{
          fontSize:       10.5,
          color:          "#94a3b8",
          fontWeight:     600,
          marginTop:      5,
          textTransform:  "uppercase",
          letterSpacing:  0.7,
        }}
      >
        {label}
      </div>
    </motion.div>
  );
}
