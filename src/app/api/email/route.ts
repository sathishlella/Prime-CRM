import { NextRequest, NextResponse } from "next/server";
import { createServerClient, createAdminClient } from "@/lib/supabase/server";
import {
  sendWelcomeEmail,
  sendNewApplicationEmail,
  sendStatusChangeEmail,
  sendCounselorAssignedEmail,
} from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    // Verify caller is authenticated (admin or counselor)
    const supabase = createServerClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (!profile || !["admin", "counselor"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { type } = body;

    // Admin client bypasses RLS to read student email/profile
    const admin = createAdminClient();

    if (type === "welcome") {
      const { to, name, role, email } = body;
      if (!to || !name || !role || !email) {
        return NextResponse.json({ error: "Missing fields" }, { status: 400 });
      }
      await sendWelcomeEmail(to, { name, role, email });
    }

    else if (type === "new_application") {
      const { appId } = body;
      if (!appId) return NextResponse.json({ error: "Missing appId" }, { status: 400 });

      // Look up everything we need from the DB
      const { data: app } = await admin
        .from("applications")
        .select(`
          company_name, job_role, job_link,
          student:students!inner(profile_id(full_name, email)),
          counselor:profiles!applied_by(full_name)
        `)
        .eq("id", appId)
        .single();

      if (!app) return NextResponse.json({ error: "Application not found" }, { status: 404 });

      const studentProfile = (app.student as any)?.profile_id as { full_name: string; email: string } | null;
      const counselorProfile = (app.counselor as any) as { full_name: string } | null;

      if (!studentProfile?.email) {
        return NextResponse.json({ ok: false, message: "No student email found" });
      }

      await sendNewApplicationEmail(studentProfile.email, {
        studentName:   studentProfile.full_name ?? "Student",
        counselorName: counselorProfile?.full_name ?? "Your counselor",
        companyName:   app.company_name,
        jobRole:       app.job_role,
        jobLink:       app.job_link ?? null,
      });
    }

    else if (type === "status_change") {
      const { appId, newStatus, oldStatus } = body;
      if (!appId || !newStatus || !oldStatus) {
        return NextResponse.json({ error: "Missing fields" }, { status: 400 });
      }

      const { data: app } = await admin
        .from("applications")
        .select(`
          company_name, job_role,
          student:students!inner(profile_id(full_name, email))
        `)
        .eq("id", appId)
        .single();

      if (!app) return NextResponse.json({ error: "Application not found" }, { status: 404 });

      const studentProfile = (app.student as any)?.profile_id as { full_name: string; email: string } | null;

      if (!studentProfile?.email) {
        return NextResponse.json({ ok: false, message: "No student email found" });
      }

      await sendStatusChangeEmail(studentProfile.email, {
        studentName: studentProfile.full_name ?? "Student",
        companyName: app.company_name,
        jobRole:     app.job_role,
        oldStatus,
        newStatus,
      });
    }

    else if (type === "counselor_assigned") {
      const { studentId, counselorId } = body;
      if (!studentId || !counselorId) {
        return NextResponse.json({ error: "Missing studentId or counselorId" }, { status: 400 });
      }

      // Look up student and counselor details
      const { data: student } = await admin
        .from("students")
        .select(`
          profile_id(full_name, email)
        `)
        .eq("id", studentId)
        .single();

      const { data: counselor } = await admin
        .from("profiles")
        .select("full_name, email")
        .eq("id", counselorId)
        .single();

      if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });
      if (!counselor) return NextResponse.json({ error: "Counselor not found" }, { status: 404 });

      const studentProfile = (student as any)?.profile_id as { full_name: string; email: string } | null;

      if (!studentProfile?.email) {
        return NextResponse.json({ ok: false, message: "No student email found" });
      }

      await sendCounselorAssignedEmail(studentProfile.email, {
        studentName:    studentProfile.full_name ?? "Student",
        counselorName:  counselor.full_name ?? "Your Counselor",
        counselorEmail: counselor.email ?? "counselor@f1dreamjobs.com",
      });
    }

    else {
      return NextResponse.json({ error: "Unknown type" }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[email route]", err);
    // Never let email failure crash the app
    return NextResponse.json({ ok: false, message: "Email failed silently" });
  }
}
