import { createAdminClient } from "@/lib/supabase/server";
import {
  sendWelcomeEmail,
  sendNewApplicationEmail,
  sendStatusChangeEmail,
  sendCounselorAssignedEmail,
} from "@/lib/email";
import { withApi } from "@/lib/http/withApi";
import { emailSchema } from "@/lib/http/zodSchemas";

export const POST = withApi(
  { schema: emailSchema, requireRole: ["admin", "counselor"] },
  async ({ body, requestId, logger }) => {
    const admin = createAdminClient();
    const { type } = body;

    try {
      if (type === "welcome") {
        const { to, name, role, email } = body;
        await sendWelcomeEmail(to, { name, role, email });
      }

      else if (type === "new_application") {
        const { appId } = body;
        const { data: app } = await admin
          .from("applications")
          .select(`
            company_name, job_role, job_link,
            student:students!inner(profile_id(full_name, email)),
            counselor:profiles!applied_by(full_name)
          `)
          .eq("id", appId)
          .single();

        if (!app) {
          logger.warn("application not found for email", { appId });
          return Response.json(
            { error: "NOT_FOUND", message: "Application not found", requestId },
            { status: 404 }
          );
        }

        const studentProfile = (app.student as any)?.profile_id as { full_name: string; email: string } | null;
        const counselorProfile = (app.counselor as any) as { full_name: string } | null;

        if (!studentProfile?.email) {
          return Response.json({ ok: false, message: "No student email found" });
        }

        await sendNewApplicationEmail(studentProfile.email, {
          studentName: studentProfile.full_name ?? "Student",
          counselorName: counselorProfile?.full_name ?? "Your counselor",
          companyName: app.company_name,
          jobRole: app.job_role,
          jobLink: app.job_link ?? null,
        });
      }

      else if (type === "status_change") {
        const { appId, newStatus, oldStatus } = body;
        const { data: app } = await admin
          .from("applications")
          .select(`
            company_name, job_role,
            student:students!inner(profile_id(full_name, email))
          `)
          .eq("id", appId)
          .single();

        if (!app) {
          logger.warn("application not found for status_change email", { appId });
          return Response.json(
            { error: "NOT_FOUND", message: "Application not found", requestId },
            { status: 404 }
          );
        }

        const studentProfile = (app.student as any)?.profile_id as { full_name: string; email: string } | null;
        if (!studentProfile?.email) {
          return Response.json({ ok: false, message: "No student email found" });
        }

        await sendStatusChangeEmail(studentProfile.email, {
          studentName: studentProfile.full_name ?? "Student",
          companyName: app.company_name,
          jobRole: app.job_role,
          oldStatus,
          newStatus,
        });
      }

      else if (type === "counselor_assigned") {
        const { studentId, counselorId } = body;
        const { data: student } = await admin
          .from("students")
          .select("profile_id(full_name, email)")
          .eq("id", studentId)
          .single();

        const { data: counselor } = await admin
          .from("profiles")
          .select("full_name, email")
          .eq("id", counselorId)
          .single();

        if (!student) {
          logger.warn("student not found for counselor_assigned email", { studentId });
          return Response.json(
            { error: "NOT_FOUND", message: "Student not found", requestId },
            { status: 404 }
          );
        }
        if (!counselor) {
          logger.warn("counselor not found for counselor_assigned email", { counselorId });
          return Response.json(
            { error: "NOT_FOUND", message: "Counselor not found", requestId },
            { status: 404 }
          );
        }

        const studentProfile = (student as any)?.profile_id as { full_name: string; email: string } | null;
        if (!studentProfile?.email) {
          return Response.json({ ok: false, message: "No student email found" });
        }

        await sendCounselorAssignedEmail(studentProfile.email, {
          studentName: studentProfile.full_name ?? "Student",
          counselorName: counselor.full_name ?? "Your Counselor",
          counselorEmail: counselor.email ?? "counselor@f1dreamjobs.com",
        });
      }

      logger.info("email sent", { type });
      return Response.json({ ok: true });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error("email send failed", { type, error: error.message });
      // Never let email failure crash the app
      return Response.json({ ok: false, message: "Email failed silently" });
    }
  }
);
