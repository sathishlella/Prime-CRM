"use client";

import { useState } from "react";
import type { Role } from "@/lib/supabase/database.types";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import ToastContainer from "@/components/Toast";

interface Profile {
  id:         string;
  full_name:  string;
  role:       Role;
  avatar_url: string | null;
}

export default function DashboardShell({
  profile,
  children,
}: {
  profile:  Profile;
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div
      style={{
        minHeight:  "100vh",
        display:    "flex",
        fontFamily: "'Inter', 'Outfit', system-ui, sans-serif",
        position:   "relative",
        background: "linear-gradient(160deg, #F7F9FC 0%, #F5F8FD 50%, #F3F6FB 100%)",
      }}
    >
      {/* Subtle ambient blobs — very low opacity for premium feel */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{
          position:   "absolute",
          width:      600,
          height:     600,
          top:        "-10%",
          right:      "-8%",
          background: "radial-gradient(circle, rgba(10,110,189,0.04) 0%, transparent 65%)",
          animation:  "blobA 24s ease-in-out infinite",
          willChange: "transform",
        }} />
        <div style={{
          position:   "absolute",
          width:      500,
          height:     500,
          bottom:     "-6%",
          left:       "5%",
          background: "radial-gradient(circle, rgba(5,150,105,0.03) 0%, transparent 65%)",
          animation:  "blobB 30s ease-in-out infinite",
          willChange: "transform",
        }} />
        <div style={{
          position:   "absolute",
          width:      380,
          height:     380,
          top:        "38%",
          left:       "50%",
          background: "radial-gradient(circle, rgba(124,58,237,0.025) 0%, transparent 65%)",
          animation:  "blobC 18s ease-in-out infinite",
          willChange: "transform",
        }} />
      </div>

      {/* Sidebar */}
      <Sidebar
        role={profile.role}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      {/* Main column */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, position: "relative", zIndex: 1 }}>
        <TopBar
          user={profile}
          onMenuClick={() => setMobileMenuOpen(true)}
        />
        <main style={{ flex: 1, padding: "clamp(14px,3vw,32px) clamp(14px,3vw,32px) 64px", overflow: "visible" }}>
          {children}
        </main>
      </div>

      <ToastContainer />
    </div>
  );
}
