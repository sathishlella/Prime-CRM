"use client";

import { createClient } from "@/lib/supabase/client";
import type { ApplicationStatus } from "@/lib/supabase/database.types";
import {
  MOCK_APPLICATIONS,
  getMockStudentApplications,
  getMockCounselorApplications,
  type MockApplication,
} from "./mockData";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
const supabase = () => createClient();

// Demo mode: in-memory storage for new applications
let demoApplications = [...MOCK_APPLICATIONS];

// ─── Email helper (fire-and-forget — never blocks the UI) ─────────────────────
async function sendEmail(payload: Record<string, unknown>) {
  try {
    await fetch("/api/email", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });
  } catch {
    // Silently ignore — email is non-critical
  }
}

export async function createApplication(data: {
  student_id:       string;
  company_name:     string;
  job_role:         string;
  job_description?: string;
  job_link?:        string;
  resume_used?:     string;
  notes?:           string;
  applied_by?:      string;
  // Extra fields for email (not persisted to DB)
  studentEmail?:    string;
  studentName?:     string;
  counselorName?:   string;
}) {
  if (DEMO_MODE) {
    const newApp: MockApplication = {
      id:              `app-${Date.now()}`,
      student_id:      data.student_id,
      company_name:    data.company_name,
      job_role:        data.job_role,
      job_description: data.job_description || null,
      job_link:        data.job_link || null,
      resume_used:     data.resume_used || null,
      status:          "applied",
      applied_by:      data.applied_by || "00000000-0000-0000-0000-000000000002",
      applied_at:      new Date().toISOString(),
      updated_at:      new Date().toISOString(),
      notes:           data.notes || null,
      applied_by_profile: { id: "00000000-0000-0000-0000-000000000002", full_name: "Priya Sharma" },
    };
    demoApplications.unshift(newApp);
    return { data: newApp, error: null };
  }

  const { data: { session } } = await supabase().auth.getSession();
  const applied_by = data.applied_by || session?.user.id;

  if (!applied_by) {
    return { data: null, error: new Error("Not authenticated") };
  }

  // Strip email-only fields before DB insert
  const { studentEmail: _se, studentName: _sn, counselorName: _cn, ...dbData } = data;

  const { data: app, error } = await supabase()
    .from("applications")
    .insert({ ...dbData, applied_by, status: "applied" } as any)
    .select()
    .single();

  // Fire notification email to student (non-blocking) — route does its own DB lookup
  if (!error && app) {
    sendEmail({ type: "new_application", appId: app.id });
  }

  return { data: app, error };
}

export async function updateApplicationStatus(id: string, status: ApplicationStatus) {
  if (DEMO_MODE) {
    const appIndex = demoApplications.findIndex((a) => a.id === id);
    if (appIndex >= 0) {
      demoApplications[appIndex] = {
        ...demoApplications[appIndex],
        status,
        updated_at: new Date().toISOString(),
      };
      return { data: demoApplications[appIndex], error: null };
    }
    return { data: null, error: new Error("Application not found") };
  }

  // Capture old status before updating (needed for email)
  const { data: current } = await supabase()
    .from("applications")
    .select("status")
    .eq("id", id)
    .single();

  const oldStatus = current?.status ?? "applied";

  const { data, error } = await supabase()
    .from("applications")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  // Fire status change email (non-blocking) — route does its own DB lookup
  if (!error && data) {
    sendEmail({ type: "status_change", appId: id, newStatus: status, oldStatus });
  }

  return { data, error };
}

export async function getApplicationsByStudent(studentId: string) {
  if (DEMO_MODE) {
    return { data: getMockStudentApplications(studentId), error: null };
  }

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

export async function getApplicationsForCounselor(counselorId: string) {
  if (DEMO_MODE) {
    return { data: getMockCounselorApplications(counselorId), error: null };
  }

  const { data, error } = await supabase()
    .from("applications")
    .select(`
      id, company_name, job_role, job_description,
      job_link, resume_used, status, applied_at, updated_at, notes,
      student:students!inner(id, full_name:profile_id(full_name)),
      applied_by_profile:profiles!applied_by(id, full_name)
    `)
    .order("applied_at", { ascending: false });

  return { data: data ?? [], error };
}

export async function getAllApplications() {
  if (DEMO_MODE) {
    return { data: demoApplications, error: null };
  }

  const { data, error } = await supabase()
    .from("applications")
    .select(`
      id, company_name, job_role, job_description,
      job_link, resume_used, status, applied_at, updated_at, notes,
      student:students!inner(id, profile_id(full_name, email)),
      applied_by_profile:profiles!applied_by(id, full_name)
    `)
    .order("applied_at", { ascending: false });

  return { data: data ?? [], error };
}
