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
        minHeight:   "100vh",
        display:     "flex",
        fontFamily:  "'Outfit', system-ui, sans-serif",
        position:    "relative",
        background:  "linear-gradient(155deg, #f8faff 0%, #f0f5ff 40%, #f5f3ff 100%)",
      }}
    >
      {/* Blob background */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{ position: "absolute", width: 520, height: 520, top: "-8%", right: "-6%", background: "radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 70%)", animation: "blobA 20s ease-in-out infinite", willChange: "transform" }} />
        <div style={{ position: "absolute", width: 440, height: 440, bottom: "-4%", left: "10%",  background: "radial-gradient(circle, rgba(16,185,129,0.04) 0%, transparent 70%)", animation: "blobB 25s ease-in-out infinite", willChange: "transform" }} />
        <div style={{ position: "absolute", width: 320, height: 320, top: "40%",  left: "55%",  background: "radial-gradient(circle, rgba(139,92,246,0.03) 0%, transparent 70%)", animation: "blobC 17s ease-in-out infinite", willChange: "transform" }} />
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
        <main style={{ flex: 1, padding: "24px 28px 60px", overflowY: "auto" }}>
          {children}
        </main>
      </div>

      {/* Toast notifications */}
      <ToastContainer />
    </div>
  );
}
