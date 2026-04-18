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
  student_id: z.string().uuid("Invalid student ID"),
  application_id: z.string().uuid("Invalid application ID").optional(),
  job_description: z.string().min(1, "Job description required"),
  company_name: z.string().min(1, "Company name required"),
  job_role: z.string().min(1, "Job role required"),
  format: z.enum(["letter", "a4"]).default("letter"),
});

export const interviewPrepSchema = z.object({
  student_id: z.string().uuid("Invalid student ID"),
  application_id: z.string().uuid("Invalid application ID").optional(),
  company_name: z.string().min(1, "Company name required"),
  job_role: z.string().min(1, "Job role required"),
  job_description: z.string().min(1, "Job description required"),
});

// Agent Routes

export const matchAgentSchema = z.object({
  student_id: z.string().uuid("Invalid student ID"),
  deep: z.boolean().optional(),
});

export const applyAgentSchema = z.object({
  student_id: z.string().uuid("Invalid student ID"),
  job_match_ids: z.array(z.string().uuid("Invalid match ID")).min(1).max(50),
});

export const chatSchema = z.object({
  thread_id: z.string().uuid("Invalid thread ID").optional(),
  message: z.string().min(1).max(4000),
});

export const keywordsSchema = z.object({
  match_id: z.string().uuid("Invalid match ID"),
});

export const coverLetterSchema = z.object({
  student_id: z.string().uuid("Invalid student ID"),
  match_id: z.string().uuid("Invalid match ID"),
  emphasis_keywords: z.array(z.string().min(1).max(80)).max(20).optional(),
});

export const tailorCvSchema = z.object({
  student_id: z.string().uuid("Invalid student ID"),
  match_id: z.string().uuid("Invalid match ID"),
  emphasis_keywords: z.array(z.string().min(1).max(80)).max(20).optional(),
});

export const recordApplicationSchema = z.object({
  student_id: z.string().uuid("Invalid student ID"),
  match_id: z.string().uuid("Invalid match ID"),
});

// Non-AI Routes

export const candidateProfileSchema = z.object({
  student_id: z.string().uuid("Invalid student ID"),
  target_roles: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  narrative: z.string().max(5000).optional(),
  deal_breakers: z.array(z.string()).optional(),
  location_preference: z.string().max(200).optional(),
  cv_markdown: z.string().max(100000).optional(),
});

export const assignLeadSchema = z.object({
  lead_id: z.string().uuid("Invalid lead ID"),
  student_id: z.string().uuid("Invalid student ID"),
});

export const updateCounselorSchema = z.object({
  student_id: z.string().uuid("Invalid student ID"),
  counselor_id: z.string().uuid("Invalid counselor ID").optional().or(z.literal("")),
});

export const deleteUserSchema = z.object({
  user_id: z.string().uuid("Invalid user ID"),
  role: z.enum(["admin", "counselor", "student"]),
});

export const emailSchema = z.union([
  z.object({
    type: z.literal("welcome"),
    to: z.string().email("Invalid email"),
    name: z.string().min(1),
    role: z.string().min(1),
    email: z.string().email("Invalid email"),
  }),
  z.object({
    type: z.literal("new_application"),
    appId: z.string().uuid("Invalid application ID"),
  }),
  z.object({
    type: z.literal("status_change"),
    appId: z.string().uuid("Invalid application ID"),
    newStatus: z.string().min(1),
    oldStatus: z.string().min(1),
  }),
  z.object({
    type: z.literal("counselor_assigned"),
    studentId: z.string().uuid("Invalid student ID"),
    counselorId: z.string().uuid("Invalid counselor ID"),
  }),
]);

// Type exports for use in route handlers
export type EvaluateRequest = z.infer<typeof evaluateSchema>;
export type GenerateCvRequest = z.infer<typeof generateCvSchema>;
export type InterviewPrepRequest = z.infer<typeof interviewPrepSchema>;
export type MatchAgentRequest = z.infer<typeof matchAgentSchema>;
export type ApplyAgentRequest = z.infer<typeof applyAgentSchema>;
export type ChatRequest = z.infer<typeof chatSchema>;
export type KeywordsRequest = z.infer<typeof keywordsSchema>;
export type CoverLetterRequest = z.infer<typeof coverLetterSchema>;
export type TailorCvRequest = z.infer<typeof tailorCvSchema>;
export type RecordApplicationRequest = z.infer<typeof recordApplicationSchema>;
export type CandidateProfileRequest = z.infer<typeof candidateProfileSchema>;
export type AssignLeadRequest = z.infer<typeof assignLeadSchema>;
export type UpdateCounselorRequest = z.infer<typeof updateCounselorSchema>;
export type DeleteUserRequest = z.infer<typeof deleteUserSchema>;
export type EmailRequest = z.infer<typeof emailSchema>;
