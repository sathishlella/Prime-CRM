// Auto-generated types from Supabase schema.
// Run: npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/supabase/database.types.ts
// For now this provides the hand-crafted types matching the schema in Prompt 2.

export type Role = "admin" | "counselor" | "student";
export type ApplicationStatus = "applied" | "in_progress" | "interview" | "rejected" | "offered";
export type StudentStatus = "active" | "paused" | "completed";
export type DocumentType = "resume" | "cover_letter" | "jd" | "other";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: Role;
          full_name: string;
          email: string;
          phone: string | null;
          avatar_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["profiles"]["Row"], "created_at" | "updated_at"> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      students: {
        Row: {
          id: string;
          profile_id: string;
          university: string | null;
          major: string | null;
          graduation_date: string | null;
          visa_status: string | null;
          assigned_counselor_id: string | null;
          status: StudentStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["students"]["Row"], "created_at" | "updated_at"> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["students"]["Insert"]>;
      };
      applications: {
        Row: {
          id: string;
          student_id: string;
          company_name: string;
          job_role: string;
          job_description: string | null;
          job_link: string | null;
          resume_used: string | null;
          status: ApplicationStatus;
          applied_by: string;
          applied_at: string;
          updated_at: string;
          notes: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["applications"]["Row"], "id" | "applied_at" | "updated_at"> & {
          id?: string;
          applied_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["applications"]["Insert"]>;
      };
      activity_log: {
        Row: {
          id: string;
          application_id: string;
          action: string;
          performed_by: string;
          is_visible_to_student: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["activity_log"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["activity_log"]["Insert"]>;
      };
      documents: {
        Row: {
          id: string;
          student_id: string;
          file_name: string;
          file_url: string;
          file_type: DocumentType;
          uploaded_by: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["documents"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["documents"]["Insert"]>;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          type: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["notifications"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      role: Role;
      application_status: ApplicationStatus;
      student_status: StudentStatus;
      document_type: DocumentType;
    };
  };
}
