"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUIStore } from "@/lib/stores/uiStore";
import Avatar from "@/components/Avatar";

interface Props {
  user: {
    id:         string;
    full_name:  string;
    role:       string;
    avatar_url?: string | null;
  };
  onMenuClick?: () => void;
}

export default function TopBar({ user, onMenuClick }: Props) {
  const router      = useRouter();
  const supabase    = createClient();
  const { addToast } = useUIStore();
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

  const roleColor: Record<string, string> = {
    admin:     "#8b5cf6",
    counselor: "#3b82f6",
    student:   "#10b981",
  };
  const color = roleColor[user.role] ?? "#3b82f6";

  return (
    <header
      style={{
        position:             "sticky",
        top:                  0,
        zIndex:               20,
        background:           "rgba(248,250,255,0.72)",
        backdropFilter:       "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom:         "1px solid rgba(255,255,255,0.5)",
        padding:              "10px 24px",
        display:              "flex",
        alignItems:           "center",
        justifyContent:       "space-between",
        gap:                  12,
      }}
    >
      {/* Left: hamburger (mobile) */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            style={{
              background: "none",
              border:     "none",
              cursor:     "pointer",
              fontSize:   20,
              color:      "#64748b",
              padding:    "2px 4px",
              display:    "flex",
              alignItems: "center",
            }}
            aria-label="Open menu"
          >
            ☰
          </button>
        )}
        {/* Brand (visible on mobile when sidebar hidden) */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width:           30,
              height:          30,
              borderRadius:    9,
              background:      "linear-gradient(135deg, #3b82f6, #10b981)",
              display:         "flex",
              alignItems:      "center",
              justifyContent:  "center",
              boxShadow:       "0 2px 8px rgba(59,130,246,0.2)",
            }}
          >
            <span style={{ color: "#fff", fontSize: 11, fontWeight: 800 }}>CP</span>
          </div>
        </div>
      </div>

      {/* Right: user + logout */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* User pill */}
        <div
          style={{
            display:     "flex",
            alignItems:  "center",
            gap:         8,
            padding:     "5px 10px 5px 5px",
            borderRadius: 12,
            background:  "rgba(255,255,255,0.5)",
            border:      "1px solid rgba(0,0,0,0.05)",
          }}
        >
          <Avatar initials={initials} size={26} color={color} src={user.avatar_url} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#1e293b", lineHeight: 1.2 }}>
              {user.full_name}
            </div>
            <div style={{ fontSize: 10, color, fontWeight: 600, textTransform: "capitalize" }}>
              {user.role}
            </div>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          style={{
            padding:     "7px 14px",
            borderRadius: 9,
            border:      "1px solid rgba(0,0,0,0.06)",
            background:  "rgba(255,255,255,0.5)",
            color:       "#64748b",
            fontSize:    11,
            fontWeight:  600,
            cursor:      loggingOut ? "not-allowed" : "pointer",
            transition:  "all 0.25s cubic-bezier(.4,0,.2,1)",
            fontFamily:  "inherit",
            opacity:     loggingOut ? 0.6 : 1,
          }}
          onMouseEnter={(e) => {
            if (!loggingOut) {
              (e.currentTarget).style.background = "rgba(239,68,68,0.07)";
              (e.currentTarget).style.color      = "#ef4444";
              (e.currentTarget).style.borderColor = "rgba(239,68,68,0.15)";
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget).style.background  = "rgba(255,255,255,0.5)";
            (e.currentTarget).style.color       = "#64748b";
            (e.currentTarget).style.borderColor = "rgba(0,0,0,0.06)";
          }}
        >
          {loggingOut ? "…" : "Logout"}
        </button>
      </div>
    </header>
  );
}
