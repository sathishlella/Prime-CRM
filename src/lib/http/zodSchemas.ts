import { z } from "zod";

/**
 * Centralized Zod schemas for all API routes.
 * Each schema validates the request body for its corresponding endpoint.
 */

// AI Routes

export const evaluateSchema = z.object({
  job_description: z.string().min(1, "Job description required"),
  cv_markdown: z.string().min(1, "CV required"),
  student_id: z.string().uuid("Invalid student ID"),
});

export const generateCvSchema = z.object({
  cv_markdown: z.string().min(1, "CV required"),
  job_description: z.string().min(1, "Job description required"),
  student_id: z.string().uuid("Invalid student ID"),
});

export const interviewPrepSchema = z.object({
  cv_markdown: z.string().min(1, "CV required"),
  job_description: z.string().min(1, "Job description required"),
  student_id: z.string().uuid("Invalid student ID"),
});

export const analyticsSchema = z.object({
  job_leads: z.array(
    z.object({
      title: z.string(),
      company: z.string(),
      description: z.string(),
    })
  ),
  cv_markdown: z.string().min(1, "CV required"),
  student_id: z.string().uuid("Invalid student ID"),
});

// CRUD Routes

export const leadAssignSchema = z.object({
  lead_id: z.string().uuid("Invalid lead ID"),
  student_id: z.string().uuid("Invalid student ID"),
});

export const studentsUpdateCounselorSchema = z.object({
  student_id: z.string().uuid("Invalid student ID"),
  counselor_id: z.string().uuid("Invalid counselor ID"),
});

export const leadsSchema = z.object({
  job_link: z.string().url("Invalid job link"),
  title: z.string().min(1, "Title required"),
  company: z.string().min(1, "Company required"),
  description: z.string().optional(),
});

export const candidateProfileSchema = z.object({
  student_id: z.string().uuid("Invalid student ID"),
});

export const usersDeleteSchema = z.object({
  user_id: z.string().uuid("Invalid user ID"),
});

export const emailSchema = z.object({
  to: z.string().email("Invalid email"),
  subject: z.string().min(1, "Subject required"),
  html: z.string().min(1, "HTML body required"),
});

// Type exports for use in route handlers
export type EvaluateRequest = z.infer<typeof evaluateSchema>;
export type GenerateCvRequest = z.infer<typeof generateCvSchema>;
export type InterviewPrepRequest = z.infer<typeof interviewPrepSchema>;
export type AnalyticsRequest = z.infer<typeof analyticsSchema>;
export type LeadAssignRequest = z.infer<typeof leadAssignSchema>;
export type StudentsUpdateCounselorRequest = z.infer<
  typeof studentsUpdateCounselorSchema
>;
export type LeadsRequest = z.infer<typeof leadsSchema>;
export type CandidateProfileRequest = z.infer<typeof candidateProfileSchema>;
export type UsersDeleteRequest = z.infer<typeof usersDeleteSchema>;
export type EmailRequest = z.infer<typeof emailSchema>;
