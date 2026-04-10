export async function getLeads(
  status?: "unassigned" | "assigned" | "expired",
  page = 1,
  limit = 20
) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status) params.set("status", status);

  const res = await fetch(`/api/leads?${params}`);
  if (!res.ok) throw new Error("Failed to fetch leads");
  return res.json() as Promise<{
    leads: Array<{
      id: string;
      company_name: string;
      job_title: string;
      job_url: string;
      source_portal: string;
      is_assigned: boolean;
      discovered_at: string;
    }>;
    total: number;
  }>;
}

export async function assignLead(leadId: string, studentId: string) {
  const res = await fetch("/api/leads/assign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lead_id: leadId, student_id: studentId }),
  });
  if (!res.ok) throw new Error("Failed to assign lead");
  return res.json();
}
