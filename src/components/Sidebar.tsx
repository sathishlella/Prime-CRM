"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import type { Role } from "@/lib/supabase/database.types";

// ─── SVG Icons ────────────────────────────────────────────────────────────────
function IconGrid() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.85"/>
      <rect x="9" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.85"/>
      <rect x="1" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.85"/>
      <rect x="9" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.85"/>
    </svg>
  );
}
function IconUsers() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="6" cy="5" r="2.5" fill="currentColor" opacity="0.85"/>
      <path d="M1 13c0-2.76 2.24-5 5-5h.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.85"/>
      <circle cx="12" cy="6" r="2" fill="currentColor" opacity="0.6"/>
      <path d="M9 13c0-2 1.34-3.67 3-3.67" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
    </svg>
  );
}
function IconTrend() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <polyline points="1,12 5,7 9,9 15,3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.85"/>
      <polyline points="11,3 15,3 15,7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.85"/>
    </svg>
  );
}
function IconFolder() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 4.5C2 3.67 2.67 3 3.5 3H6.5L8 5H12.5C13.33 5 14 5.67 14 6.5V11.5C14 12.33 13.33 13 12.5 13H3.5C2.67 13 2 12.33 2 11.5V4.5Z" fill="currentColor" opacity="0.85"/>
    </svg>
  );
}
function IconPerson() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="5" r="3" fill="currentColor" opacity="0.85"/>
      <path d="M2 14c0-3.31 2.69-6 6-6s6 2.69 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.85"/>
    </svg>
  );
}
function IconChevron() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M5 11L9 7L5 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ─── Nav config ───────────────────────────────────────────────────────────────
const NAV: Record<Role, { href: string; icon: React.ReactNode; label: string }[]> = {
  student: [
    { href: "/student",           icon: <IconGrid />,   label: "Dashboard"    },
    { href: "/student/documents", icon: <IconFolder />, label: "My Documents" },
  ],
  counselor: [
    { href: "/counselor",          icon: <IconGrid />,  label: "Dashboard"   },
    { href: "/counselor/students", icon: <IconUsers />, label: "My Students" },
  ],
  admin: [
    { href: "/admin",             icon: <IconGrid />,   label: "Dashboard"   },
    { href: "/admin/users",       icon: <IconUsers />,  label: "Users"       },
    { href: "/admin/analytics",   icon: <IconTrend />,  label: "Analytics"   },
  ],
};

const ROLE_LABEL: Record<Role, string> = {
  admin:     "Admin Portal",
  counselor: "Counselor Portal",
  student:   "Student Portal",
};

interface SidebarProps {
  role:           Role;
  mobileOpen?:    boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({ role, mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const items    = NAV[role] ?? [];

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (mobileOpen) onMobileClose?.();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (isMobile && !mobileOpen) return null;

  return (
    <>
      {/* Mobile backdrop */}
      {isMobile && mobileOpen && (
        <div
          onClick={onMobileClose}
          style={{
            position:       "fixed",
            inset:          0,
            zIndex:         30,
            background:     "rgba(10,15,30,0.3)",
            backdropFilter: "blur(6px)",
          }}
        />
      )}

      <aside
        style={{
          width:                240,
          minHeight:            "100vh",
          background:           "rgba(255,255,255,0.82)",
          backdropFilter:       "blur(40px)",
          WebkitBackdropFilter: "blur(40px)",
          borderRight:          "1px solid rgba(0,0,0,0.06)",
          padding:              "24px 16px 24px",
          display:              "flex",
          flexDirection:        "column",
          gap:                  0,
          position:             isMobile ? "fixed" : "sticky",
          top:                  0,
          left:                 isMobile ? (mobileOpen ? 0 : -260) : 0,
          height:               "100vh",
          zIndex:               40,
          transition:           "left 0.3s cubic-bezier(.4,0,.2,1)",
          overflowY:            "auto",
        }}
      >
        {/* ── Logo ── */}
        <Link href={`/${role}`} style={{ textDecoration: "none", padding: "0 4px 28px", display: "block" }}>
          {/* Logo Image */}
          <div style={{
            width:           48,
            height:          48,
            borderRadius:    14,
            background:      "linear-gradient(145deg, #0A0F1E 0%, #1a2744 100%)",
            display:         "flex",
            alignItems:      "center",
            justifyContent:  "center",
            flexShrink:      0,
            boxShadow:       "0 3px 12px rgba(10,15,30,0.2)",
            position:        "relative",
            overflow:        "hidden",
          }}>
            <Image
              src="/logo.png"
              alt="F1 Dream Jobs"
              width={32}
              height={32}
              style={{ objectFit: "contain" }}
              priority
            />
          </div>
        </Link>

        {/* ── Nav section label ── */}
        <div style={{ fontSize: 10, fontWeight: 700, color: "#C4CADB", textTransform: "uppercase", letterSpacing: "0.9px", padding: "0 12px", marginBottom: 6 }}>
          Navigation
        </div>

        {/* ── Nav items ── */}
        <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {items.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display:        "flex",
                  alignItems:     "center",
                  justifyContent: "space-between",
                  gap:            10,
                  padding:        "9px 12px",
                  borderRadius:   11,
                  fontSize:       13.5,
                  fontWeight:     isActive ? 600 : 500,
                  color:          isActive ? "#0A6EBD" : "#6B7280",
                  textDecoration: "none",
                  transition:     "all 0.22s cubic-bezier(.4,0,.2,1)",
                  background:     isActive ? "rgba(10,110,189,0.08)" : "transparent",
                  letterSpacing:  "-0.01em",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget).style.color      = "#0A0F1E";
                    (e.currentTarget).style.background = "#F7F9FC";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget).style.color      = "#6B7280";
                    (e.currentTarget).style.background = "transparent";
                  }
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ opacity: isActive ? 1 : 0.65, display: "flex", alignItems: "center" }}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </span>
                {isActive && (
                  <span style={{ opacity: 0.35, display: "flex", alignItems: "center" }}>
                    <IconChevron />
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* ── Spacer ── */}
        <div style={{ flex: 1 }} />

        {/* ── Footer ── */}
        <div style={{ padding: "16px 12px 0", borderTop: "1px solid rgba(0,0,0,0.05)" }}>
          <div style={{ fontSize: 10.5, color: "#C4CADB", fontWeight: 500, lineHeight: 1.5 }}>
            F1 Dream Jobs CRM
            <br />
            <span style={{ color: "#DFE3EC" }}>v1.0 · All rights reserved</span>
          </div>
        </div>
      </aside>
    </>
  );
}
