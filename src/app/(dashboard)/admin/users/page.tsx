import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import UsersManagementClient from "./UsersManagementClient";

export default async function AdminUsersPage() {
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
      id, profile_id, status, university, major, graduation_date, visa_status, assigned_counselor_id,
      profile:profiles!profile_id(id, full_name, email, avatar_url),
      counselor:profiles!assigned_counselor_id(id, full_name, email)
    `)
    .order("created_at");

  // Transform students
  const allStudents = (rawStudents as any[]).map((s: any) => ({
    ...s,
    profile: Array.isArray(s.profile) ? s.profile[0] : s.profile,
    counselor: Array.isArray(s.counselor) ? s.counselor[0] : s.counselor,
  }));

  // Get counselors for dropdown
  const counselors = (allProfiles ?? []).filter((p) => p.role === "counselor");

  return (
    <UsersManagementClient
      allProfiles={allProfiles ?? []}
      allStudents={allStudents ?? []}
      counselors={counselors}
    />
  );
}
