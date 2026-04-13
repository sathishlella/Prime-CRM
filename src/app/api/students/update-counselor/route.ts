import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendCounselorAssignedEmail } from "@/lib/email";
import { withApi } from "@/lib/infra/withApi";
import { updateCounselorSchema } from "@/lib/infra/zodSchemas";
import { logger } from "@/lib/infra/logger";

export const POST = withApi(
  async ({ body, requestId }) => {
    const { student_id: studentId, counselor_id: counselorId } = body;
    const adminClient = createAdminClient();

    const { error } = await adminClient
      .from("students")
      .update({ assigned_counselor_id: counselorId || null })
      .eq("id", studentId);

    if (error) {
      logger.error({ requestId, error: error.message }, "Error updating counselor");
      return NextResponse.json({ error: error.message }, { status: 500 });
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
    } catch (emailError) {
      logger.error({ requestId, error: String(emailError) }, "Failed to send counselor assignment email");
    }

    return NextResponse.json({ success: true });
  },
  { method: "POST", allowedRoles: ["admin"], bodySchema: updateCounselorSchema }
);
