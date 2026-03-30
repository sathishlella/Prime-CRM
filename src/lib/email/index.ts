import { Resend } from "resend";

// ─── Lazy client — never initialized at module load time ─────────────────────
// (Next.js evaluates modules at build time; env var won't exist then)
function getResend() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY env var is not set");
  }
  return new Resend(process.env.RESEND_API_KEY);
}

// ─── From address ──────────────────────────────────────────────────────────────
const FROM = "F1 Dream Jobs <noreply@f1dreamjobs.com>";

// ─── Status display helpers ────────────────────────────────────────────────────
const STATUS_LABEL: Record<string, string> = {
  applied:     "Applied",
  in_progress: "In Progress",
  interview:   "Interview Scheduled",
  rejected:    "Not Selected",
  offered:     "Offer Received",
};

const STATUS_COLOR: Record<string, string> = {
  applied:     "#2563EB",
  in_progress: "#D97706",
  interview:   "#059669",
  rejected:    "#DC2626",
  offered:     "#7C3AED",
};

const STATUS_BG: Record<string, string> = {
  applied:     "#EFF6FF",
  in_progress: "#FFFBEB",
  interview:   "#ECFDF5",
  rejected:    "#FEF2F2",
  offered:     "#F5F3FF",
};

const STATUS_MESSAGE: Record<string, string> = {
  applied:     "Your application has been submitted. We'll keep you updated as things progress.",
  in_progress: "Your application is being reviewed by the hiring team. Stay tuned!",
  interview:   "Congratulations! You have been selected for an interview. Check with your counselor for details.",
  rejected:    "This position hasn't moved forward. Don't be discouraged — your counselor is working on new opportunities.",
  offered:     "Incredible news! You've received a job offer. Please contact your counselor immediately to discuss next steps.",
};

// ─── Base email layout ─────────────────────────────────────────────────────────
function baseLayout(content: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>F1 Dream Jobs</title>
</head>
<body style="margin:0;padding:0;background:#F7F9FC;font-family:'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F9FC;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:580px;">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#0A0F1E 0%,#1a2744 100%);border-radius:20px 20px 0 0;padding:28px 32px;text-align:center;">
          <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
            <tr>
              <td style="vertical-align:middle;padding-right:12px;">
                <img src="https://f1-dream-crm-dashboard.vercel.app/logo.png" alt="F1 Dream Jobs" width="44" height="44" style="display:block;border-radius:12px;" />
              </td>
              <td style="vertical-align:middle;">
                <span style="color:#fff;font-size:20px;font-weight:700;letter-spacing:-0.3px;">F1 Dream Jobs</span>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#ffffff;padding:36px 32px;border-left:1px solid #E5E7EB;border-right:1px solid #E5E7EB;">
          ${content}
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#F9FAFB;border:1px solid #E5E7EB;border-top:none;border-radius:0 0 20px 20px;padding:20px 32px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#9CA3AF;line-height:1.6;">
            You're receiving this because you have an active account with F1 Dream Jobs.<br/>
            <a href="https://f1-dream-crm-dashboard.vercel.app" style="color:#0A6EBD;text-decoration:none;">Visit Dashboard</a>
            &nbsp;·&nbsp;
            <span style="color:#9CA3AF;">© 2025 F1 Dream Jobs. All rights reserved.</span>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── Template: Welcome ─────────────────────────────────────────────────────────
export function welcomeTemplate({
  name,
  role,
  email,
}: {
  name:  string;
  role:  string;
  email: string;
}) {
  const roleColor = role === "admin" ? "#7C3AED" : role === "counselor" ? "#0A6EBD" : "#059669";
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);

  const content = `
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#0A0F1E;letter-spacing:-0.5px;">Welcome to F1 Dream Jobs</h1>
    <p style="margin:0 0 28px;font-size:15px;color:#6B7280;line-height:1.6;">Hi ${name}, your account has been created successfully.</p>

    <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:14px;padding:20px 24px;margin-bottom:28px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:6px 0;font-size:13px;color:#9CA3AF;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;width:100px;">Email</td>
          <td style="padding:6px 0;font-size:14px;color:#0A0F1E;font-weight:500;">${email}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-size:13px;color:#9CA3AF;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Role</td>
          <td style="padding:6px 0;">
            <span style="background:${roleColor}15;color:${roleColor};font-size:12px;font-weight:700;padding:3px 10px;border-radius:6px;text-transform:capitalize;">${roleLabel}</span>
          </td>
        </tr>
      </table>
    </div>

    <p style="margin:0 0 24px;font-size:14px;color:#374151;line-height:1.7;">
      ${role === "student"
        ? "Your counselor will add job applications on your behalf. You can log in at any time to track the status of every application in real time."
        : role === "counselor"
        ? "You can now log in and start adding job applications for your assigned students. Students will be notified automatically on every update."
        : "You have full admin access to the F1 Dream Jobs CRM. You can create accounts, manage all users, and view complete analytics."}
    </p>

    <div style="text-align:center;margin-top:8px;">
      <a href="https://f1-dream-crm-dashboard.vercel.app/login" style="display:inline-block;background:#0A6EBD;color:#fff;font-size:14px;font-weight:600;padding:12px 28px;border-radius:12px;text-decoration:none;letter-spacing:-0.01em;">
        Sign In to Dashboard →
      </a>
    </div>
  `;

  return {
    subject: `Welcome to F1 Dream Jobs — your ${roleLabel} account is ready`,
    html:    baseLayout(content),
  };
}

// ─── Template: New Application ─────────────────────────────────────────────────
export function newApplicationTemplate({
  studentName,
  counselorName,
  companyName,
  jobRole,
  jobLink,
}: {
  studentName:   string;
  counselorName: string;
  companyName:   string;
  jobRole:       string;
  jobLink?:      string | null;
}) {
  const content = `
    <div style="margin-bottom:24px;">
      <div style="display:inline-block;background:#EFF6FF;border:1px solid #BFDBFE;border-radius:8px;padding:4px 12px;font-size:12px;font-weight:700;color:#2563EB;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:16px;">New Application</div>
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#0A0F1E;letter-spacing:-0.5px;">Application Submitted</h1>
      <p style="margin:0;font-size:15px;color:#6B7280;line-height:1.6;">Hi ${studentName}, your counselor has submitted a new job application on your behalf.</p>
    </div>

    <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:14px;padding:20px 24px;margin-bottom:28px;">
      <div style="margin-bottom:14px;">
        <div style="font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.6px;margin-bottom:4px;">Company</div>
        <div style="font-size:18px;font-weight:800;color:#0A0F1E;">${companyName}</div>
      </div>
      <div style="margin-bottom:14px;">
        <div style="font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.6px;margin-bottom:4px;">Role</div>
        <div style="font-size:15px;font-weight:600;color:#374151;">${jobRole}</div>
      </div>
      <div style="margin-bottom:0;">
        <div style="font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.6px;margin-bottom:4px;">Applied By</div>
        <div style="font-size:14px;color:#374151;">${counselorName}</div>
      </div>
    </div>

    ${jobLink ? `<p style="margin:0 0 24px;font-size:14px;color:#6B7280;">View the job posting: <a href="${jobLink}" style="color:#0A6EBD;font-weight:600;">${jobLink}</a></p>` : ""}

    <p style="margin:0 0 24px;font-size:14px;color:#374151;line-height:1.7;">
      We'll notify you every time the status changes. Log in to your dashboard to view all your applications in one place.
    </p>

    <div style="text-align:center;">
      <a href="https://f1-dream-crm-dashboard.vercel.app/student" style="display:inline-block;background:#0A6EBD;color:#fff;font-size:14px;font-weight:600;padding:12px 28px;border-radius:12px;text-decoration:none;">
        View in Dashboard →
      </a>
    </div>
  `;

  return {
    subject: `New application submitted — ${companyName} · ${jobRole}`,
    html:    baseLayout(content),
  };
}

// ─── Template: Status Change ───────────────────────────────────────────────────
export function statusChangeTemplate({
  studentName,
  companyName,
  jobRole,
  oldStatus,
  newStatus,
}: {
  studentName: string;
  companyName: string;
  jobRole:     string;
  oldStatus:   string;
  newStatus:   string;
}) {
  const color   = STATUS_COLOR[newStatus]   ?? "#0A6EBD";
  const bg      = STATUS_BG[newStatus]      ?? "#EFF6FF";
  const label   = STATUS_LABEL[newStatus]   ?? newStatus;
  const message = STATUS_MESSAGE[newStatus] ?? "Your application status has been updated.";
  const oldLabel = STATUS_LABEL[oldStatus]  ?? oldStatus;

  const isOffer    = newStatus === "offered";
  const isInterview = newStatus === "interview";

  const content = `
    <div style="margin-bottom:24px;">
      <div style="display:inline-block;background:${bg};border:1px solid ${color}30;border-radius:8px;padding:4px 12px;font-size:12px;font-weight:700;color:${color};text-transform:uppercase;letter-spacing:0.5px;margin-bottom:16px;">Status Update</div>
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#0A0F1E;letter-spacing:-0.5px;">
        ${isOffer ? "You received an offer!" : isInterview ? "Interview scheduled!" : "Application update"}
      </h1>
      <p style="margin:0;font-size:15px;color:#6B7280;line-height:1.6;">Hi ${studentName}, here's the latest on your application.</p>
    </div>

    <!-- Company card -->
    <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:14px;padding:20px 24px;margin-bottom:20px;">
      <div style="margin-bottom:12px;">
        <div style="font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.6px;margin-bottom:4px;">Company</div>
        <div style="font-size:18px;font-weight:800;color:#0A0F1E;">${companyName}</div>
      </div>
      <div>
        <div style="font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.6px;margin-bottom:4px;">Role</div>
        <div style="font-size:15px;font-weight:600;color:#374151;">${jobRole}</div>
      </div>
    </div>

    <!-- Status change -->
    <div style="display:table;width:100%;margin-bottom:24px;">
      <div style="display:table-cell;width:44%;text-align:center;vertical-align:middle;background:#F9FAFB;border:1px solid #E5E7EB;border-radius:12px;padding:14px 10px;">
        <div style="font-size:10px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Previous</div>
        <span style="font-size:13px;font-weight:600;color:#6B7280;">${oldLabel}</span>
      </div>
      <div style="display:table-cell;width:12%;text-align:center;vertical-align:middle;font-size:20px;color:#9CA3AF;">→</div>
      <div style="display:table-cell;width:44%;text-align:center;vertical-align:middle;background:${bg};border:1px solid ${color}25;border-radius:12px;padding:14px 10px;">
        <div style="font-size:10px;font-weight:700;color:${color};text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Now</div>
        <span style="font-size:13px;font-weight:700;color:${color};">${label}</span>
      </div>
    </div>

    <p style="margin:0 0 28px;font-size:14px;color:#374151;line-height:1.7;background:${bg};border-left:3px solid ${color};border-radius:0 8px 8px 0;padding:14px 16px;">
      ${message}
    </p>

    <div style="text-align:center;">
      <a href="https://f1-dream-crm-dashboard.vercel.app/student" style="display:inline-block;background:${color};color:#fff;font-size:14px;font-weight:600;padding:12px 28px;border-radius:12px;text-decoration:none;">
        View in Dashboard →
      </a>
    </div>
  `;

  return {
    subject: `${isOffer ? "🎯 Offer received" : isInterview ? "Interview scheduled" : "Status update"} — ${companyName} · ${jobRole}`,
    html:    baseLayout(content),
  };
}

// ─── Sender helpers ────────────────────────────────────────────────────────────
export async function sendWelcomeEmail(to: string, data: Parameters<typeof welcomeTemplate>[0]) {
  const { subject, html } = welcomeTemplate(data);
  return getResend().emails.send({ from: FROM, to, subject, html });
}

export async function sendNewApplicationEmail(to: string, data: Parameters<typeof newApplicationTemplate>[0]) {
  const { subject, html } = newApplicationTemplate(data);
  return getResend().emails.send({ from: FROM, to, subject, html });
}

export async function sendStatusChangeEmail(to: string, data: Parameters<typeof statusChangeTemplate>[0]) {
  const { subject, html } = statusChangeTemplate(data);
  return getResend().emails.send({ from: FROM, to, subject, html });
}
