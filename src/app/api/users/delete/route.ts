import { NextRequest, NextResponse } from "next/server";
import { createServerClient, createAdminClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated and is admin
    const supabase = createServerClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    // Parse request body
    const { userId, role } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Prevent admin from deleting themselves
    if (userId === session.user.id) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
    }

    // Use admin client to bypass RLS
    const adminClient = createAdminClient();

    // Delete role-specific data first (due to foreign key constraints)
    if (role === "student") {
      // Delete student's applications first
      const { error: applicationsError } = await adminClient
        .from("applications")
        .delete()
        .eq("student_id", userId);

      if (applicationsError) {
        console.error("Error deleting applications:", applicationsError);
        // Continue anyway - might not have applications
      }

      // Delete student's documents
      const { error: documentsError } = await adminClient
        .from("documents")
        .delete()
        .eq("student_id", userId);

      if (documentsError) {
        console.error("Error deleting documents:", documentsError);
      }

      // Delete from students table
      const { error: studentError } = await adminClient
        .from("students")
        .delete()
        .eq("id", userId);

      if (studentError) {
        console.error("Error deleting student record:", studentError);
        return NextResponse.json({ error: studentError.message }, { status: 500 });
      }
    }

    // Delete from profiles table
    const { error: profileError } = await adminClient
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (profileError) {
      console.error("Error deleting profile:", profileError);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    // Delete from Supabase Auth
    const { error: authError } = await adminClient.auth.admin.deleteUser(userId);

    if (authError) {
      console.error("Error deleting auth user:", authError);
      return NextResponse.json({ error: authError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
