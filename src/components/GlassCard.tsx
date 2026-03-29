"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

interface GlassCardProps {
  children:   React.ReactNode;
  hoverable?: boolean;
  padding?:   string | number;
  onClick?:   () => void;
  className?: string;
  style?:     React.CSSProperties;
  delay?:     number; // stagger delay in seconds
}

export default function GlassCard({
  children,
  hoverable = false,
  padding   = "20px",
  onClick,
  className,
  style,
  delay = 0,
}: GlassCardProps) {
  const baseStyle: React.CSSProperties = {
    background:              "rgba(255,255,255,0.5)",
    backdropFilter:          "blur(20px)",
    WebkitBackdropFilter:    "blur(20px)",
    border:                  "1px solid rgba(255,255,255,0.65)",
    borderRadius:            18,
    boxShadow:               "0 4px 24px rgba(0,0,0,0.03), 0 1px 3px rgba(0,0,0,0.02)",
    padding,
    cursor:                  onClick || hoverable ? "pointer" : undefined,
    ...style,
  };

  return (
    <motion.div
      className={className}
      style={baseStyle}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1], delay }}
      whileHover={
        hoverable || onClick
          ? { y: -2, boxShadow: "0 8px 32px rgba(0,0,0,0.07), 0 2px 6px rgba(0,0,0,0.03)" }
          : undefined
      }
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}
