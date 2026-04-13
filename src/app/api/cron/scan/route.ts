import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { scanPortals } from "@/lib/scanner";
import { createLogger } from "@/lib/logging/logger";
import { getRequestId } from "@/lib/logging/requestId";

export async function GET(req: NextRequest): Promise<Response> {
  const requestId = getRequestId(req);
  const logger = createLogger(requestId, "/api/cron/scan");

  try {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      logger.warn("invalid cron secret");
      return Response.json({ error: "UNAUTHORIZED", message: "Invalid cron secret", requestId }, { status: 401 });
    }

    logger.info("scanning job portals");

    const supabase = createAdminClient();
    const result = await scanPortals(supabase);

    logger.info("scan complete", { leads_found: result.leads_found || 0 });

    return Response.json(result);
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error("scan failed", { error: error.message, stack: error.stack });
    throw err;
  }
}
