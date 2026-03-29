// Mock data for DEMO_MODE - used when Supabase is not available
import type { ApplicationStatus, StudentStatus } from "@/lib/supabase/database.types";

export interface MockApplication {
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
  applied_by_profile?: { id: string; full_name: string };
}

export interface MockStudent {
  id: string;
  profile_id: string;
  full_name: string;
  email: string;
  university: string;
  major: string;
  graduation_date: string;
  visa_status: string;
  assigned_counselor_id: string;
  status: StudentStatus;
}

// Student records
export const MOCK_STUDENTS: MockStudent[] = [
  {
    id: "aaaaaaaa-0000-0000-0000-000000000001",
    profile_id: "00000000-0000-0000-0000-000000000004",
    full_name: "Sarah Mitchell",
    email: "sarah@student.com",
    university: "MIT",
    major: "Computer Science",
    graduation_date: "2026-05-15",
    visa_status: "F-1 OPT",
    assigned_counselor_id: "00000000-0000-0000-0000-000000000002",
    status: "active",
  },
  {
    id: "aaaaaaaa-0000-0000-0000-000000000002",
    profile_id: "00000000-0000-0000-0000-000000000005",
    full_name: "David Chen",
    email: "david@student.com",
    university: "Stanford",
    major: "Machine Learning",
    graduation_date: "2026-06-01",
    visa_status: "F-1 OPT",
    assigned_counselor_id: "00000000-0000-0000-0000-000000000002",
    status: "active",
  },
  {
    id: "aaaaaaaa-0000-0000-0000-000000000003",
    profile_id: "00000000-0000-0000-0000-000000000006",
    full_name: "Emily Rodriguez",
    email: "emily@student.com",
    university: "UC Berkeley",
    major: "Electrical Eng.",
    graduation_date: "2026-05-20",
    visa_status: "F-1 CPT",
    assigned_counselor_id: "00000000-0000-0000-0000-000000000003",
    status: "active",
  },
];

// Applications
export const MOCK_APPLICATIONS: MockApplication[] = [
  {
    id: "app-001",
    student_id: "aaaaaaaa-0000-0000-0000-000000000001",
    company_name: "Google",
    job_role: "Software Engineer Intern",
    job_description: "Build scalable microservices with Go and Python. Work with distributed systems team on search infrastructure.",
    job_link: "https://careers.google.com/jobs/12345",
    resume_used: "sarah_resume_v3.pdf",
    status: "interview",
    applied_by: "00000000-0000-0000-0000-000000000002",
    applied_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    notes: "Recruiter very responsive",
    applied_by_profile: { id: "00000000-0000-0000-0000-000000000002", full_name: "Priya Sharma" },
  },
  {
    id: "app-002",
    student_id: "aaaaaaaa-0000-0000-0000-000000000001",
    company_name: "Microsoft",
    job_role: "Data Analyst",
    job_description: "Analyze product telemetry data using SQL and Python. Create dashboards in Power BI for executive reporting.",
    job_link: "https://careers.microsoft.com/jobs/67890",
    resume_used: "sarah_resume_v3.pdf",
    status: "applied",
    applied_by: "00000000-0000-0000-0000-000000000002",
    applied_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date(Date.now() - 172800000).toISOString(),
    notes: null,
    applied_by_profile: { id: "00000000-0000-0000-0000-000000000002", full_name: "Priya Sharma" },
  },
  {
    id: "app-003",
    student_id: "aaaaaaaa-0000-0000-0000-000000000001",
    company_name: "Amazon",
    job_role: "Product Manager Intern",
    job_description: "Drive feature roadmap for Alexa Smart Home. Collaborate with engineering and design teams.",
    job_link: "https://amazon.jobs/pm-intern",
    resume_used: "sarah_pm_resume.pdf",
    status: "in_progress",
    applied_by: "00000000-0000-0000-0000-000000000003",
    applied_at: new Date(Date.now() - 10800000).toISOString(),
    updated_at: new Date(Date.now() - 10800000).toISOString(),
    notes: "Referral submitted",
    applied_by_profile: { id: "00000000-0000-0000-0000-000000000003", full_name: "Amit Patel" },
  },
  {
    id: "app-004",
    student_id: "aaaaaaaa-0000-0000-0000-000000000001",
    company_name: "Apple",
    job_role: "UX Designer",
    job_description: "Design next-generation interfaces for Apple Health. Conduct user research and create high-fidelity prototypes.",
    job_link: "https://apple.com/careers/ux",
    resume_used: "sarah_ux_portfolio.pdf",
    status: "rejected",
    applied_by: "00000000-0000-0000-0000-000000000002",
    applied_at: new Date(Date.now() - 777600000).toISOString(),
    updated_at: new Date(Date.now() - 777600000).toISOString(),
    notes: "Position filled internally",
    applied_by_profile: { id: "00000000-0000-0000-0000-000000000002", full_name: "Priya Sharma" },
  },
  {
    id: "app-005",
    student_id: "aaaaaaaa-0000-0000-0000-000000000002",
    company_name: "Meta",
    job_role: "ML Engineer Intern",
    job_description: "Build recommendation models for Instagram Reels using PyTorch. Optimize inference latency for production.",
    job_link: "https://metacareers.com/ml-intern",
    resume_used: "david_ml_resume.pdf",
    status: "applied",
    applied_by: "00000000-0000-0000-0000-000000000002",
    applied_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    notes: null,
    applied_by_profile: { id: "00000000-0000-0000-0000-000000000002", full_name: "Priya Sharma" },
  },
  {
    id: "app-006",
    student_id: "aaaaaaaa-0000-0000-0000-000000000002",
    company_name: "Netflix",
    job_role: "Backend Developer",
    job_description: "Build content delivery APIs using Java and Spring Boot. Scale systems serving 200M+ subscribers.",
    job_link: "https://netflix.com/careers/backend",
    resume_used: "david_backend_resume.pdf",
    status: "interview",
    applied_by: "00000000-0000-0000-0000-000000000002",
    applied_at: new Date(Date.now() - 604800000).toISOString(),
    updated_at: new Date(Date.now() - 604800000).toISOString(),
    notes: "Technical round scheduled",
    applied_by_profile: { id: "00000000-0000-0000-0000-000000000002", full_name: "Priya Sharma" },
  },
  {
    id: "app-007",
    student_id: "aaaaaaaa-0000-0000-0000-000000000003",
    company_name: "Tesla",
    job_role: "Embedded Systems Intern",
    job_description: "Develop firmware for Battery Management System. C/C++ on RTOS platform.",
    job_link: "https://tesla.com/careers/embed",
    resume_used: "emily_embedded_resume.pdf",
    status: "applied",
    applied_by: "00000000-0000-0000-0000-000000000003",
    applied_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date(Date.now() - 172800000).toISOString(),
    notes: null,
    applied_by_profile: { id: "00000000-0000-0000-0000-000000000003", full_name: "Amit Patel" },
  },
  {
    id: "app-008",
    student_id: "aaaaaaaa-0000-0000-0000-000000000003",
    company_name: "SpaceX",
    job_role: "Avionics Engineer",
    job_description: "Design PCB layouts for flight computer systems. Perform hardware-in-the-loop testing.",
    job_link: "https://spacex.com/careers/avionics",
    resume_used: "emily_avionics_resume.pdf",
    status: "in_progress",
    applied_by: "00000000-0000-0000-0000-000000000003",
    applied_at: new Date(Date.now() - 345600000).toISOString(),
    updated_at: new Date(Date.now() - 345600000).toISOString(),
    notes: "Hiring manager interested",
    applied_by_profile: { id: "00000000-0000-0000-0000-000000000003", full_name: "Amit Patel" },
  },
];

// Counselors
export const MOCK_COUNSELORS = [
  { id: "00000000-0000-0000-0000-000000000002", full_name: "Priya Sharma", email: "priya@consultpro.com" },
  { id: "00000000-0000-0000-0000-000000000003", full_name: "Amit Patel", email: "amit@consultpro.com" },
];

// Admin user
export const MOCK_ADMIN = {
  id: "00000000-0000-0000-0000-000000000001",
  full_name: "Raj Mehta",
  email: "admin@consultpro.com",
};

// Mock stats helpers
export function getMockStudentApplications(studentId: string) {
  return MOCK_APPLICATIONS.filter(app => app.student_id === studentId);
}

export function getMockCounselorStudents(counselorId: string) {
  return MOCK_STUDENTS.filter(s => s.assigned_counselor_id === counselorId);
}

export function getMockCounselorApplications(counselorId: string) {
  const studentIds = getMockCounselorStudents(counselorId).map(s => s.id);
  return MOCK_APPLICATIONS.filter(app => studentIds.includes(app.student_id));
}

export function getMockAllApplications() {
  return MOCK_APPLICATIONS;
}

export function getMockAllStudents() {
  return MOCK_STUDENTS;
}
