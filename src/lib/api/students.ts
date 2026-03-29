"use client";

import { createClient } from "@/lib/supabase/client";

const supabase = () => createClient();

export interface StudentWithProfile {
  id:         string;
  profile_id: string;
  status:     string;
  university: string | null;
  major:      string | null;
  profile:    { id: string; full_name: string; email: string; avatar_url: string | null };
}

/** Counselor: fetch only their assigned students */
export async function getMyCounselorStudents(counselorId: string) {
  const { data, error } = await supabase()
    .from("students")
    .select(`
      id, profile_id, status, university, major,
      profile:profiles!profile_id(id, full_name, email, avatar_url)
    `)
    .eq("assigned_counselor_id", counselorId)
    .eq("status", "active")
    .order("created_at");

  return { data: (data ?? []) as StudentWithProfile[], error };
}

/** Admin: fetch all students with their counselor info */
export async function getAllStudents() {
  const { data, error } = await supabase()
    .from("students")
    .select(`
      id, profile_id, status, university, major,
      profile:profiles!profile_id(id, full_name, email, avatar_url),
      counselor:profiles!assigned_counselor_id(id, full_name)
    `)
    .order("created_at");

  return { data: data ?? [], error };
}
