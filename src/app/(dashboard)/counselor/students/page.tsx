import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import Avatar from "@/components/Avatar";

export default async function CounselorStudentsPage() {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", session.user.id).single();
  if (!profile || profile.role !== "counselor") redirect("/login");

  const { data: students = [] } = await supabase
    .from("students")
    .select(`
      id, university, major, graduation_date, visa_status, status,
      profile:profiles!profile_id(id, full_name, email, avatar_url)
    `)
    .eq("assigned_counselor_id", session.user.id)
    .order("created_at");

  function ini(name: string) {
    return name.split(" ").map((n) => n[0] ?? "").slice(0, 2).join("").toUpperCase();
  }

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1e293b", margin: "0 0 4px" }}>My Students</h2>
      <p style={{ fontSize: 13, color: "#94a3b8", margin: "0 0 24px" }}>
        {(students ?? []).length} student{(students ?? []).length !== 1 ? "s" : ""} assigned to you.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: 14 }}>
        {(students ?? []).length === 0 ? (
          <div style={{ background: "rgba(255,255,255,0.5)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.65)", borderRadius: 18, padding: "40px 20px", textAlign: "center", color: "#94a3b8", fontSize: 14, gridColumn: "1/-1" }}>
            No students assigned yet.
          </div>
        ) : (
          (students ?? []).map((s: { id: string; university: string | null; major: string | null; graduation_date: string | null; visa_status: string | null; status: string; profile: { id: string; full_name: string; email: string; avatar_url: string | null } }) => (
            <div key={s.id} style={{ background: "rgba(255,255,255,0.5)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.65)", borderRadius: 18, padding: "20px", boxShadow: "0 4px 24px rgba(0,0,0,0.03)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <Avatar initials={ini(s.profile.full_name)} size={40} color="#10b981" src={s.profile.avatar_url} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>{s.profile.full_name}</div>
                  <div style={{ fontSize: 11.5, color: "#94a3b8" }}>{s.profile.email}</div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {[
                  ["🎓", s.university ?? "—"],
                  ["📚", s.major ?? "—"],
                  ["🌍", s.visa_status ?? "—"],
                  ["📅", s.graduation_date ? new Date(s.graduation_date).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "—"],
                ].map(([icon, val]) => (
                  <div key={icon} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "#475569" }}>
                    <span style={{ fontSize: 14 }}>{icon}</span>{val}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
