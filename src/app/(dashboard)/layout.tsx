import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import DashboardShell from "@/components/DashboardShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerClient();

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role, avatar_url")
    .eq("id", session.user.id)
    .single();

  if (!profile) redirect("/login");

  return (
    <DashboardShell profile={profile}>
      {children}
    </DashboardShell>
  );
}
