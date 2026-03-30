"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useState } from "react";
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

// ─── Hamburger SVG ────────────────────────────────────────────────────────────
function IconMenu() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M2 5h14M2 9h14M2 13h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  );
}

// ─── Sign-out SVG ─────────────────────────────────────────────────────────────
function IconSignOut() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M5 2H3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M9 10l3-3-3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 7H5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
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

  const initials = user.full_name
    .split(" ")
    .map((n) => n[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const color   = ROLE_COLOR[user.role] ?? "#0A6EBD";
  const roleBg  = ROLE_BG[user.role]   ?? "rgba(10,110,189,0.08)";
  const roleLabel = user.role.charAt(0).toUpperCase() + user.role.slice(1);

  return (
    <header
      style={{
        position:             "sticky",
        top:                  0,
        zIndex:               20,
        background:           "rgba(247,249,252,0.88)",
        backdropFilter:       "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderBottom:         "1px solid rgba(0,0,0,0.06)",
        padding:              "0 24px",
        height:               56,
        display:              "flex",
        alignItems:           "center",
        justifyContent:       "space-between",
        gap:                  12,
      }}
    >
      {/* Left */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Hamburger menu - mobile only (hidden on lg screens) */}
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="mobile-only"
            style={{
              background: "none",
              border:     "none",
              cursor:     "pointer",
              color:      "#6B7280",
              padding:    "6px",
              borderRadius: 8,
              display:    "flex",
              alignItems: "center",
              transition: "all 0.18s",
            }}
            aria-label="Open menu"
            onMouseEnter={(e) => { (e.currentTarget).style.background = "#F3F4F6"; (e.currentTarget).style.color = "#0A0F1E"; }}
            onMouseLeave={(e) => { (e.currentTarget).style.background = "none";    (e.currentTarget).style.color = "#6B7280"; }}
          >
            <IconMenu />
          </button>
        )}

        {/* F1 logo mark - mobile only */}
        <div className="mobile-only" style={{
          width:          32,
          height:         32,
          borderRadius:   10,
          background:     "linear-gradient(145deg, #0A0F1E, #1a2744)",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          boxShadow:      "0 1px 4px rgba(10,15,30,0.15)",
          overflow:       "hidden",
          position:       "relative",
        }}>
          <Image
            src="/logo.svg"
            alt="F1 Dream Jobs"
            width={20}
            height={20}
            style={{ position: "relative", zIndex: 1 }}
            priority
          />
        </div>
      </div>

      {/* Right */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>

        <NotificationBell userId={user.id} />

        {/* User pill */}
        <div style={{
          display:       "flex",
          alignItems:    "center",
          gap:           9,
          padding:       "5px 12px 5px 6px",
          borderRadius:  12,
          background:    "#FFFFFF",
          border:        "1px solid rgba(0,0,0,0.06)",
          boxShadow:     "0 1px 3px rgba(0,0,0,0.04)",
        }}>
          <Avatar initials={initials} size={26} color={color} src={user.avatar_url} />
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "#0A0F1E", lineHeight: 1.2, letterSpacing: "-0.01em" }}>
              {user.full_name}
            </div>
            <div style={{
              fontSize:    10,
              fontWeight:  600,
              color:       color,
              background:  roleBg,
              borderRadius: 4,
              padding:     "1px 5px",
              display:     "inline-block",
              marginTop:   2,
              letterSpacing: "0.1px",
            }}>
              {roleLabel}
            </div>
          </div>
        </div>

        {/* Sign out button */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          style={{
            display:       "flex",
            alignItems:    "center",
            gap:           6,
            padding:       "7px 13px",
            borderRadius:  10,
            border:        "1px solid rgba(0,0,0,0.07)",
            background:    "#FFFFFF",
            color:         "#6B7280",
            fontSize:      12.5,
            fontWeight:    500,
            cursor:        loggingOut ? "not-allowed" : "pointer",
            transition:    "all 0.22s cubic-bezier(.4,0,.2,1)",
            fontFamily:    "inherit",
            opacity:       loggingOut ? 0.5 : 1,
            letterSpacing: "-0.01em",
          }}
          onMouseEnter={(e) => {
            if (!loggingOut) {
              (e.currentTarget).style.background   = "rgba(220,38,38,0.05)";
              (e.currentTarget).style.color        = "#DC2626";
              (e.currentTarget).style.borderColor  = "rgba(220,38,38,0.15)";
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget).style.background  = "#FFFFFF";
            (e.currentTarget).style.color       = "#6B7280";
            (e.currentTarget).style.borderColor = "rgba(0,0,0,0.07)";
          }}
        >
          <IconSignOut />
          {loggingOut ? "Signing out…" : "Sign out"}
        </button>
      </div>
      
      {/* Media query styles for responsive hamburger menu */}
      <style jsx>{`
        @media (min-width: 1024px) {
          .mobile-only {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
}
