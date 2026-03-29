"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import type { Role } from "@/lib/supabase/database.types";

const NAV: Record<Role, { href: string; icon: string; label: string }[]> = {
  student: [
    { href: "/student",           icon: "📊", label: "Dashboard"    },
    { href: "/student/documents", icon: "📁", label: "My Documents" },
  ],
  counselor: [
    { href: "/counselor",          icon: "📊", label: "Dashboard"   },
    { href: "/counselor/students", icon: "👥", label: "My Students" },
  ],
  admin: [
    { href: "/admin",           icon: "📊", label: "Dashboard"    },
    { href: "/admin/users",     icon: "👥", label: "Users"        },
    { href: "/admin/analytics", icon: "📈", label: "Analytics"    },
  ],
};

const ROLE_COLOR: Record<Role, string> = {
  admin:     "#8b5cf6",
  counselor: "#3b82f6",
  student:   "#10b981",
};

interface SidebarProps {
  role:          Role;
  mobileOpen?:   boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({ role, mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const items    = NAV[role] ?? [];
  const color    = ROLE_COLOR[role];

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Close mobile nav on route change
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
            position:   "fixed",
            inset:      0,
            zIndex:     30,
            background: "rgba(15,23,42,0.25)",
            backdropFilter: "blur(4px)",
          }}
        />
      )}

      <aside
        style={{
          width:                220,
          minHeight:            "100vh",
          background:           "rgba(255,255,255,0.48)",
          backdropFilter:       "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderRight:          "1px solid rgba(255,255,255,0.6)",
          padding:              "20px 12px",
          display:              "flex",
          flexDirection:        "column",
          gap:                  3,
          position:             isMobile ? "fixed" : "sticky",
          top:                  0,
          left:                 isMobile ? (mobileOpen ? 0 : -240) : 0,
          height:               "100vh",
          zIndex:               40,
          transition:           "left 0.3s cubic-bezier(.4,0,.2,1)",
          overflowY:            "auto",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 6px 20px" }}>
          <div
            style={{
              width:           34,
              height:          34,
              borderRadius:    11,
              background:      "linear-gradient(135deg, #3b82f6, #10b981)",
              display:         "flex",
              alignItems:      "center",
              justifyContent:  "center",
              boxShadow:       "0 3px 10px rgba(59,130,246,0.22)",
              flexShrink:      0,
            }}
          >
            <span style={{ color: "#fff", fontSize: 13, fontWeight: 800 }}>CP</span>
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "#1e293b" }}>ConsultPro</div>
            <div
              style={{
                fontSize:      10,
                color,
                fontWeight:    600,
                textTransform: "capitalize",
              }}
            >
              {role} Portal
            </div>
          </div>
        </div>

        {/* Nav items */}
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {items.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display:        "flex",
                  alignItems:     "center",
                  gap:            10,
                  padding:        "10px 13px",
                  borderRadius:   12,
                  fontSize:       13.5,
                  fontWeight:     isActive ? 650 : 500,
                  color:          isActive ? color : "#64748b",
                  textDecoration: "none",
                  transition:     "all 0.22s cubic-bezier(.4,0,.2,1)",
                  background:     isActive
                    ? `linear-gradient(135deg, ${color}14, ${color}08)`
                    : "transparent",
                  boxShadow:      isActive
                    ? `0 2px 8px ${color}14`
                    : "none",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget).style.transform  = "translateX(3px)";
                    (e.currentTarget).style.color      = "#1e293b";
                    (e.currentTarget).style.background = "rgba(255,255,255,0.5)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget).style.transform  = "translateX(0)";
                    (e.currentTarget).style.color      = "#64748b";
                    (e.currentTarget).style.background = "transparent";
                  }
                }}
              >
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </aside>
    </>
  );
}
