import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["admin", "counselor"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const page = parseInt(request.nextUrl.searchParams.get("page") || "1");
    const limit = parseInt(request.nextUrl.searchParams.get("limit") || "20");
    const status = request.nextUrl.searchParams.get("status"); // unassigned, assigned, expired

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
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
