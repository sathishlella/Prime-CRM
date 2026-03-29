import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";

export default async function CounselorPage() {
  const supabase = createServerClient();

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", session.user.id)
    .single();

  if (!profile || profile.role !== "counselor") redirect("/login");

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1e293b", margin: "0 0 4px" }}>
        Counselor Dashboard
      </h2>
      <p style={{ fontSize: 13, color: "#94a3b8", margin: "0 0 24px" }}>
        Manage your students' applications.
      </p>
      {/* Full implementation in Prompt 6 */}
    </div>
  );
}
