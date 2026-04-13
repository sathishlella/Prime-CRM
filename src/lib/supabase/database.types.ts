// Auto-generated types from Supabase schema.
// Run: npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/supabase/database.types.ts
// For now this provides the hand-crafted types matching the schema in Prompt 2.

export type Role = "admin" | "counselor" | "student";
export type ApplicationStatus = "applied" | "in_progress" | "interview" | "rejected" | "offered";
export type StudentStatus = "active" | "paused" | "completed";
export type DocumentType = "resume" | "cover_letter" | "jd" | "other";
export type LeadStatus = "new" | "reviewed" | "assigned" | "dismissed";
export type LeadSource = "greenhouse" | "ashby" | "lever" | "workday" | "direct" | "other";

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
        Insert: Omit<
          Database["public"]["Tables"]["applications"]["Row"],
          "id" | "applied_at" | "updated_at" | "job_description" | "job_link" | "resume_used" | "notes"
        > & {
          id?: string;
          applied_at?: string;
          updated_at?: string;
          job_description?: string | null;
          job_link?: string | null;
          resume_used?: string | null;
          notes?: string | null;
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
      candidate_profiles: {
        Row: {
          id: string;
          student_id: string;
          cv_markdown: string | null;
          target_roles: string[] | null;
          skills: string[] | null;
          proof_points: Record<string, unknown> | null;
          compensation_target: Record<string, unknown> | null;
          deal_breakers: string[] | null;
          narrative: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["candidate_profiles"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["candidate_profiles"]["Insert"]>;
      };
      evaluation_scores: {
        Row: {
          id: string;
          application_id: string;
          student_id: string;
          overall_score: number;
          grade: string;
          archetype: string;
          recommendation: string;
          blocks: Record<string, unknown>;
          keywords: string[] | null;
          summary: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["evaluation_scores"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["evaluation_scores"]["Insert"]>;
      };
      generated_cvs: {
        Row: {
          id: string;
          student_id: string;
          application_id: string | null;
          company_name: string;
          job_role: string;
          pdf_path: string;
          pdf_url: string | null;
          page_count: number;
          keyword_coverage: number;
          format: string;
          content: Record<string, unknown> | null;
          created_by: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["generated_cvs"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["generated_cvs"]["Insert"]>;
      };
      interview_prep: {
        Row: {
          id: string;
          application_id: string;
          student_id: string;
          company_name: string;
          job_role: string;
          prep_data: Record<string, unknown>;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["interview_prep"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["interview_prep"]["Insert"]>;
      };
      job_leads: {
        Row: {
          id: string;
          company_name: string;
          job_role: string;
          job_url: string;
          job_description: string | null;
          location: string | null;
          source: LeadSource;
          source_id: string | null;
          status: LeadStatus;
          assigned_to: string | null;
          assigned_application_id: string | null;
          discovered_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["job_leads"]["Row"], "id" | "discovered_at" | "updated_at"> & {
          id?: string;
          discovered_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["job_leads"]["Insert"]>;
      };
      scan_history: {
        Row: {
          id: string;
          job_url: string;
          url_hash: string;
          company_name: string;
          source: LeadSource;
          scanned_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["scan_history"]["Row"], "id" | "scanned_at"> & {
          id?: string;
          scanned_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["scan_history"]["Insert"]>;
      };
      scanner_config: {
        Row: {
          id: string;
          company_name: string;
          careers_url: string | null;
          api_slug: string | null;
          source: LeadSource;
          positive_keywords: string[] | null;
          negative_keywords: string[] | null;
          is_enabled: boolean;
          last_scanned_at: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["scanner_config"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["scanner_config"]["Insert"]>;
      };
      job_matches: {
        Row: {
          id: string;
          student_id: string;
          job_lead_id: string;
          overall_score: number;
          grade: string;
          archetype: string | null;
          match_reasoning: Record<string, unknown> | null;
          match_status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["job_matches"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["job_matches"]["Insert"]>;
      };
      agent_runs: {
        Row: {
          id: string;
          run_type: string;
          student_id: string | null;
          initiated_by: string;
          status: string;
          total_steps: number;
          completed_steps: number;
          failed_steps: number;
          input: Record<string, unknown> | null;
          output: Record<string, unknown> | null;
          error: string | null;
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["agent_runs"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["agent_runs"]["Insert"]>;
      };
      agent_run_steps: {
        Row: {
          id: string;
          run_id: string;
          step_index: number;
          step_type: string;
          status: string;
          input: Record<string, unknown> | null;
          output: Record<string, unknown> | null;
          error: string | null;
          attempts: number;
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["agent_run_steps"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["agent_run_steps"]["Insert"]>;
      };
      ai_call_log: {
        Row: {
          id: string;
          request_id: string | null;
          user_id: string | null;
          feature: string;
          provider: string;
          model: string;
          input_tokens: number | null;
          output_tokens: number | null;
          cost_usd: number | null;
          latency_ms: number | null;
          status: string;
          error: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["ai_call_log"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["ai_call_log"]["Insert"]>;
      };
      chat_threads: {
        Row: {
          id: string;
          student_id: string | null;
          title: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["chat_threads"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["chat_threads"]["Insert"]>;
      };
      chat_messages: {
        Row: {
          id: string;
          thread_id: string;
          role: string;
          content: string | null;
          tool_calls: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["chat_messages"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["chat_messages"]["Insert"]>;
      };
      rate_limit_buckets: {
        Row: {
          key: string;
          tokens: number;
          last_refill: string;
        };
        Insert: Omit<Database["public"]["Tables"]["rate_limit_buckets"]["Row"], "last_refill"> & {
          last_refill?: string;
        };
        Update: Partial<Database["public"]["Tables"]["rate_limit_buckets"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      application_funnel: { Args: Record<string, never>; Returns: { status: string; count: number }[] };
      score_distribution: { Args: Record<string, never>; Returns: { bucket: string; count: number }[] };
      archetype_performance: { Args: Record<string, never>; Returns: { archetype: string; total: number; applied: number; interviews: number; offers: number }[] };
      counselor_stats: { Args: Record<string, never>; Returns: { counselor_id: string; counselor_name: string; total_students: number; total_applications: number; avg_score: number }[] };
      check_rate_limit: {
        Args: { p_user_id: string; p_feature: string; p_limit: number; p_window_seconds: number };
        Returns: { allowed: boolean; limit: number; remaining: number; reset_at: string }[];
      };
    };
    Enums: {
      role: Role;
      application_status: ApplicationStatus;
      student_status: StudentStatus;
      document_type: DocumentType;
      lead_status: LeadStatus;
      lead_source: LeadSource;
    };
  };
}
