"use client";

import { createClient } from "@/lib/supabase/client";
import type { DocumentType } from "@/lib/supabase/database.types";

const supabase = () => createClient();

export interface Document {
  id:          string;
  student_id:  string;
  file_name:   string;
  file_url:    string;
  file_type:   DocumentType;
  uploaded_by: string;
  created_at:  string;
  uploaded_by_profile?: { full_name: string } | null;
}

/** Upload a file to Supabase Storage and insert a documents record. */
export async function uploadDocument({
  file,
  studentId,
  uploadedBy,
  fileType = "resume",
  onProgress,
}: {
  file:        File;
  studentId:   string;
  uploadedBy:  string;
  fileType?:   DocumentType;
  onProgress?: (pct: number) => void;
}): Promise<{ data: Document | null; error: string | null }> {
  const sb = supabase();

  // Build storage path:  documents/{student_id}/{type}s/{timestamp}_{filename}
  const folder    = fileType === "resume"       ? "resumes"
                  : fileType === "cover_letter" ? "cover_letters"
                  : fileType === "jd"           ? "jds"
                  : "other";
  const safeName  = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${studentId}/${folder}/${Date.now()}_${safeName}`;

  // Simulate progress to 30% while uploading starts
  onProgress?.(10);

  const { error: storageError } = await sb.storage
    .from("documents")
    .upload(storagePath, file, { upsert: false, contentType: file.type });

  if (storageError) {
    return { data: null, error: storageError.message };
  }

  onProgress?.(70);

  // Get the storage URL (path only — signed URL generated on download)
  const { data: urlData } = sb.storage.from("documents").getPublicUrl(storagePath);
  const fileUrl = urlData?.publicUrl ?? storagePath;

  // Insert document record
  const { data: doc, error: dbError } = await sb
    .from("documents")
    .insert({
      student_id:  studentId,
      file_name:   file.name,
      file_url:    storagePath, // store path, not public URL
      file_type:   fileType,
      uploaded_by: uploadedBy,
    })
    .select(`id, student_id, file_name, file_url, file_type, uploaded_by, created_at,
             uploaded_by_profile:profiles!uploaded_by(full_name)`)
    .single();

  if (dbError) {
    return { data: null, error: dbError.message };
  }

  onProgress?.(100);
  void fileUrl; // suppress unused warning
  return { data: doc as Document, error: null };
}

/** Get documents for a student. */
export async function getStudentDocuments(studentId: string) {
  const { data, error } = await supabase()
    .from("documents")
    .select(`id, student_id, file_name, file_url, file_type, uploaded_by, created_at,
             uploaded_by_profile:profiles!uploaded_by(full_name)`)
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  return { data: (data ?? []) as Document[], error };
}

/** Generate a signed download URL (1-hour expiry). */
export async function getSignedDownloadUrl(storagePath: string) {
  const { data, error } = await supabase()
    .storage
    .from("documents")
    .createSignedUrl(storagePath, 3600);

  return { url: data?.signedUrl ?? null, error };
}

/** Get resume filenames for a student (for the Add Application dropdown). */
export async function getStudentResumes(studentId: string) {
  const { data, error } = await supabase()
    .from("documents")
    .select("id, file_name, file_url")
    .eq("student_id", studentId)
    .eq("file_type", "resume")
    .order("created_at", { ascending: false });

  return { data: data ?? [], error };
}
