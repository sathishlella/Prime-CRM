import { describe, it, expect } from "vitest";
import {
  evaluateSchema,
  generateCvSchema,
  interviewPrepSchema,
  candidateProfileSchema,
  assignLeadSchema,
  updateCounselorSchema,
  deleteUserSchema,
  emailSchema,
  matchAgentSchema,
  applyAgentSchema,
  chatSchema,
} from "@/lib/http/zodSchemas";

const UUID = "00000000-0000-0000-0000-000000000001";

describe("evaluateSchema", () => {
  it("accepts valid input", () => {
    const r = evaluateSchema.safeParse({ job_description: "desc", cv_markdown: "cv", student_id: UUID });
    expect(r.success).toBe(true);
  });
  it("rejects missing job_description", () => {
    const r = evaluateSchema.safeParse({ cv_markdown: "cv", student_id: UUID });
    expect(r.success).toBe(false);
  });
  it("rejects invalid student_id", () => {
    const r = evaluateSchema.safeParse({ job_description: "d", cv_markdown: "cv", student_id: "not-uuid" });
    expect(r.success).toBe(false);
  });
});

describe("generateCvSchema", () => {
  const base = { student_id: UUID, job_description: "jd", company_name: "ACME", job_role: "Engineer" };
  it("accepts valid input", () => expect(generateCvSchema.safeParse(base).success).toBe(true));
  it("defaults format to letter", () => {
    const r = generateCvSchema.safeParse(base);
    expect(r.success && r.data.format).toBe("letter");
  });
  it("accepts a4 format", () => {
    const r = generateCvSchema.safeParse({ ...base, format: "a4" });
    expect(r.success && r.data.format).toBe("a4");
  });
  it("rejects unknown format", () => {
    expect(generateCvSchema.safeParse({ ...base, format: "legal" }).success).toBe(false);
  });
});

describe("interviewPrepSchema", () => {
  it("accepts minimal valid input", () => {
    const r = interviewPrepSchema.safeParse({ student_id: UUID, company_name: "Co", job_role: "Dev", job_description: "jd" });
    expect(r.success).toBe(true);
  });
  it("accepts without application_id", () => {
    const r = interviewPrepSchema.safeParse({ student_id: UUID, company_name: "Co", job_role: "Dev", job_description: "jd" });
    expect(r.success).toBe(true);
  });
});

describe("candidateProfileSchema", () => {
  it("accepts only student_id", () => {
    expect(candidateProfileSchema.safeParse({ student_id: UUID }).success).toBe(true);
  });
  it("accepts all optional fields", () => {
    const r = candidateProfileSchema.safeParse({
      student_id: UUID,
      target_roles: ["SWE"],
      skills: ["TypeScript"],
      narrative: "I am a dev",
      deal_breakers: ["travel"],
      location_preference: "NYC",
      cv_markdown: "# CV",
    });
    expect(r.success).toBe(true);
  });
  it("rejects narrative over 5000 chars", () => {
    const r = candidateProfileSchema.safeParse({ student_id: UUID, narrative: "x".repeat(5001) });
    expect(r.success).toBe(false);
  });
});

describe("assignLeadSchema", () => {
  it("accepts valid UUIDs", () => {
    expect(assignLeadSchema.safeParse({ lead_id: UUID, student_id: UUID }).success).toBe(true);
  });
  it("rejects non-UUID lead_id", () => {
    expect(assignLeadSchema.safeParse({ lead_id: "bad", student_id: UUID }).success).toBe(false);
  });
});

describe("updateCounselorSchema", () => {
  it("accepts with counselor_id", () => {
    expect(updateCounselorSchema.safeParse({ student_id: UUID, counselor_id: UUID }).success).toBe(true);
  });
  it("accepts empty string counselor_id (unassign)", () => {
    expect(updateCounselorSchema.safeParse({ student_id: UUID, counselor_id: "" }).success).toBe(true);
  });
  it("accepts without counselor_id", () => {
    expect(updateCounselorSchema.safeParse({ student_id: UUID }).success).toBe(true);
  });
});

describe("deleteUserSchema", () => {
  it("accepts valid roles", () => {
    for (const role of ["admin", "counselor", "student"]) {
      expect(deleteUserSchema.safeParse({ user_id: UUID, role }).success).toBe(true);
    }
  });
  it("rejects unknown role", () => {
    expect(deleteUserSchema.safeParse({ user_id: UUID, role: "superadmin" }).success).toBe(false);
  });
});

describe("emailSchema", () => {
  it("accepts welcome type", () => {
    const r = emailSchema.safeParse({ type: "welcome", to: "a@b.com", name: "A", role: "student", email: "a@b.com" });
    expect(r.success).toBe(true);
  });
  it("accepts new_application type", () => {
    expect(emailSchema.safeParse({ type: "new_application", appId: UUID }).success).toBe(true);
  });
  it("accepts status_change type", () => {
    expect(emailSchema.safeParse({ type: "status_change", appId: UUID, newStatus: "interview", oldStatus: "applied" }).success).toBe(true);
  });
  it("accepts counselor_assigned type", () => {
    expect(emailSchema.safeParse({ type: "counselor_assigned", studentId: UUID, counselorId: UUID }).success).toBe(true);
  });
  it("rejects unknown type", () => {
    expect(emailSchema.safeParse({ type: "unknown" }).success).toBe(false);
  });
  it("rejects welcome with invalid email", () => {
    expect(emailSchema.safeParse({ type: "welcome", to: "not-email", name: "A", role: "r", email: "a@b.com" }).success).toBe(false);
  });
});

describe("matchAgentSchema", () => {
  it("accepts valid student_id", () => {
    expect(matchAgentSchema.safeParse({ student_id: UUID }).success).toBe(true);
  });
  it("rejects missing student_id", () => {
    expect(matchAgentSchema.safeParse({}).success).toBe(false);
  });
});

describe("applyAgentSchema", () => {
  it("accepts valid input", () => {
    const r = applyAgentSchema.safeParse({ student_id: UUID, job_match_ids: [UUID] });
    expect(r.success).toBe(true);
  });
  it("rejects empty job_match_ids", () => {
    expect(applyAgentSchema.safeParse({ student_id: UUID, job_match_ids: [] }).success).toBe(false);
  });
  it("rejects more than 50 job_match_ids", () => {
    const ids = Array.from({ length: 51 }, () => UUID);
    expect(applyAgentSchema.safeParse({ student_id: UUID, job_match_ids: ids }).success).toBe(false);
  });
  it("rejects non-UUID in job_match_ids", () => {
    expect(applyAgentSchema.safeParse({ student_id: UUID, job_match_ids: ["not-uuid"] }).success).toBe(false);
  });
});

describe("chatSchema", () => {
  it("accepts minimal input", () => {
    expect(chatSchema.safeParse({ message: "hello" }).success).toBe(true);
  });
  it("accepts with thread_id", () => {
    expect(chatSchema.safeParse({ thread_id: UUID, message: "hi" }).success).toBe(true);
  });
  it("rejects empty message", () => {
    expect(chatSchema.safeParse({ message: "" }).success).toBe(false);
  });
  it("rejects message over 4000 chars", () => {
    expect(chatSchema.safeParse({ message: "x".repeat(4001) }).success).toBe(false);
  });
  it("rejects invalid thread_id", () => {
    expect(chatSchema.safeParse({ thread_id: "bad", message: "hi" }).success).toBe(false);
  });
});
