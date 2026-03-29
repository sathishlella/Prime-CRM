import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import AdminDashboardClient from "./AdminDashboardClient";
import type { ApplicationStatus } from "@/lib/supabase/database.types";

export default async function AdminPage() {
  const supabase = createServerClient();

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", session.user.id)
    .single();

  if (!profile || profile.role !== "admin") redirect("/login");

  // All profiles
  const { data: allProfiles = [] } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, avatar_url, is_active, created_at")
    .order("created_at");

  // All students with counselor info
  const { data: rawStudents = [] } = await supabase
    .from("students")
    .select(`
      id, profile_id, status, university, major, graduation_date, visa_status,
      profile:profiles!profile_id(id, full_name, email, avatar_url),
      counselor:profiles!assigned_counselor_id(id, full_name)
    `)
    .order("created_at");

  // Transform students to extract single profile/counselor from arrays
  const allStudents = (rawStudents as any[]).map((s: any) => ({
    ...s,
    profile: Array.isArray(s.profile) ? s.profile[0] : s.profile,
    counselor: Array.isArray(s.counselor) ? s.counselor[0] : s.counselor,
  }));

  // All applications
  const { data: rawApplications = [] } = await supabase
    .from("applications")
    .select(`
      id, student_id, company_name, job_role, status, applied_at, updated_at,
      applied_by_profile:profiles!applied_by(id, full_name)
    `)
    .order("applied_at", { ascending: false });

  // Transform applications to extract single applied_by_profile from arrays
  const allApplications = (rawApplications as any[]).map((a: any) => ({
    ...a,
    applied_by_profile: Array.isArray(a.applied_by_profile) ? a.applied_by_profile[0] : a.applied_by_profile,
  }));

  const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  const recentCount = (allApplications ?? []).filter(
    (a) => a.applied_at > twoDaysAgo
  ).length;

  return (
    <AdminDashboardClient
      allProfiles={(allProfiles ?? []) as AdminProfile[]}
      allStudents={(allStudents ?? []) as AdminStudent[]}
      allApplications={(allApplications ?? []) as AdminApplication[]}
      recentCount={recentCount}
    />
  );
}

export interface AdminProfile {
  id:         string;
  full_name:  string;
  email:      string;
  role:       "admin" | "counselor" | "student";
  avatar_url: string | null;
  is_active:  boolean;
  created_at: string;
}

export interface AdminStudent {
  id:              string;
  profile_id:      string;
  status:          string;
  university:      string | null;
  major:           string | null;
  graduation_date: string | null;
  visa_status:     string | null;
  profile:         { id: string; full_name: string; email: string; avatar_url: string | null };
  counselor:       { id: string; full_name: string } | null;
}

export interface AdminApplication {
  id:                  string;
  student_id:          string;
  company_name:        string;
  job_role:            string;
  status:              ApplicationStatus;
  applied_at:          string;
  updated_at:          string;
  applied_by_profile?: { id: string; full_name: string } | null;
}
