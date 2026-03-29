"use server";

import { redirect } from "next/navigation";
import { createAdminClient, createServerClient } from "@/lib/supabase/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";

export type CreateUserState = {
  error?: string;
  success?: string;
};

export async function createUserAction(
  _prev: CreateUserState,
  formData: FormData
): Promise<CreateUserState> {
  // ── 1. Verify caller is admin ──────────────────────────────────────────────
  const server = createServerClient();
  const { data: { session } } = await server.auth.getSession();
  if (!session) return { error: "Not authenticated." };

  const { data: caller } = await server
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single();

  if (!caller || caller.role !== "admin") {
    return { error: "Only admins can create accounts." };
  }

  // ── 2. Parse form ──────────────────────────────────────────────────────────
  const full_name  = (formData.get("full_name")  as string)?.trim();
  const email      = (formData.get("email")       as string)?.trim().toLowerCase();
  const password   = (formData.get("password")    as string);
  const role       = (formData.get("role")        as string);
  const phone      = (formData.get("phone")       as string)?.trim() || null;
  const university = (formData.get("university")  as string)?.trim() || null;
  const major      = (formData.get("major")       as string)?.trim() || null;
  const visa_status= (formData.get("visa_status") as string)?.trim() || null;
  const grad_date  = (formData.get("graduation_date") as string) || null;
  const counselor_id = (formData.get("assigned_counselor_id") as string) || null;

  if (!full_name || !email || !password || !role) {
    return { error: "Name, email, password and role are required." };
  }
  if (!["admin", "counselor", "student"].includes(role)) {
    return { error: "Invalid role." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  // ── 3. Create auth user via service_role (no email confirmation needed) ────
  const adminAuth = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: authData, error: authError } = await adminAuth.auth.admin.createUser({
    email,
    password,
    email_confirm: true,          // instantly confirmed — no verification email
    user_metadata: { full_name, role },
  });

  if (authError || !authData?.user) {
    return { error: authError?.message ?? "Failed to create auth user." };
  }

  const userId = authData.user.id;

  // ── 4. Upsert profile (trigger may have already inserted it) ───────────────
  const admin = createAdminClient();
  const { error: profileError } = await admin
    .from("profiles")
    .upsert({
      id:        userId,
      full_name,
      email,
      role:      role as "admin" | "counselor" | "student",
      phone,
      is_active: true,
    });

  if (profileError) {
    // Roll back auth user if profile fails
    await adminAuth.auth.admin.deleteUser(userId);
    return { error: `Profile creation failed: ${profileError.message}` };
  }

  // ── 5. If student, create student record ───────────────────────────────────
  if (role === "student") {
    const { error: studentError } = await admin.from("students").insert({
      profile_id:            userId,
      assigned_counselor_id: counselor_id || null,
      university,
      major,
      graduation_date:       grad_date || null,
      visa_status,
      status:                "active",
    } as any);

    if (studentError) {
      return { error: `Student record failed: ${studentError.message}` };
    }
  }

  redirect("/admin?created=1");
}
