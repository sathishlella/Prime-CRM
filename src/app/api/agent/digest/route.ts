import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { createLogger } from "@/lib/logging/logger";
import { getRequestId } from "@/lib/logging/requestId";

export async function GET(req: NextRequest): Promise<Response> {
  const requestId = getRequestId(req);
  const logger = createLogger(requestId, "/api/agent/digest");

  try {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      logger.warn("invalid cron secret");
      return Response.json(
        { error: "UNAUTHORIZED", message: "Invalid cron secret", requestId },
        { status: 401 }
      );
    }

    const supabase = createAdminClient();

    // Find all active students
    const { data: students } = await supabase
      .from("students")
      .select("id, profile_id, assigned_counselor_id")
      .eq("status", "active");

    if (!students || students.length === 0) {
      return Response.json({ sent: 0 });
    }

    let sent = 0;

    for (const student of students) {
      const { data: matches } = await supabase
        .from("job_matches")
        .select("id, overall_score, grade, job_leads(company_name, job_role)")
        .eq("student_id", student.id)
        .eq("match_status", "new")
        .order("overall_score", { ascending: false })
        .limit(3);

      if (!matches || matches.length === 0) continue;

      const companies = matches
        .map((m: any) => `${m.job_leads?.company_name || ""} - ${m.job_leads?.job_role || ""} (${m.grade})`)
        .join(", ");
      const title = `${matches.length} new job match${matches.length > 1 ? "es" : ""} for you`;
      const message = `Top picks: ${companies}. Review them with your counselor.`;

      const { error: notifError } = await supabase.from("notifications").insert({
        user_id: student.profile_id,
        title,
        message,
        type: "match_digest",
        is_read: false,
      } as any);

      if (notifError) {
        logger.error("digest notification failed", { studentId: student.id, error: notifError.message });
        continue;
      }

      // Mark matches as reviewed
      await supabase
        .from("job_matches")
        .update({ match_status: "reviewed" })
        .in("id", matches.map((m) => m.id));

      sent++;
    }

    logger.info("digest complete", { sent });
    return Response.json({ sent });
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error("digest failed", { error: error.message, stack: error.stack });
    throw err;
  }
}
