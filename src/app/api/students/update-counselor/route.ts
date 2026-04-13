import { createAdminClient } from "@/lib/supabase/server";
import { sendCounselorAssignedEmail } from "@/lib/email";
import { withApi } from "@/lib/http/withApi";
import { updateCounselorSchema } from "@/lib/http/zodSchemas";

export const POST = withApi(
  { schema: updateCounselorSchema, requireRole: ["admin"] },
  async ({ body, requestId, logger }) => {
    try {
      const { student_id: studentId, counselor_id: counselorId } = body;
      logger.info("updating counselor assignment", { studentId, counselorId: counselorId || null });

      const adminClient = createAdminClient();

      const { error } = await adminClient
        .from("students")
        .update({ assigned_counselor_id: counselorId || null })
        .eq("id", studentId);

      if (error) {
        logger.error("counselor update failed", { error: error.message });
        throw error;
      }

      // Fire-and-forget email notification
      try {
        const { data: student } = await adminClient
          .from("students")
          .select("profile_id(full_name, email)")
          .eq("id", studentId)
          .single();

        const { data: counselor } = counselorId
          ? await adminClient
              .from("profiles")
              .select("full_name, email")
              .eq("id", counselorId)
              .single()
          : { data: null };

        if (student && counselor) {
          const studentProfile = (student as any)?.profile_id as { full_name: string; email: string } | null;
          if (studentProfile?.email) {
            await sendCounselorAssignedEmail(studentProfile.email, {
              studentName: studentProfile.full_name ?? "Student",
              counselorName: counselor.full_name ?? "Your Counselor",
              counselorEmail: counselor.email ?? "counselor@f1dreamjobs.com",
            });
          }
        }
      } catch (emailErr) {
        logger.error("counselor assignment email failed", { error: String(emailErr) });
      }

      logger.info("counselor updated", { studentId });
      return Response.json({ success: true });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error("update-counselor failed", { error: error.message, stack: error.stack });
      throw err;
    }
  }
);
