import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import MatchClient from "./MatchClient";

export default async function CounselorMatchPage() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !["admin", "counselor"].includes(profile.role)) redirect("/login");

  let query = supabase.from("students").select("id, profile_id, university, visa_status, assigned_counselor_id, profiles!students_profile_id_fkey(full_name, email, avatar_url)");
  if (profile.role === "counselor") {
    query = query.eq("assigned_counselor_id", user.id);
  }
  const { data: students } = await query.order("created_at", { ascending: false });

  return (
    <MatchClient
      counselorId={user.id}
      role={profile.role}
      initialStudents={(students as any[]) || []}
    />
  );
}
