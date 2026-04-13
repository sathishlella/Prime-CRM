import { createServerClient } from "@/lib/supabase/server";
import { withApi } from "@/lib/http/withApi";

export const GET = withApi(
  { requireRole: ["admin", "counselor"] },
  async ({ req, requestId, logger }) => {
    try {
      logger.info("fetching job leads", {});

      const supabase = createServerClient();
      const page = parseInt(req.nextUrl.searchParams.get("page") || "1");
      const limit = parseInt(req.nextUrl.searchParams.get("limit") || "20");
      const status = req.nextUrl.searchParams.get("status");

      let query = supabase
        .from("job_leads")
        .select("*", { count: "exact" })
        .order("discovered_at", { ascending: false });

      if (status === "unassigned") {
        query = query.eq("status", "new");
      } else if (status === "assigned") {
        query = query.eq("status", "assigned");
      } else if (status === "expired") {
        query = query.eq("status", "expired");
      }

      const from = (page - 1) * limit;
      query = query.range(from, from + limit - 1);

      const { data: leads, count, error } = await query;

      if (error) {
        logger.error("leads fetch failed", { error: error.message });
        throw error;
      }

      logger.info("leads fetched", { count: count ?? 0 });
      return Response.json({ leads: leads || [], total: count || 0 });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error("leads fetch failed", { error: error.message, stack: error.stack });
      throw err;
    }
  }
);
