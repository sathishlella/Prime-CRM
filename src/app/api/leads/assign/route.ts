import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["admin", "counselor"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { lead_id, student_id } = body;

    if (!lead_id || !student_id) {
      return NextResponse.json(
        { error: "lead_id and student_id are required" },
        { status: 400 }
      );
    }

    // Fetch lead
    const { data: lead, error: leadError } = await supabase
      .from("job_leads")
      .select("*")
      .eq("id", lead_id)
      .single();

    if (leadError || !lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // Create application from lead
    const { data: application, error: appError } = await supabase
      .from("applications")
      .insert({
        student_id,
        company_name: lead.company_name,
        job_role: lead.job_role,
        job_description: lead.job_description,
        job_link: lead.job_url,
        status: "applied",
        applied_by: user.id,
      })
      .select("id")
      .single();

    if (appError) {
      return NextResponse.json({ error: appError.message }, { status: 500 });
    }

    // Mark lead as assigned
    await supabase
      .from("job_leads")
      .update({
        status: "assigned",
        assigned_to: student_id,
        assigned_application_id: application?.id ?? null,
      })
      .eq("id", lead_id);

    return NextResponse.json({ application_id: application?.id });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
