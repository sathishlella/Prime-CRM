import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { withApi } from "@/lib/infra/withApi";
import { logger } from "@/lib/infra/logger";

export const GET = withApi(
  async ({ req, requestId }) => {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      logger.warn({ route: "/api/agent/digest", requestId }, "Invalid cron secret");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Find all active students
    const { data: students } = await supabase
      .from("students")
      .select("id, profile_id, assigned_counselor_id")
      .eq("status", "active");

    if (!students || students.length === 0) {
      return NextResponse.json({ sent: 0 });
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

      // In-app notification
      const { error: notifError } = await supabase.from("notifications").insert({
        user_id: student.profile_id,
        title,
        message,
        type: "match_digest",
        is_read: false,
      } as any);

      if (notifError) {
        logger.error({ requestId, studentId: student.id, error: notifError.message }, "Digest notification failed");
        continue;
      }

      // Mark matches as reviewed
      await supabase
        .from("job_matches")
        .update({ match_status: "reviewed" })
        .in(
          "id",
          matches.map((m) => m.id)
        );

      sent++;
    }

    return NextResponse.json({ sent });
  },
  { method: "GET", skipAuth: true }
);
