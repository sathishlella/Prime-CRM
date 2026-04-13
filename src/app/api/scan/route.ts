import { createServerClient } from "@/lib/supabase/server";
import { scanPortals } from "@/lib/scanner";
import { withApi } from "@/lib/http/withApi";

export const POST = withApi(
  { requireRole: ["admin"], rateLimit: { bucket: "scan", limit: 5, windowMs: 60 * 60 * 1000 } },
  async ({ logger }) => {
    try {
      logger.info("triggering manual scan", {});

      const supabase = createServerClient();
      const result = await scanPortals(supabase);

      logger.info("scan complete", { leads_found: (result as any).leads_found ?? 0 });
      return Response.json(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error("scan failed", { error: error.message, stack: error.stack });
      throw err;
    }
  }
);
