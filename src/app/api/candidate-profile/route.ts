import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { withApi } from "@/lib/infra/withApi";
import { candidateProfileSchema } from "@/lib/infra/zodSchemas";

export const GET = withApi(
  async ({ req }) => {
    const supabase = createServerClient();
    const studentId = req.nextUrl.searchParams.get("student_id");
    if (!studentId) {
      return NextResponse.json({ error: "student_id required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("candidate_profiles")
      .select("*")
      .eq("student_id", studentId)
      .single();

    if (error && error.code !== "PGRST116") {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ profile: data || null });
  },
  { method: "GET", allowedRoles: ["admin", "counselor", "student"] }
);

export const PUT = withApi(
  async ({ body }) => {
    const supabase = createServerClient();
    const { student_id, ...profileData } = body;

    const upsertData = {
      student_id,
      cv_markdown: profileData.cv_markdown ?? null,
      target_roles: profileData.target_roles ?? null,
      skills: profileData.skills ?? null,
      deal_breakers: profileData.deal_breakers ?? null,
      narrative: profileData.narrative ?? null,
      location_preference: profileData.location_preference ?? null,
      proof_points: null,
      compensation_target: null,
    };

    const { data, error } = await supabase
      .from("candidate_profiles")
      .upsert(upsertData as any, { onConflict: "student_id" })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ profile: data });
  },
  { method: "PUT", allowedRoles: ["admin", "counselor"], bodySchema: candidateProfileSchema }
);
