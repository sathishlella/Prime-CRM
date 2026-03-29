import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import CreateUserClient from "./CreateUserClient";

export const metadata = { title: "Create Account | F1 Dream Jobs" };

export default async function CreateUserPage() {
  const supabase = createServerClient();

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single();

  if (!profile || profile.role !== "admin") redirect("/admin");

  // Fetch counselors for student assignment dropdown
  const { data: counselors = [] } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("role", "counselor")
    .eq("is_active", true)
    .order("full_name");

  return <CreateUserClient counselors={counselors ?? []} />;
}
