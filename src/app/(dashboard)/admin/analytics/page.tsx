import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";

export default async function AdminAnalyticsPage() {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", session.user.id).single();
  if (!profile || profile.role !== "admin") redirect("/login");

  const { data: apps = [] } = await supabase
    .from("applications")
    .select("status, applied_at");

  const counts = (apps ?? []).reduce((acc: Record<string, number>, a: { status: string }) => {
    acc[a.status] = (acc[a.status] ?? 0) + 1;
    return acc;
  }, {});

  const STATUS_COLOR: Record<string, string> = {
    applied: "#3b82f6", in_progress: "#f59e0b",
    interview: "#10b981", rejected: "#ef4444", offered: "#8b5cf6",
  };

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1e293b", margin: "0 0 4px" }}>Analytics</h2>
      <p style={{ fontSize: 13, color: "#94a3b8", margin: "0 0 24px" }}>Application pipeline breakdown.</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px,1fr))", gap: 12 }}>
        {Object.entries(counts).map(([status, count]) => (
          <div key={status} style={{ background: "rgba(255,255,255,0.5)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.65)", borderRadius: 16, padding: "20px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: STATUS_COLOR[status] ?? "#1e293b" }}>{count as number}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "capitalize", marginTop: 4, letterSpacing: 0.4 }}>
              {status.replace("_", " ")}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
