"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

type RealtimeEvent = "INSERT" | "UPDATE" | "DELETE" | "*";

interface UseRealtimeOptions<T extends Record<string, unknown>> {
  table:    string;
  event?:   RealtimeEvent;
  filter?:  string;           // e.g. "student_id=eq.abc123"
  onEvent:  (payload: { eventType: string; new: T; old: T }) => void;
}

export function useRealtime<T extends Record<string, unknown>>({
  table,
  event   = "*",
  filter,
  onEvent,
}: UseRealtimeOptions<T>) {
  const supabase   = createClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let channel = supabase.channel(`realtime:${table}:${filter ?? "all"}`);

    const config: Record<string, unknown> = { event, schema: "public", table };
    if (filter) config.filter = filter;

    channel = channel.on(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      "postgres_changes" as any,
      config,
      (payload: { eventType: string; new: T; old: T }) => {
        onEventRef.current(payload);
      }
    );

    channel.subscribe();
    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, table, event, filter]);
}
