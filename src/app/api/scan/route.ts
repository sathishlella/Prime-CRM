import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { scanPortals } from "@/lib/scanner";
import { withApi } from "@/lib/infra/withApi";

export const POST = withApi(
  async () => {
    const supabase = createServerClient();
    const result = await scanPortals(supabase);
    return NextResponse.json(result);
  },
  { method: "POST", allowedRoles: ["admin"], rateLimit: "scan" }
);
