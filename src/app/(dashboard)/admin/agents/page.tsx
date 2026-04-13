import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import AgentRunsViewer from "@/components/AgentRunsViewer";

export default async function AdminAgentsPage() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") redirect("/login");

  const { data: runs } = await supabase
    .from("agent_runs")
    .select("id, run_type, status, total_steps, completed_steps, failed_steps, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  const runIds = (runs || []).map((r) => r.id);
  const { data: steps } = runIds.length
    ? await supabase
        .from("agent_run_steps")
        .select("id, run_id, step_type, status, error, started_at, completed_at")
        .in("run_id", runIds)
        .order("started_at", { ascending: true })
    : { data: [] };

  return (
    <AgentRunsViewer
      runs={(runs as any[]) || []}
      steps={(steps as any[]) || []}
    />
  );
}
