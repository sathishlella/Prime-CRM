import { createAdminClient } from "@/lib/supabase/server";
import { withApi } from "@/lib/http/withApi";
import { deleteUserSchema } from "@/lib/http/zodSchemas";

export const POST = withApi(
  { schema: deleteUserSchema, requireRole: ["admin"] },
  async ({ body, user, requestId, logger }) => {
    try {
      const { user_id: userId, role } = body;
      logger.info("deleting user", { userId, role });

      // Prevent admin from deleting themselves
      if (userId === user.id) {
        logger.warn("admin attempted self-deletion", { userId });
        return Response.json(
          { error: "FORBIDDEN", message: "Cannot delete your own account", requestId },
          { status: 400 }
        );
      }

      const adminClient = createAdminClient();

      if (role === "student") {
        const { error: applicationsError } = await adminClient
          .from("applications")
          .delete()
          .eq("student_id", userId);
        if (applicationsError) {
          logger.error("error deleting applications", { error: applicationsError.message });
        }

        const { error: documentsError } = await adminClient
          .from("documents")
          .delete()
          .eq("student_id", userId);
        if (documentsError) {
          logger.error("error deleting documents", { error: documentsError.message });
        }

        const { error: studentError } = await adminClient
          .from("students")
          .delete()
          .eq("id", userId);
        if (studentError) {
          logger.error("error deleting student record", { error: studentError.message });
          throw studentError;
        }
      }

      const { error: profileError } = await adminClient
        .from("profiles")
        .delete()
        .eq("id", userId);
      if (profileError) {
        logger.error("error deleting profile", { error: profileError.message });
        throw profileError;
      }

      const { error: authError } = await adminClient.auth.admin.deleteUser(userId);
      if (authError) {
        logger.error("error deleting auth user", { error: authError.message });
        throw authError;
      }

      logger.info("user deleted", { userId, role });
      return Response.json({ success: true, message: "User deleted successfully" });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error("user delete failed", { error: error.message, stack: error.stack });
      throw err;
    }
  }
);
