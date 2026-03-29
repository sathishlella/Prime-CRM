"use client";

import { createClient } from "@/lib/supabase/client";
import type { ApplicationStatus } from "@/lib/supabase/database.types";
import { 
  MOCK_APPLICATIONS, 
  getMockStudentApplications, 
  getMockCounselorApplications,
  getMockAllApplications,
  type MockApplication 
} from "./mockData";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
const supabase = () => createClient();

// Demo mode: in-memory storage for new applications
let demoApplications = [...MOCK_APPLICATIONS];

export async function createApplication(data: {
  student_id:      string;
  company_name:    string;
  job_role:        string;
  job_description?: string;
  job_link?:       string;
  resume_used?:    string;
  notes?:          string;
  applied_by?: string;
}) {
  if (DEMO_MODE) {
    const newApp: MockApplication = {
      id: `app-${Date.now()}`,
      student_id: data.student_id,
      company_name: data.company_name,
      job_role: data.job_role,
      job_description: data.job_description || null,
      job_link: data.job_link || null,
      resume_used: data.resume_used || null,
      status: "applied",
      applied_by: data.applied_by || "00000000-0000-0000-0000-000000000002",
      applied_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      notes: data.notes || null,
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

  const { data: app, error } = await supabase()
    .from("applications")
    .insert({
      ...data,
      applied_by,
      status: 'applied'
    } as any)
    .select()
    .single();

  return { data: app, error };
}

export async function updateApplicationStatus(id: string, status: ApplicationStatus) {
  if (DEMO_MODE) {
    const appIndex = demoApplications.findIndex(a => a.id === id);
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

  const { data, error } = await supabase()
    .from("applications")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  return { data, error };
}

export async function getApplicationsByStudent(studentId: string) {
  if (DEMO_MODE) {
    const apps = getMockStudentApplications(studentId);
    return { data: apps, error: null };
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
    const apps = getMockCounselorApplications(counselorId);
    return { data: apps, error: null };
  }

  // For real mode, this would use a more complex query
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
