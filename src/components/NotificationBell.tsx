"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNotifications } from "@/lib/hooks/useNotifications";
import type { Notification } from "@/lib/api/notifications";

// ─── SVG Icons ────────────────────────────────────────────────────────────────
function IconBell({ active }: { active?: boolean }) {
  return (
    <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
      <path
        d="M8.5 1.5C6 1.5 4 3.5 4 6v3.5L2.5 11h12L13 9.5V6c0-2.5-2-4.5-4.5-4.5Z"
        stroke={active ? "#0A6EBD" : "currentColor"}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={active ? "rgba(10,110,189,0.1)" : "none"}
      />
      <path d="M6.5 11.5a2 2 0 0 0 4 0" stroke={active ? "#0A6EBD" : "currentColor"} strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}

const TYPE_COLOR: Record<string, string> = {
  new_application: "#0A6EBD",
  status_change:   "#059669",
  document:        "#D97706",
  offer:           "#7C3AED",
  info:            "#6B7280",
};

const TYPE_LABEL: Record<string, string> = {
  new_application: "Application",
  status_change:   "Status Update",
  document:        "Document",
  offer:           "Offer",
  info:            "Info",
};

function timeAgo(iso: string): string {
  const diff  = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  < 1)  return "Just now";
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

interface NotificationBellProps {
  userId: string;
}

export default function NotificationBell({ userId }: NotificationBellProps) {
  const { notifications, unreadCount, markAsRead, markAllRead } = useNotifications(userId);
  const [open,    setOpen]    = useState(false);
  const [bounced, setBounced] = useState(false);
  const prevUnread = useRef(unreadCount);
  const panelRef   = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (unreadCount > prevUnread.current) {
      setBounced(true);
      setTimeout(() => setBounced(false), 600);
    }
    prevUnread.current = unreadCount;
  }, [unreadCount]);

  useEffect(() => {
    if (!open) return;
    function onOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  return (
    <div ref={panelRef} style={{ position: "relative" }}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          position:       "relative",
          width:          36,
          height:         36,
          borderRadius:   11,
          border:         "1px solid rgba(0,0,0,0.07)",
          background:     open ? "rgba(10,110,189,0.06)" : "#FFFFFF",
          cursor:         "pointer",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          color:          open ? "#0A6EBD" : "#6B7280",
          transition:     "all 0.22s cubic-bezier(.4,0,.2,1)",
          flexShrink:     0,
          boxShadow:      "0 1px 3px rgba(0,0,0,0.04)",
        }}
        aria-label="Notifications"
        onMouseEnter={(e) => {
          if (!open) {
            (e.currentTarget).style.background = "#F7F9FC";
            (e.currentTarget).style.color      = "#0A0F1E";
          }
        }}
        onMouseLeave={(e) => {
          if (!open) {
            (e.currentTarget).style.background = "#FFFFFF";
            (e.currentTarget).style.color      = "#6B7280";
          }
        }}
      >
        <IconBell active={open} />

        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.div
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: bounced ? [1, 1.3, 1] : 1 }}
              exit={{ scale: 0 }}
              transition={{ duration: bounced ? 0.4 : 0.2, ease: [0.4, 0, 0.2, 1] }}
              style={{
                position:       "absolute",
                top:            -3,
                right:          -3,
                minWidth:       16,
                height:         16,
                borderRadius:   8,
                background:     "#DC2626",
                color:          "#fff",
                fontSize:       9,
                fontWeight:     700,
                display:        "flex",
                alignItems:     "center",
                justifyContent: "center",
                padding:        "0 4px",
                border:         "2px solid #F7F9FC",
                lineHeight:     1,
                pointerEvents:  "none",
              }}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1   }}
            exit={{   opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            style={{
              position:             "absolute",
              top:                  "calc(100% + 10px)",
              right:                0,
              zIndex:               80,
              width:                340,
              maxHeight:            440,
              background:           "rgba(255,255,255,0.96)",
              backdropFilter:       "blur(40px)",
              WebkitBackdropFilter: "blur(40px)",
              border:               "1px solid rgba(0,0,0,0.07)",
              borderRadius:         18,
              boxShadow:            "0 12px 40px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.05)",
              overflow:             "hidden",
              display:              "flex",
              flexDirection:        "column",
            }}
          >
            {/* Header */}
            <div style={{
              padding:       "14px 16px 12px",
              display:       "flex",
              alignItems:    "center",
              justifyContent: "space-between",
              borderBottom:  "1px solid rgba(0,0,0,0.05)",
              flexShrink:    0,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13.5, fontWeight: 700, color: "#0A0F1E", letterSpacing: "-0.2px" }}>
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <span style={{
                    fontSize:     10,
                    fontWeight:   700,
                    padding:      "2px 7px",
                    borderRadius: 5,
                    background:   "rgba(10,110,189,0.08)",
                    color:        "#0A6EBD",
                    letterSpacing: "0.1px",
                  }}>
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  style={{
                    fontSize:    11,
                    fontWeight:  600,
                    color:       "#0A6EBD",
                    background:  "none",
                    border:      "none",
                    cursor:      "pointer",
                    padding:     "3px 8px",
                    borderRadius: 6,
                    fontFamily:  "inherit",
                    transition:  "background 0.15s",
                    letterSpacing: "-0.01em",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget).style.background = "rgba(10,110,189,0.06)"; }}
                  onMouseLeave={(e) => { (e.currentTarget).style.background = "none"; }}
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div style={{ overflowY: "auto", flex: 1 }}>
              {notifications.length === 0 ? (
                <div style={{ padding: "40px 20px", textAlign: "center" }}>
                  <div style={{
                    width:          40,
                    height:         40,
                    borderRadius:   14,
                    background:     "#F7F9FC",
                    border:         "1px solid rgba(0,0,0,0.06)",
                    display:        "flex",
                    alignItems:     "center",
                    justifyContent: "center",
                    margin:         "0 auto 12px",
                    color:          "#C4CADB",
                  }}>
                    <IconBell />
                  </div>
                  <div style={{ fontSize: 13, color: "#9CA3AF", fontWeight: 500 }}>No notifications yet</div>
                </div>
              ) : (
                notifications.map((n, i) => (
                  <NotificationItem key={n.id} notification={n} index={i} onRead={() => markAsRead(n.id)} />
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NotificationItem({
  notification: n,
  index,
  onRead,
}: {
  notification: Notification;
  index:        number;
  onRead:       () => void;
}) {
  const color = TYPE_COLOR[n.type] ?? "#6B7280";
  const typeLabel = TYPE_LABEL[n.type] ?? "Info";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1], delay: index * 0.025 }}
      onClick={onRead}
      style={{
        display:      "flex",
        gap:          12,
        padding:      "12px 16px",
        cursor:       "pointer",
        background:   n.is_read ? "transparent" : "rgba(10,110,189,0.025)",
        borderBottom: "1px solid rgba(0,0,0,0.04)",
        transition:   "background 0.15s",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "rgba(10,110,189,0.04)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = n.is_read ? "transparent" : "rgba(10,110,189,0.025)"; }}
    >
      {/* Type dot */}
      <div style={{
        width:          32,
        height:         32,
        borderRadius:   10,
        background:     `${color}10`,
        border:         `1px solid ${color}20`,
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        flexShrink:     0,
      }}>
        <div style={{ width: 7, height: 7, borderRadius: "50%", background: color }} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
          <div style={{ fontSize: 13, fontWeight: n.is_read ? 500 : 650, color: "#0A0F1E", lineHeight: 1.35, letterSpacing: "-0.01em" }}>
            {n.title}
          </div>
          {!n.is_read && (
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#0A6EBD", flexShrink: 0, marginTop: 4 }} />
          )}
        </div>
        <div style={{ fontSize: 11.5, color: "#6B7280", marginTop: 3, lineHeight: 1.4 }}>
          {n.message}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 5 }}>
          <span style={{ fontSize: 10, fontWeight: 600, color, background: `${color}10`, padding: "1px 6px", borderRadius: 4 }}>
            {typeLabel}
          </span>
          <span style={{ fontSize: 10.5, color: "#9CA3AF", fontWeight: 500 }}>
            {timeAgo(n.created_at)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
