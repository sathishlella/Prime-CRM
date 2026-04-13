import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import AiCostsClient from "./AiCostsClient";

export default async function AdminAiCostsPage() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") redirect("/login");

  const { data: rows } = await supabase
    .from("ai_call_log")
    .select("feature, provider, model, input_tokens, output_tokens, cost_usd, latency_ms, created_at")
    .order("created_at", { ascending: false })
    .limit(2000);

  return (
    <AiCostsClient
      rows={(rows as any[]) || []}
    />
  );
}
