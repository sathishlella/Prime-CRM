"use client";

import { createClient } from "@/lib/supabase/client";
import { 
  MOCK_STUDENTS, 
  MOCK_COUNSELORS,
  getMockCounselorStudents,
  getMockAllStudents,
  type MockStudent 
} from "./mockData";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
const supabase = () => createClient();

// Demo mode: in-memory storage
let demoStudents = [...MOCK_STUDENTS];

export interface StudentWithProfile {
  id:         string;
  profile_id: string;
  status:     string;
  university: string | null;
  major:      string | null;
  full_name: string;
  email: string;
  avatar_url: string | null;
  counselor?: { id: string; full_name: string };
  profile?: { id: string; full_name: string; email: string; avatar_url: string | null };
}

function transformMockStudent(s: MockStudent): StudentWithProfile {
  const counselor = MOCK_COUNSELORS.find(c => c.id === s.assigned_counselor_id);
  return {
    id: s.id,
    profile_id: s.profile_id,
    status: s.status,
    university: s.university,
    major: s.major,
    full_name: s.full_name,
    email: s.email,
    avatar_url: null,
    counselor: counselor,
    profile: {
      id: s.profile_id,
      full_name: s.full_name,
      email: s.email,
      avatar_url: null,
    },
  };
}

/** Counselor: fetch only their assigned students */
export async function getMyCounselorStudents(counselorId: string) {
  if (DEMO_MODE) {
    const students = getMockCounselorStudents(counselorId).map(transformMockStudent);
    return { data: students, error: null };
  }

  const { data: rawData, error } = await supabase()
    .from("students")
    .select(`
      id, profile_id, status, university, major,
      profile:profiles!profile_id(id, full_name, email, avatar_url)
    `)
    .eq("assigned_counselor_id", counselorId)
    .eq("status", "active")
    .order("created_at");

  // Transform to extract single profile from arrays
  const data = ((rawData ?? []) as any[]).map((s: any) => ({
    ...s,
    profile: Array.isArray(s.profile) ? s.profile[0] : s.profile,
  }));

  return { data: data as StudentWithProfile[], error };
}

/** Admin: fetch all students with their counselor info */
export async function getAllStudents() {
  if (DEMO_MODE) {
    const students = getMockAllStudents().map(transformMockStudent);
    return { data: students, error: null };
  }

  const { data, error } = await supabase()
    .from("students")
    .select(`
      id, profile_id, status, university, major,
      profile:profiles!profile_id(id, full_name, email, avatar_url),
      counselor:profiles!assigned_counselor_id(id, full_name)
    `)
    .order("created_at");

  return { data: data ?? [], error };
}

/** Get student by ID */
export async function getStudentById(studentId: string) {
  if (DEMO_MODE) {
    const student = demoStudents.find(s => s.id === studentId);
    return { data: student ? transformMockStudent(student) : null, error: null };
  }

  const { data, error } = await supabase()
    .from("students")
    .select(`
      id, profile_id, status, university, major, graduation_date, visa_status,
      profile:profiles!profile_id(id, full_name, email, avatar_url),
      counselor:profiles!assigned_counselor_id(id, full_name)
    `)
    .eq("id", studentId)
    .single();

  return { data, error };
}
