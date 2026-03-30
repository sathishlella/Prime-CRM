import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import {
  sendWelcomeEmail,
  sendNewApplicationEmail,
  sendStatusChangeEmail,
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

    if (type === "welcome") {
      const { to, name, role, email } = body;
      if (!to || !name || !role || !email) {
        return NextResponse.json({ error: "Missing fields" }, { status: 400 });
      }
      await sendWelcomeEmail(to, { name, role, email });
    }

    else if (type === "new_application") {
      const { to, studentName, counselorName, companyName, jobRole, jobLink } = body;
      if (!to || !studentName || !counselorName || !companyName || !jobRole) {
        return NextResponse.json({ error: "Missing fields" }, { status: 400 });
      }
      await sendNewApplicationEmail(to, { studentName, counselorName, companyName, jobRole, jobLink });
    }

    else if (type === "status_change") {
      const { to, studentName, companyName, jobRole, oldStatus, newStatus } = body;
      if (!to || !studentName || !companyName || !jobRole || !oldStatus || !newStatus) {
        return NextResponse.json({ error: "Missing fields" }, { status: 400 });
      }
      await sendStatusChangeEmail(to, { studentName, companyName, jobRole, oldStatus, newStatus });
    }

    else {
      return NextResponse.json({ error: "Unknown type" }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[email route]", err);
    // Never let email failure crash the app — return 200 with flag
    return NextResponse.json({ ok: false, message: "Email failed silently" });
  }
}
