import { createServerClient } from "@/lib/supabase/server";
import { withApi } from "@/lib/http/withApi";
import { recordApplicationSchema } from "@/lib/http/zodSchemas";

export const POST = withApi(
  {
    schema: recordApplicationSchema,
    requireRole: ["admin", "counselor"],
    rateLimit: { bucket: "match:record-application", limit: 60, windowMs: 60 * 60 * 1000 },
  },
  async ({ body, user, requestId, logger }) => {
    const { student_id, match_id } = body;
    const supabase = createServerClient();

    const { data: student } = await supabase
      .from("students")
      .select("id, assigned_counselor_id")
      .eq("id", student_id)
      .single();

    if (!student) {
      return Response.json(
        { error: "NOT_FOUND", message: "Student not found", requestId },
        { status: 404 }
      );
    }

    if (user.role === "counselor" && student.assigned_counselor_id !== user.id) {
      return Response.json(
        { error: "FORBIDDEN", message: "Not assigned to this student", requestId },
        { status: 403 }
      );
    }

    const { data: match } = await supabase
      .from("job_matches")
      .select(
        "id, job_lead_id, job_leads(company_name, job_role, job_description, job_url)"
      )
      .eq("id", match_id)
      .eq("student_id", student_id)
      .single();

    if (!match) {
      return Response.json(
        { error: "NOT_FOUND", message: "Match not found for this student", requestId },
        { status: 404 }
      );
    }

    const lead = Array.isArray(match.job_leads) ? match.job_leads[0] : match.job_leads;
    if (!lead) {
      return Response.json(
        { error: "NOT_FOUND", message: "Job lead missing", requestId },
        { status: 404 }
      );
    }

    const { data: existing } = await supabase
      .from("applications")
      .select("id")
      .eq("student_id", student_id)
      .eq("job_link", lead.job_url ?? "")
      .maybeSingle();

    if (existing) {
      logger.info("application already exists for this job", { match_id, app_id: existing.id });
      await supabase.from("job_matches").update({ match_status: "applied" }).eq("id", match_id);
      return Response.json({
        application_id: existing.id,
        job_url: lead.job_url,
        already_existed: true,
      });
    }

    const { data: app, error } = await supabase
      .from("applications")
      .insert({
        student_id,
        company_name: lead.company_name,
        job_role: lead.job_role,
        job_description: lead.job_description,
        job_link: lead.job_url,
        status: "applied",
        applied_by: user.id,
      } as any)
      .select("id")
      .single();

    if (error || !app) {
      logger.error("failed to record application", { error: error?.message });
      return Response.json(
        { error: "INSERT_FAILED", message: error?.message ?? "Insert failed", requestId },
        { status: 500 }
      );
    }

    await supabase.from("job_matches").update({ match_status: "applied" }).eq("id", match_id);
    await supabase.from("job_leads").update({ assigned_student_id: student_id } as any).eq("id", match.job_lead_id);

    logger.info("recorded application", { match_id, application_id: app.id });

    return Response.json({
      application_id: app.id,
      job_url: lead.job_url,
      already_existed: false,
    });
  }
);
