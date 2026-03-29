"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUIStore } from "@/lib/stores/uiStore";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type Notification,
} from "@/lib/api/notifications";

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount:   number;
  markAsRead:    (id: string) => void;
  markAllRead:   () => void;
  isLoading:     boolean;
}

export function useNotifications(userId: string | null): UseNotificationsReturn {
  const supabase = createClient();
  const { addToast } = useUIStore();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading,     setIsLoading]     = useState(true);

  // Track last-seen count to detect new arrivals after initial load
  const initialLoadDone = useRef(false);

  // ── Initial fetch ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) { setIsLoading(false); return; }

    getNotifications(userId).then(({ data }) => {
      setNotifications(data);
      setIsLoading(false);
      initialLoadDone.current = true;
    });
  }, [userId]);

  // ── Realtime subscription ─────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        "postgres_changes" as any,
        {
          event:  "INSERT",
          schema: "public",
          table:  "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload: { new: Notification }) => {
          const n = payload.new;
          setNotifications((prev) => [n, ...prev]);

          // Fire a toast for every new notification after initial load
          if (initialLoadDone.current) {
            addToast(n.title, notifTypeToToast(n.type));
          }
        }
      )
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        "postgres_changes" as any,
        {
          event:  "UPDATE",
          schema: "public",
          table:  "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload: { new: Notification }) => {
          setNotifications((prev) =>
            prev.map((n) => (n.id === payload.new.id ? payload.new : n))
          );
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    markNotificationRead(id);
  }, []);

  const markAllRead = useCallback(() => {
    if (!userId) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    markAllNotificationsRead(userId);
  }, [userId]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return { notifications, unreadCount, markAsRead, markAllRead, isLoading };
}

function notifTypeToToast(type: string): "success" | "info" | "error" {
  if (type === "status_change")   return "success";
  if (type === "new_application") return "info";
  return "info";
}
