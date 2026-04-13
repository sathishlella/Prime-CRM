import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import {
  sendWelcomeEmail,
  sendNewApplicationEmail,
  sendStatusChangeEmail,
  sendCounselorAssignedEmail,
} from "@/lib/email";
import { withApi } from "@/lib/infra/withApi";
import { logger } from "@/lib/infra/logger";
import { z } from "zod";

const emailSchema = z.union([
  z.object({
    type: z.literal("welcome"),
    to: z.string().email(),
    name: z.string(),
    role: z.string(),
    email: z.string().email(),
  }),
  z.object({
    type: z.literal("new_application"),
    appId: z.string().uuid(),
  }),
  z.object({
    type: z.literal("status_change"),
    appId: z.string().uuid(),
    newStatus: z.string(),
    oldStatus: z.string(),
  }),
  z.object({
    type: z.literal("counselor_assigned"),
    studentId: z.string().uuid(),
    counselorId: z.string().uuid(),
  }),
]);

export const POST = withApi(
  async ({ body, requestId }) => {
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
          return NextResponse.json({ error: "Application not found" }, { status: 404 });
        }

        const studentProfile = (app.student as any)?.profile_id as { full_name: string; email: string } | null;
        const counselorProfile = (app.counselor as any) as { full_name: string } | null;

        if (!studentProfile?.email) {
          return NextResponse.json({ ok: false, message: "No student email found" });
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
          return NextResponse.json({ error: "Application not found" }, { status: 404 });
        }

        const studentProfile = (app.student as any)?.profile_id as { full_name: string; email: string } | null;
        if (!studentProfile?.email) {
          return NextResponse.json({ ok: false, message: "No student email found" });
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
          return NextResponse.json({ error: "Student not found" }, { status: 404 });
        }
        if (!counselor) {
          return NextResponse.json({ error: "Counselor not found" }, { status: 404 });
        }

        const studentProfile = (student as any)?.profile_id as { full_name: string; email: string } | null;
        if (!studentProfile?.email) {
          return NextResponse.json({ ok: false, message: "No student email found" });
        }

        await sendCounselorAssignedEmail(studentProfile.email, {
          studentName: studentProfile.full_name ?? "Student",
          counselorName: counselor.full_name ?? "Your Counselor",
          counselorEmail: counselor.email ?? "counselor@f1dreamjobs.com",
        });
      }

      return NextResponse.json({ ok: true });
    } catch (err) {
      logger.error({ requestId, error: String(err) }, "Email route error");
      // Never let email failure crash the app
      return NextResponse.json({ ok: false, message: "Email failed silently" });
    }
  },
  { method: "POST", allowedRoles: ["admin", "counselor"], bodySchema: emailSchema }
);
