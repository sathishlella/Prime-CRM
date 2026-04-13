import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { scanPortals } from "@/lib/scanner";
import { withApi } from "@/lib/infra/withApi";
import { logger } from "@/lib/infra/logger";

export const GET = withApi(
  async ({ req }) => {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      logger.warn({ route: "/api/cron/scan" }, "Invalid cron secret");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();
    const result = await scanPortals(supabase);
    return NextResponse.json(result);
  },
  { method: "GET", skipAuth: true }
);
