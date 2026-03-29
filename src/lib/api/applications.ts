"use client";

import { createClient } from "@/lib/supabase/client";
import type { ApplicationStatus } from "@/lib/supabase/database.types";

const supabase = () => createClient();

export async function createApplication(data: {
  student_id:      string;
  company_name:    string;
  job_role:        string;
  job_description?: string;
  job_link?:       string;
  resume_used?:    string;
  notes?:          string;
}) {
  const { data: app, error } = await supabase()
    .from("applications")
    .insert(data)
    .select()
    .single();

  return { data: app, error };
}

export async function updateApplicationStatus(id: string, status: ApplicationStatus) {
  const { data, error } = await supabase()
    .from("applications")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  return { data, error };
}

export async function getApplicationsByStudent(studentId: string) {
  const { data, error } = await supabase()
    .from("applications")
    .select(`
      id, company_name, job_role, job_description,
      job_link, resume_used, status, applied_at, updated_at, notes,
      applied_by_profile:profiles!applied_by(id, full_name)
    `)
    .eq("student_id", studentId)
    .order("applied_at", { ascending: false });

  return { data: data ?? [], error };
}
