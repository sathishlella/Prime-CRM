import { createServerClient } from "@/lib/supabase/server";
import { withApi } from "@/lib/http/withApi";
import { assignLeadSchema } from "@/lib/http/zodSchemas";

export const POST = withApi(
  { schema: assignLeadSchema, requireRole: ["admin", "counselor"] },
  async ({ body, user, requestId, logger }) => {
    try {
      const { lead_id, student_id } = body;
      logger.info("assigning lead", { lead_id, student_id });

      const supabase = createServerClient();

      const { data: lead, error: leadError } = await supabase
        .from("job_leads")
        .select("*")
        .eq("id", lead_id)
        .single();

      if (leadError || !lead) {
        logger.warn("lead not found", { lead_id });
        return Response.json(
          { error: "NOT_FOUND", message: "Lead not found", requestId },
          { status: 404 }
        );
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
          applied_by: user.id,
        })
        .select("id")
        .single();

      if (appError) {
        logger.error("application insert failed", { error: appError.message });
        throw appError;
      }

      await supabase
        .from("job_leads")
        .update({
          status: "assigned",
          assigned_to: student_id,
          assigned_application_id: application?.id ?? null,
        })
        .eq("id", lead_id);

      logger.info("lead assigned", { lead_id, student_id, application_id: application?.id });
      return Response.json({ application_id: application?.id });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error("lead assign failed", { error: error.message, stack: error.stack });
      throw err;
    }
  }
);
