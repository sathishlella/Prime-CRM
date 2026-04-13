import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { withApi } from "@/lib/infra/withApi";

export const GET = withApi(
  async ({ req, user }) => {
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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ leads: leads || [], total: count || 0 });
  },
  { method: "GET", allowedRoles: ["admin", "counselor"] }
);
