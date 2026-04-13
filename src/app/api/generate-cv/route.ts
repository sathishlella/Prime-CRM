import { NextRequest, NextResponse } from "next/server";
import { createServerClient, createAdminClient } from "@/lib/supabase/server";
import { callClaude } from "@/lib/ai/claude";
import {
  CVTailorResult,
  buildCVTailorSystemPrompt,
  buildCVTailorUserPrompt,
} from "@/lib/ai/prompts/cv-tailor";
import { buildHTML, normalizeTextForATS } from "@/lib/ai/cv-generator";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["admin", "counselor"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      student_id,
      application_id,
      job_description,
      company_name,
      job_role,
      format = "letter",
    } = body;

    if (!student_id || !job_description || !company_name || !job_role) {
      return NextResponse.json(
        { error: "student_id, job_description, company_name, and job_role are required" },
        { status: 400 }
      );
    }

    // Fetch student + profile
    const { data: student } = await supabase
      .from("students")
      .select("*, profiles(full_name, email)")
      .eq("id", student_id)
      .single();

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const { data: candidateProfile } = await supabase
      .from("candidate_profiles")
      .select("*")
      .eq("student_id", student_id)
      .single();

    if (!candidateProfile?.cv_markdown) {
      return NextResponse.json(
        { error: "Student has no CV. Please add a CV in the candidate profile first." },
        { status: 400 }
      );
    }

    const rawProfiles = student.profiles as unknown;
    const studentProfile = Array.isArray(rawProfiles)
      ? (rawProfiles[0] as { full_name: string; email: string })
      : (rawProfiles as { full_name: string; email: string });

    // Call Claude to tailor CV
    const { data: tailoringData } = await callClaude<CVTailorResult>(
      buildCVTailorSystemPrompt(),
      buildCVTailorUserPrompt(
        candidateProfile.cv_markdown,
        job_description,
        studentProfile.full_name
      ),
      { feature: "cv-generate", maxTokens: 8192, userId: user.id }
    );

    // Build HTML
    let html = buildHTML({
      tailoringData,
      candidateName: studentProfile.full_name,
      email: studentProfile.email,
      linkedinUrl: undefined,
      portfolioUrl: undefined,
      location: undefined,
      format: format as "letter" | "a4",
      language: "en",
    });

    // Normalize for ATS
    const { html: normalizedHtml } = normalizeTextForATS(html);
    html = normalizedHtml;

    // Generate PDF using Playwright
    let pdfBuffer: Buffer;
    try {
      const chromium = await import("@sparticuz/chromium");
      const { chromium: playwrightChromium } = await import("playwright-core");

      const browser = await playwrightChromium.launch({
        args: chromium.default.args,
        executablePath: await chromium.default.executablePath(),
        headless: true,
      });

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);

      pdfBuffer = await page.pdf({
        format: format as "letter" | "a4",
        printBackground: true,
        margin: { top: "0.6in", right: "0.6in", bottom: "0.6in", left: "0.6in" },
      });

      await browser.close();
    } catch {
      // Fallback: return HTML without PDF if Playwright unavailable
      return NextResponse.json({
        html,
        tailoring_data: tailoringData,
        error: "PDF generation unavailable. HTML content returned instead.",
        keyword_coverage: tailoringData.keyword_coverage,
      });
    }

    // Upload to Supabase Storage
    const slug = company_name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const date = new Date().toISOString().split("T")[0];
    const fileName = `cv-${slug}-${date}.pdf`;
    const storagePath = `${student_id}/${fileName}`;

    const adminClient = createAdminClient();

    const { error: uploadError } = await adminClient.storage
      .from("generated-cvs")
      .upload(storagePath, pdfBuffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload PDF" },
        { status: 500 }
      );
    }

    // Get signed URL
    const { data: urlData } = await adminClient.storage
      .from("generated-cvs")
      .createSignedUrl(storagePath, 3600);

    const pdfUrl = urlData?.signedUrl || "";

    // Count pages
    const pdfString = pdfBuffer.toString("latin1");
    const pageCount = (pdfString.match(/\/Type\s*\/Page[^s]/g) || []).length;

    // Store record
    const { data: cvRecord } = await supabase
      .from("generated_cvs")
      .insert({
        application_id: application_id || null,
        student_id,
        company_name,
        job_role,
        pdf_url: pdfUrl,
        pdf_path: storagePath,
        content: tailoringData as unknown as Record<string, unknown>,
        keyword_coverage: tailoringData.keyword_coverage,
        page_count: pageCount,
        format: format as string,
        created_by: user.id,
      })
      .select("id")
      .single();

    return NextResponse.json({
      pdf_url: pdfUrl,
      cv_id: cvRecord?.id,
      page_count: pageCount,
      keyword_coverage: tailoringData.keyword_coverage,
      keywords_used: tailoringData.keywords_used,
    });
  } catch (error) {
    console.error("CV generation error:", error);
    return NextResponse.json(
      { error: "CV generation failed", details: (error as Error).message },
      { status: 500 }
    );
  }
}
