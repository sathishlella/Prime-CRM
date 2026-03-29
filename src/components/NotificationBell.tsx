"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNotifications } from "@/lib/hooks/useNotifications";
import type { Notification } from "@/lib/api/notifications";

const TYPE_ICON: Record<string, string> = {
  new_application: "📨",
  status_change:   "🔄",
  document:        "📄",
  offer:           "🎉",
  info:            "ℹ️",
};

const TYPE_COLOR: Record<string, string> = {
  new_application: "#3b82f6",
  status_change:   "#10b981",
  document:        "#f59e0b",
  offer:           "#8b5cf6",
  info:            "#64748b",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  < 1)  return "just now";
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

  // Bounce badge when a new notification arrives
  useEffect(() => {
    if (unreadCount > prevUnread.current) {
      setBounced(true);
      setTimeout(() => setBounced(false), 600);
    }
    prevUnread.current = unreadCount;
  }, [unreadCount]);

  // Close dropdown when clicking outside
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
          border:         "1px solid rgba(0,0,0,0.06)",
          background:     open ? "rgba(59,130,246,0.08)" : "rgba(255,255,255,0.5)",
          cursor:         "pointer",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          fontSize:       17,
          transition:     "all 0.22s cubic-bezier(.4,0,.2,1)",
          flexShrink:     0,
        }}
        aria-label="Notifications"
      >
        🔔

        {/* Unread badge */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.div
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: bounced ? [1, 1.35, 1] : 1 }}
              exit={{ scale: 0 }}
              transition={{ duration: bounced ? 0.45 : 0.2, ease: [0.4, 0, 0.2, 1] }}
              style={{
                position:        "absolute",
                top:             -4,
                right:           -4,
                minWidth:        17,
                height:          17,
                borderRadius:    9,
                background:      "linear-gradient(135deg, #ef4444, #dc2626)",
                color:           "#fff",
                fontSize:        9,
                fontWeight:      800,
                display:         "flex",
                alignItems:      "center",
                justifyContent:  "center",
                padding:         "0 4px",
                border:          "2px solid rgba(248,250,255,0.9)",
                lineHeight:      1,
                pointerEvents:   "none",
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
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1   }}
            exit={{   opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            style={{
              position:             "absolute",
              top:                  "calc(100% + 10px)",
              right:                0,
              zIndex:               80,
              width:                340,
              maxHeight:            460,
              background:           "rgba(255,255,255,0.92)",
              backdropFilter:       "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              border:               "1px solid rgba(255,255,255,0.72)",
              borderRadius:         18,
              boxShadow:            "0 12px 40px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.05)",
              overflow:             "hidden",
              display:              "flex",
              flexDirection:        "column",
            }}
          >
            {/* Header */}
            <div style={{ padding: "14px 16px 10px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(0,0,0,0.05)", flexShrink: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: "#1e293b" }}>
                Notifications
                {unreadCount > 0 && (
                  <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 6, background: "rgba(59,130,246,0.1)", color: "#3b82f6" }}>
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  style={{ fontSize: 11, fontWeight: 600, color: "#3b82f6", background: "none", border: "none", cursor: "pointer", padding: "2px 6px", borderRadius: 6, fontFamily: "inherit", transition: "background 0.18s" }}
                  onMouseEnter={(e) => { (e.currentTarget).style.background = "rgba(59,130,246,0.07)"; }}
                  onMouseLeave={(e) => { (e.currentTarget).style.background = "none"; }}
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* Notification list */}
            <div style={{ overflowY: "auto", flex: 1 }}>
              {notifications.length === 0 ? (
                <div style={{ padding: "40px 20px", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>🔔</div>
                  No notifications yet
                </div>
              ) : (
                notifications.map((n, i) => (
                  <NotificationItem
                    key={n.id}
                    notification={n}
                    index={i}
                    onRead={() => { markAsRead(n.id); }}
                  />
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
  const icon  = TYPE_ICON[n.type]  ?? "ℹ️";
  const color = TYPE_COLOR[n.type] ?? "#64748b";

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0  }}
      transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1], delay: index * 0.03 }}
      onClick={onRead}
      style={{
        display:    "flex",
        gap:        12,
        padding:    "12px 16px",
        cursor:     "pointer",
        background: n.is_read ? "transparent" : "rgba(59,130,246,0.035)",
        borderBottom: "1px solid rgba(0,0,0,0.035)",
        transition: "background 0.18s",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "rgba(59,130,246,0.05)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = n.is_read ? "transparent" : "rgba(59,130,246,0.035)"; }}
    >
      {/* Icon */}
      <div style={{ width: 34, height: 34, borderRadius: 10, background: `${color}12`, border: `1px solid ${color}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>
        {icon}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
          <div style={{ fontSize: 13, fontWeight: n.is_read ? 500 : 700, color: "#1e293b", lineHeight: 1.3 }}>
            {n.title}
          </div>
          {!n.is_read && (
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#3b82f6", flexShrink: 0, marginTop: 3 }} />
          )}
        </div>
        <div style={{ fontSize: 12, color: "#64748b", marginTop: 3, lineHeight: 1.4 }}>
          {n.message}
        </div>
        <div style={{ fontSize: 10.5, color: "#94a3b8", marginTop: 5, fontWeight: 500 }}>
          {timeAgo(n.created_at)}
        </div>
      </div>
    </motion.div>
  );
}
