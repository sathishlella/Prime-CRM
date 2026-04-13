import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { withApi } from "@/lib/infra/withApi";
import { deleteUserSchema } from "@/lib/infra/zodSchemas";
import { logger } from "@/lib/infra/logger";

export const POST = withApi(
  async ({ body, user, requestId }) => {
    const { user_id: userId, role } = body;

    // Prevent admin from deleting themselves
    if (userId === user!.id) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
    }

    const adminClient = createAdminClient();

    if (role === "student") {
      const { error: applicationsError } = await adminClient
        .from("applications")
        .delete()
        .eq("student_id", userId);
      if (applicationsError) {
        logger.error({ requestId, error: applicationsError.message }, "Error deleting applications");
      }

      const { error: documentsError } = await adminClient
        .from("documents")
        .delete()
        .eq("student_id", userId);
      if (documentsError) {
        logger.error({ requestId, error: documentsError.message }, "Error deleting documents");
      }

      const { error: studentError } = await adminClient
        .from("students")
        .delete()
        .eq("id", userId);
      if (studentError) {
        return NextResponse.json({ error: studentError.message }, { status: 500 });
      }
    }

    const { error: profileError } = await adminClient
      .from("profiles")
      .delete()
      .eq("id", userId);
    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    const { error: authError } = await adminClient.auth.admin.deleteUser(userId);
    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "User deleted successfully" });
  },
  { method: "POST", allowedRoles: ["admin"], bodySchema: deleteUserSchema }
);
