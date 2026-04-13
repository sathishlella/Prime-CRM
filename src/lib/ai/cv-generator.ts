import { readFileSync } from "fs";
import { resolve } from "path";

export interface CVGenerationInput {
  tailoringData: {
    summary: string;
    competencies: string[];
    experience: Array<{
      company: string;
      role: string;
      period: string;
      bullets: string[];
    }>;
    projects: Array<{
      name: string;
      description: string;
      tech: string;
      bullets: string[];
    }>;
    education: Array<{ institution: string; degree: string; year: string }>;
    skills: string[];
  };
  candidateName: string;
  email: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  location?: string;
  format: "letter" | "a4";
  language: "en" | "es";
}

/**
 * Normalize text for ATS compatibility.
 * Ported from career-ops/generate-pdf.mjs
 */
export function normalizeTextForATS(html: string): {
  html: string;
  replacements: Record<string, number>;
} {
  const replacements: Record<string, number> = {};
  const bump = (key: string) => {
    replacements[key] = (replacements[key] || 0) + 1;
  };

  const masks: string[] = [];
  const masked = html.replace(
    /<(style|script)\b[^>]*>[\s\S]*?<\/\1>/gi,
    (match) => {
      const token = `\u0000MASK${masks.length}\u0000`;
      masks.push(match);
      return token;
    }
  );

  let out = "";
  let i = 0;
  while (i < masked.length) {
    const lt = masked.indexOf("<", i);
    if (lt === -1) {
      out += sanitizeText(masked.slice(i));
      break;
    }
    out += sanitizeText(masked.slice(i, lt));
    const gt = masked.indexOf(">", lt);
    if (gt === -1) {
      out += masked.slice(lt);
      break;
    }
    out += masked.slice(lt, gt + 1);
    i = gt + 1;
  }

  const restored = out.replace(
    /\u0000MASK(\d+)\u0000/g,
    (_, n) => masks[Number(n)]
  );
  return { html: restored, replacements };

  function sanitizeText(text: string): string {
    if (!text) return text;
    let t = text;
    t = t.replace(/\u2014/g, () => { bump("em-dash"); return "-"; });
    t = t.replace(/\u2013/g, () => { bump("en-dash"); return "-"; });
    t = t.replace(/[\u201C\u201D\u201E\u201F]/g, () => { bump("smart-double-quote"); return '"'; });
    t = t.replace(/[\u2018\u2019\u201A\u201B]/g, () => { bump("smart-single-quote"); return "'"; });
    t = t.replace(/\u2026/g, () => { bump("ellipsis"); return "..."; });
    t = t.replace(/[\u200B\u200C\u200D\u2060\uFEFF]/g, () => { bump("zero-width"); return ""; });
    t = t.replace(/\u00A0/g, () => { bump("nbsp"); return " "; });
    return t;
  }
}

export async function generatePDFFromHTML(
  html: string,
  format: "letter" | "a4"
): Promise<Buffer> {
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

  const pdfBuffer = await page.pdf({
    format,
    printBackground: true,
    margin: { top: "0.6in", right: "0.6in", bottom: "0.6in", left: "0.6in" },
  });

  await browser.close();
  return pdfBuffer;
}

export function buildHTML(input: CVGenerationInput): string {
  const {
    tailoringData,
    candidateName,
    email,
    linkedinUrl,
    portfolioUrl,
    location,
    format,
    language,
  } = input;

  const pageWidth = format === "letter" ? "8.5in" : "210mm";
  const sectionLabels =
    language === "es"
      ? {
          summary: "Resumen Profesional",
          competencies: "Competencias Core",
          experience: "Experiencia Laboral",
          projects: "Proyectos",
          education: "Formacion",
          skills: "Competencias",
        }
      : {
          summary: "Professional Summary",
          competencies: "Core Competencies",
          experience: "Work Experience",
          projects: "Projects",
          education: "Education",
          skills: "Skills",
        };

  const competenciesHtml = tailoringData.competencies
    .map((c) => `<span class="competency-tag">${c}</span>`)
    .join("\n            ");

  const experienceHtml = tailoringData.experience
    .map(
      (exp) => `
          <div class="experience-entry">
            <div class="exp-header">
              <span class="company-name">${exp.company}</span>
              <span class="exp-period">${exp.period}</span>
            </div>
            <div class="exp-role">${exp.role}</div>
            <ul>
              ${exp.bullets.map((b) => `<li>${b}</li>`).join("\n              ")}
            </ul>
          </div>`
    )
    .join("\n");

  const projectsHtml = tailoringData.projects
    .map(
      (proj) => `
          <div class="project-entry">
            <div class="project-header">
              <span class="project-name">${proj.name}</span>
              <span class="project-tech">${proj.tech}</span>
            </div>
            <p>${proj.description}</p>
            <ul>
              ${proj.bullets.map((b) => `<li>${b}</li>`).join("\n              ")}
            </ul>
          </div>`
    )
    .join("\n");

  const educationHtml = tailoringData.education
    .map(
      (edu) => `
          <div class="education-entry">
            <span class="institution">${edu.institution}</span>
            <span class="degree">${edu.degree} (${edu.year})</span>
          </div>`
    )
    .join("\n");

  const skillsHtml = tailoringData.skills
    .map((s) => `<span class="skill-tag">${s}</span>`)
    .join(", ");

  const contactParts = [email];
  if (linkedinUrl) contactParts.push(`<a href="${linkedinUrl}">LinkedIn</a>`);
  if (portfolioUrl)
    contactParts.push(`<a href="${portfolioUrl}">Portfolio</a>`);
  if (location) contactParts.push(location);

  return `<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="UTF-8">
  <style>
    @font-face {
      font-family: 'Space Grotesk';
      src: url('./fonts/space-grotesk-latin.woff2') format('woff2');
      font-weight: 300 700;
      font-display: swap;
    }
    @font-face {
      font-family: 'DM Sans';
      src: url('./fonts/dm-sans-latin.woff2') format('woff2');
      font-weight: 300 700;
      font-display: swap;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'DM Sans', -apple-system, sans-serif;
      font-size: 11px;
      line-height: 1.5;
      color: #1a1a2e;
      width: ${pageWidth};
    }

    .header { margin-bottom: 16px; }
    .header h1 {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 4px;
    }
    .gradient-line {
      height: 2px;
      background: linear-gradient(to right, hsl(187,74%,32%), hsl(270,70%,45%));
      margin-bottom: 8px;
    }
    .contact-row {
      font-size: 10px;
      color: #666;
    }
    .contact-row a { color: hsl(187,74%,32%); text-decoration: none; }

    .section-header {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 13px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: hsl(187,74%,32%);
      margin-top: 14px;
      margin-bottom: 6px;
      border-bottom: 1px solid #e0e0e0;
      padding-bottom: 3px;
    }

    .competency-grid { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
    .competency-tag {
      background: #f0f7fa;
      padding: 3px 10px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 500;
      color: hsl(187,74%,32%);
    }

    .experience-entry { margin-bottom: 10px; }
    .exp-header { display: flex; justify-content: space-between; align-items: baseline; }
    .company-name { font-weight: 600; color: hsl(270,70%,45%); }
    .exp-period { font-size: 10px; color: #888; }
    .exp-role { font-weight: 500; margin-bottom: 3px; }
    ul { padding-left: 16px; }
    li { margin-bottom: 2px; }

    .project-entry { margin-bottom: 8px; }
    .project-header { display: flex; justify-content: space-between; align-items: baseline; }
    .project-name { font-weight: 600; }
    .project-tech { font-size: 10px; color: #888; }

    .education-entry { display: flex; justify-content: space-between; margin-bottom: 4px; }
    .institution { font-weight: 500; }
    .degree { font-size: 10px; color: #666; }

    .skill-tag { font-size: 10.5px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${candidateName}</h1>
    <div class="gradient-line"></div>
    <div class="contact-row">${contactParts.join(" | ")}</div>
  </div>

  <div class="section-header">${sectionLabels.summary}</div>
  <p>${tailoringData.summary}</p>

  <div class="section-header">${sectionLabels.competencies}</div>
  <div class="competency-grid">
    ${competenciesHtml}
  </div>

  <div class="section-header">${sectionLabels.experience}</div>
  ${experienceHtml}

  <div class="section-header">${sectionLabels.projects}</div>
  ${projectsHtml}

  <div class="section-header">${sectionLabels.education}</div>
  ${educationHtml}

  <div class="section-header">${sectionLabels.skills}</div>
  <p class="skill-tag">${skillsHtml}</p>
</body>
</html>`;
}
