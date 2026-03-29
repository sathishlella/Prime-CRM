import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";

export default async function StudentDocumentsPage() {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", session.user.id).single();
  if (!profile || profile.role !== "student") redirect("/login");

  const { data: student } = await supabase
    .from("students").select("id").eq("profile_id", session.user.id).single();

  const { data: docs = [] } = student
    ? await supabase
        .from("documents")
        .select("id, file_name, file_url, file_type, created_at, uploaded_by_profile:profiles!uploaded_by(full_name)")
        .eq("student_id", student.id)
        .order("created_at", { ascending: false })
    : { data: [] };

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1e293b", margin: "0 0 4px" }}>
        My Documents
      </h2>
      <p style={{ fontSize: 13, color: "#94a3b8", margin: "0 0 24px" }}>
        Resumes, cover letters and JDs uploaded by your counselor.
      </p>

      {(docs ?? []).length === 0 ? (
        <div style={{ background: "rgba(255,255,255,0.5)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.65)", borderRadius: 18, padding: "48px 20px", textAlign: "center", color: "#94a3b8", fontSize: 14 }}>
          No documents uploaded yet.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {(docs ?? []).map((doc: { id: string; file_name: string; file_type: string; created_at: string; uploaded_by_profile?: { full_name: string } | null }) => (
            <div key={doc.id} style={{ background: "rgba(255,255,255,0.5)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.65)", borderRadius: 14, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ fontSize: 22 }}>📄</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 650, color: "#1e293b" }}>{doc.file_name}</div>
                <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 2 }}>
                  {doc.file_type} · Uploaded by {(doc.uploaded_by_profile as { full_name: string } | null)?.full_name ?? "Counselor"} ·{" "}
                  {new Date(doc.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
