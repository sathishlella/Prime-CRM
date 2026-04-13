/**
 * Shared Zod schemas for API route body validation.
 */

import { z } from "zod";

// ─── AI routes ──────────────────────────────────────────────────────────────

export const evaluateSchema = z.object({
  student_id: z.string().uuid(),
  job_description: z.string().min(1),
  company_name: z.string().min(1).optional(),
  job_role: z.string().min(1).optional(),
  job_url: z.string().url().optional().or(z.literal("")),
});

export const generateCvSchema = z.object({
  student_id: z.string().uuid(),
  application_id: z.string().uuid().optional(),
  job_description: z.string().min(1),
  company_name: z.string().min(1),
  job_role: z.string().min(1),
  format: z.enum(["letter", "a4"]).optional(),
});

export const interviewPrepSchema = z.object({
  application_id: z.string().uuid(),
  student_id: z.string().uuid(),
  company_name: z.string().min(1),
  job_role: z.string().min(1),
  job_description: z.string().min(1).optional(),
});

// ─── Agent routes ───────────────────────────────────────────────────────────

export const matchAgentSchema = z.object({
  student_id: z.string().uuid(),
});

export const applyAgentSchema = z.object({
  student_id: z.string().uuid(),
  job_match_ids: z.array(z.string().uuid()).max(50),
});

// ─── Leads / applications ───────────────────────────────────────────────────

export const createApplicationSchema = z.object({
  student_id: z.string().uuid(),
  company_name: z.string().min(1).max(200),
  job_role: z.string().min(1).max(200),
  job_description: z.string().max(20000).optional(),
  job_link: z.string().url().max(2000).optional().or(z.literal("")),
  resume_used: z.string().max(2000).optional(),
});

export const assignLeadSchema = z.object({
  lead_id: z.string().uuid(),
  student_id: z.string().uuid(),
});

// ─── Scanner ────────────────────────────────────────────────────────────────

export const manualScanSchema = z.object({
  force: z.boolean().optional(),
});

// ─── Users / students ───────────────────────────────────────────────────────

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  full_name: z.string().min(1).max(200),
  role: z.enum(["admin", "counselor", "student"]),
  university: z.string().max(200).optional(),
  visa_status: z.string().max(100).optional(),
  assigned_counselor_id: z.string().uuid().optional().or(z.literal("")),
});

export const updateCounselorSchema = z.object({
  student_id: z.string().uuid(),
  counselor_id: z.string().uuid().optional().or(z.literal("")),
});

export const deleteUserSchema = z.object({
  user_id: z.string().uuid(),
  role: z.enum(["admin", "counselor", "student"]),
});

// ─── Chat ───────────────────────────────────────────────────────────────────

export const chatSchema = z.object({
  thread_id: z.string().uuid().optional(),
  message: z.string().min(1).max(4000),
});

// ─── Candidate profile ──────────────────────────────────────────────────────

export const candidateProfileSchema = z.object({
  student_id: z.string().uuid(),
  target_roles: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  narrative: z.string().max(5000).optional(),
  deal_breakers: z.array(z.string()).optional(),
  location_preference: z.string().max(200).optional(),
  cv_markdown: z.string().max(100000).optional(),
});
