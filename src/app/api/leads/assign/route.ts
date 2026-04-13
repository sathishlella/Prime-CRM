import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { withApi } from "@/lib/infra/withApi";
import { assignLeadSchema } from "@/lib/infra/zodSchemas";

export const POST = withApi(
  async ({ body, user }) => {
    const supabase = createServerClient();
    const { lead_id, student_id } = body;

    const { data: lead, error: leadError } = await supabase
      .from("job_leads")
      .select("*")
      .eq("id", lead_id)
      .single();

    if (leadError || !lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const { data: application, error: appError } = await supabase
      .from("applications")
      .insert({
        student_id,
        company_name: lead.company_name,
        job_role: lead.job_role,
        job_description: lead.job_description,
        job_link: lead.job_url,
        status: "applied",
        applied_by: user!.id,
      })
      .select("id")
      .single();

    if (appError) {
      return NextResponse.json({ error: appError.message }, { status: 500 });
    }

    await supabase
      .from("job_leads")
      .update({
        status: "assigned",
        assigned_to: student_id,
        assigned_application_id: application?.id ?? null,
      })
      .eq("id", lead_id);

    return NextResponse.json({ application_id: application?.id });
  },
  { method: "POST", allowedRoles: ["admin", "counselor"], bodySchema: assignLeadSchema }
);
