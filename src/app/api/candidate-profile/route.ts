import { createServerClient } from "@/lib/supabase/server";
import { withApi } from "@/lib/http/withApi";
import { candidateProfileSchema } from "@/lib/http/zodSchemas";

export const GET = withApi(
  { requireRole: ["admin", "counselor", "student"] },
  async ({ req, requestId, logger }) => {
    try {
      logger.info("fetching candidate profile", {});

      const supabase = createServerClient();
      const studentId = req.nextUrl.searchParams.get("student_id");
      if (!studentId) {
        logger.warn("missing student_id");
        return Response.json(
          { error: "MISSING_PARAM", message: "student_id required", requestId },
          { status: 400 }
        );
      }

      const { data, error } = await supabase
        .from("candidate_profiles")
        .select("*")
        .eq("student_id", studentId)
        .single();

      if (error && error.code !== "PGRST116") {
        logger.error("profile fetch failed", { error: error.message });
        throw error;
      }

      logger.info("candidate profile fetched", {});
      return Response.json({ profile: data || null });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error("candidate profile fetch failed", { error: error.message, stack: error.stack });
      throw err;
    }
  }
);

export const PUT = withApi(
  { schema: candidateProfileSchema, requireRole: ["admin", "counselor"] },
  async ({ body, requestId, logger }) => {
    try {
      logger.info("updating candidate profile", { student_id: body.student_id });

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
        logger.error("profile upsert failed", { error: error.message });
        throw error;
      }

      logger.info("candidate profile updated", { student_id });
      return Response.json({ profile: data });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error("candidate profile update failed", { error: error.message, stack: error.stack });
      throw err;
    }
  }
);
