import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";

// Full user management is handled in the Admin Dashboard (Users tab).
// This route redirects there.
export default async function AdminUsersPage() {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");
  redirect("/admin");
}
