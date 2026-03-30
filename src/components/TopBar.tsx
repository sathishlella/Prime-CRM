"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Avatar from "@/components/Avatar";
import NotificationBell from "@/components/NotificationBell";

interface Props {
  user: {
    id:         string;
    full_name:  string;
    role:       string;
    avatar_url?: string | null;
  };
  onMenuClick?: () => void;
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function IconMenu() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function IconSignOut() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M6 2H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M10 12l4-4-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function IconChevronDown() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconUser() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M2 14c0-3 2.5-5 6-5s6 2 6 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

const ROLE_COLOR: Record<string, string> = {
  admin:     "#7C3AED",
  counselor: "#0A6EBD",
  student:   "#059669",
};

const ROLE_BG: Record<string, string> = {
  admin:     "rgba(124,58,237,0.08)",
  counselor: "rgba(10,110,189,0.08)",
  student:   "rgba(5,150,105,0.08)",
};

// ─── User Dropdown Menu ───────────────────────────────────────────────────────
function UserDropdown({ 
  user, 
  onLogout 
}: { 
  user: Props['user']; 
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initials = user.full_name
    .split(" ")
    .map((n) => n[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const color = ROLE_COLOR[user.role] ?? "#0A6EBD";
  const roleBg = ROLE_BG[user.role] ?? "rgba(10,110,189,0.08)";
  const roleLabel = user.role.charAt(0).toUpperCase() + user.role.slice(1);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {/* User Pill Button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          display:       "flex",
          alignItems:    "center",
          gap:           10,
          padding:       "6px 14px 6px 6px",
          borderRadius:  50,
          background:    "#FFFFFF",
          border:        "1px solid rgba(0,0,0,0.06)",
          boxShadow:     "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)",
          cursor:        "pointer",
          transition:    "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
          e.currentTarget.style.borderColor = "rgba(0,0,0,0.1)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)";
          e.currentTarget.style.borderColor = "rgba(0,0,0,0.06)";
        }}
      >
        <Avatar initials={initials} size={32} color={color} src={user.avatar_url} />
        <div style={{ textAlign: "left" }}>
          <div style={{ 
            fontSize: 13, 
            fontWeight: 600, 
            color: "#0A0F1E", 
            lineHeight: 1.3,
            letterSpacing: "-0.01em"
          }}>
            {user.full_name}
          </div>
          <div style={{
            fontSize:    10,
            fontWeight:  600,
            color:       color,
            background:  roleBg,
            borderRadius: 4,
            padding:     "1px 6px",
            display:     "inline-block",
            letterSpacing: "0.2px",
            textTransform: "uppercase",
          }}>
            {roleLabel}
          </div>
        </div>
        <span style={{ 
          color: "#9CA3AF", 
          marginLeft: 4,
          transform: open ? "rotate(180deg)" : "rotate(0)",
          transition: "transform 0.2s ease"
        }}>
          <IconChevronDown />
        </span>
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            minWidth: 200,
            background: "rgba(255,255,255,0.98)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(0,0,0,0.08)",
            borderRadius: 16,
            boxShadow: "0 20px 40px rgba(0,0,0,0.12), 0 8px 16px rgba(0,0,0,0.08)",
            padding: "8px",
            zIndex: 100,
            animation: "fadeIn 0.2s ease",
          }}
        >
          {/* User Info Header */}
          <div style={{
            padding: "12px 16px",
            borderBottom: "1px solid rgba(0,0,0,0.06)",
            marginBottom: 4,
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#0A0F1E" }}>
              {user.full_name}
            </div>
            <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>
              {user.role}@f1dreamjobs.com
            </div>
          </div>

          {/* Sign Out */}
          <button
            onClick={() => { setOpen(false); onLogout(); }}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 14px",
              borderRadius: 10,
              border: "none",
              background: "transparent",
              color: "#DC2626",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.15s ease",
              fontFamily: "inherit",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(220,38,38,0.06)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <IconSignOut />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main TopBar Component ────────────────────────────────────────────────────
export default function TopBar({ user, onMenuClick }: Props) {
  const router   = useRouter();
  const supabase = createClient();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header
      style={{
        position:             "sticky",
        top:                  0,
        zIndex:               30,
        background:           "rgba(248,250,252,0.85)",
        backdropFilter:       "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        borderBottom:         "1px solid rgba(0,0,0,0.04)",
        padding:              "0 clamp(12px,3vw,24px)",
        height:               56,
        display:              "flex",
        alignItems:           "center",
        justifyContent:       "space-between",
        gap:                  16,
      }}
    >
      {/* Left Section */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {/* Hamburger Menu - Mobile Only */}
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="mobile-only"
            style={{
              width: 40,
              height: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#FFFFFF",
              border: "1px solid rgba(0,0,0,0.06)",
              borderRadius: 12,
              cursor: "pointer",
              color: "#4B5563",
              transition: "all 0.2s ease",
              boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
            }}
            aria-label="Open menu"
            onMouseEnter={(e) => { 
              e.currentTarget.style.background = "#F9FAFB"; 
              e.currentTarget.style.borderColor = "rgba(0,0,0,0.1)";
            }}
            onMouseLeave={(e) => { 
              e.currentTarget.style.background = "#FFFFFF"; 
              e.currentTarget.style.borderColor = "rgba(0,0,0,0.06)";
            }}
          >
            <IconMenu />
          </button>
        )}

        {/* Mobile Logo */}
        <div className="mobile-only" style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          background: "linear-gradient(145deg, #0A0F1E, #1a2744)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 2px 8px rgba(10,15,30,0.15)",
        }}>
          <Image
            src="/logo.png"
            alt="F1"
            width={22}
            height={22}
            priority
          />
        </div>
      </div>

      {/* Right Section */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {/* Notifications */}
        <div style={{
          width: 40,
          height: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#FFFFFF",
          border: "1px solid rgba(0,0,0,0.06)",
          borderRadius: 12,
          cursor: "pointer",
          transition: "all 0.2s ease",
          boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
        }}
        onMouseEnter={(e) => { 
          e.currentTarget.style.background = "#F9FAFB"; 
          e.currentTarget.style.borderColor = "rgba(0,0,0,0.1)";
        }}
        onMouseLeave={(e) => { 
          e.currentTarget.style.background = "#FFFFFF"; 
          e.currentTarget.style.borderColor = "rgba(0,0,0,0.06)";
        }}
        >
          <NotificationBell userId={user.id} />
        </div>

        {/* User Dropdown */}
        <UserDropdown user={user} onLogout={handleLogout} />
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </header>
  );
}
