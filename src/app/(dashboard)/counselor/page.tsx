import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import CounselorDashboardClient from "./CounselorDashboardClient";

export default async function CounselorPage() {
  const supabase = createServerClient();

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", session.user.id)
    .single();

  if (!profile || profile.role !== "counselor") redirect("/login");

  const { data: rawStudents = [] } = await supabase
    .from("students")
    .select(`
      id, profile_id, status, university, major,
      profile:profiles!profile_id(id, full_name, email, avatar_url)
    `)
    .eq("assigned_counselor_id", session.user.id)
    .eq("status", "active");

  const students = (rawStudents as any[]).map((s: any) => ({
    ...s,
    profile: Array.isArray(s.profile) ? s.profile[0] : s.profile,
  }));

  const studentIds = students.map((s) => s.id);

  const [appsRes, matchesRes] = await Promise.all([
    studentIds.length
      ? supabase
          .from("applications")
          .select("id, student_id, status")
          .in("student_id", studentIds)
      : Promise.resolve({ data: [] as Array<{ id: string; student_id: string; status: string }> }),
    studentIds.length
      ? supabase
          .from("job_matches")
          .select("id, student_id, overall_score, grade, match_status")
          .in("student_id", studentIds)
      : Promise.resolve({ data: [] as Array<{ id: string; student_id: string; overall_score: number; grade: string; match_status: string }> }),
  ]);

  const apps = (appsRes.data ?? []) as Array<{ id: string; student_id: string; status: string }>;
  const matches = (matchesRes.data ?? []) as Array<{
    id: string;
    student_id: string;
    overall_score: number;
    grade: string;
    match_status: string;
  }>;

  const cards: CounselorStudentCard[] = students.map((s) => {
    const sApps = apps.filter((a) => a.student_id === s.id);
    const sMatches = matches.filter((m) => m.student_id === s.id);
    const gradeA = sMatches.filter((m) => m.grade?.startsWith("A")).length;
    const gradeB = sMatches.filter((m) => m.grade?.startsWith("B")).length;
    const topMatch = sMatches
      .filter((m) => ["new", "reviewed"].includes(m.match_status))
      .sort((a, b) => (b.overall_score || 0) - (a.overall_score || 0))[0];
    return {
      id: s.id,
      profile_id: s.profile_id,
      full_name: s.profile?.full_name ?? "Unknown",
      email: s.profile?.email ?? "",
      avatar_url: s.profile?.avatar_url ?? null,
      university: s.university,
      major: s.major,
      applications: sApps.length,
      interviews: sApps.filter((a) => a.status === "interview").length,
      offers: sApps.filter((a) => a.status === "offered").length,
      matches_total: sMatches.length,
      grade_a: gradeA,
      grade_b: gradeB,
      top_score: topMatch?.overall_score ?? null,
      top_grade: topMatch?.grade ?? null,
    };
  });

  return (
    <CounselorDashboardClient
      counselorName={profile.full_name}
      students={cards}
    />
  );
}

export interface CounselorStudentCard {
  id: string;
  profile_id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  university: string | null;
  major: string | null;
  applications: number;
  interviews: number;
  offers: number;
  matches_total: number;
  grade_a: number;
  grade_b: number;
  top_score: number | null;
  top_grade: string | null;
}
