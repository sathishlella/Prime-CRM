"use client";

import { createClient } from "@/lib/supabase/client";

const supabase = () => createClient();

export interface Notification {
  id:         string;
  user_id:    string;
  title:      string;
  message:    string;
  type:       string;
  is_read:    boolean;
  created_at: string;
}

export async function getNotifications(userId: string, limit = 30) {
  const { data, error } = await supabase()
    .from("notifications")
    .select("id, user_id, title, message, type, is_read, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return { data: (data ?? []) as Notification[], error };
}

export async function markNotificationRead(id: string) {
  const { error } = await supabase()
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id);
  return { error };
}

export async function markAllNotificationsRead(userId: string) {
  const { error } = await supabase()
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);
  return { error };
}
