import { useState, useEffect, useCallback } from "react";

// ═══════════════════════════════════════════
// DATA LAYER
// ═══════════════════════════════════════════
const USERS = {
  admin: { id: "u1", name: "Raj Mehta", email: "admin@consultpro.com", role: "admin", avatar: "RM" },
  counselor1: { id: "u2", name: "Priya Sharma", email: "priya@consultpro.com", role: "counselor", avatar: "PS" },
  counselor2: { id: "u3", name: "Amit Patel", email: "amit@consultpro.com", role: "counselor", avatar: "AP" },
  student1: { id: "u4", name: "Sarah Mitchell", email: "sarah@student.com", role: "student", avatar: "SM", counselor: "u2" },
  student2: { id: "u5", name: "David Chen", email: "david@student.com", role: "student", avatar: "DC", counselor: "u2" },
  student3: { id: "u6", name: "Emily Rodriguez", email: "emily@student.com", role: "student", avatar: "ER", counselor: "u3" },
};

const initApps = () => [
  { id: "a1", studentId: "u4", company: "Google", role: "Software Engineer Intern", jd: "Build scalable microservices with Go and Python. Work with distributed systems team on search infrastructure.", resume: "sarah_resume_v3.pdf", link: "https://careers.google.com/jobs/12345", status: "interview", appliedBy: "u2", appliedAt: "2026-03-28 09:15 AM", updatedAt: "2026-03-29 02:30 PM" },
  { id: "a2", studentId: "u4", company: "Microsoft", role: "Data Analyst", jd: "Analyze product telemetry data using SQL and Python. Create dashboards in Power BI for executive reporting.", resume: "sarah_resume_v3.pdf", link: "https://careers.microsoft.com/jobs/67890", status: "applied", appliedBy: "u2", appliedAt: "2026-03-27 11:00 AM", updatedAt: "2026-03-27 11:00 AM" },
  { id: "a3", studentId: "u4", company: "Amazon", role: "Product Manager Intern", jd: "Drive feature roadmap for Alexa Smart Home. Collaborate with engineering and design teams.", resume: "sarah_pm_resume.pdf", link: "https://amazon.jobs/pm-intern", status: "in_progress", appliedBy: "u3", appliedAt: "2026-03-29 08:45 AM", updatedAt: "2026-03-29 08:45 AM" },
  { id: "a4", studentId: "u4", company: "Apple", role: "UX Designer", jd: "Design next-generation interfaces for Apple Health. Conduct user research and create high-fidelity prototypes.", resume: "sarah_ux_portfolio.pdf", link: "https://apple.com/careers/ux", status: "rejected", appliedBy: "u2", appliedAt: "2026-03-20 10:30 AM", updatedAt: "2026-03-26 04:00 PM" },
  { id: "a5", studentId: "u5", company: "Meta", role: "ML Engineer Intern", jd: "Build recommendation models for Instagram Reels using PyTorch. Optimize inference latency for production.", resume: "david_ml_resume.pdf", link: "https://metacareers.com/ml-intern", status: "applied", appliedBy: "u2", appliedAt: "2026-03-28 03:00 PM", updatedAt: "2026-03-28 03:00 PM" },
  { id: "a6", studentId: "u5", company: "Netflix", role: "Backend Developer", jd: "Build content delivery APIs using Java and Spring Boot. Scale systems serving 200M+ subscribers.", resume: "david_backend_resume.pdf", link: "https://netflix.com/careers/backend", status: "interview", appliedBy: "u2", appliedAt: "2026-03-22 09:00 AM", updatedAt: "2026-03-28 01:00 PM" },
  { id: "a7", studentId: "u6", company: "Tesla", role: "Embedded Systems Intern", jd: "Develop firmware for Battery Management System. C/C++ on RTOS platform.", resume: "emily_embedded_resume.pdf", link: "https://tesla.com/careers/embed", status: "applied", appliedBy: "u3", appliedAt: "2026-03-27 02:15 PM", updatedAt: "2026-03-27 02:15 PM" },
  { id: "a8", studentId: "u6", company: "SpaceX", role: "Avionics Engineer", jd: "Design PCB layouts for flight computer systems. Perform hardware-in-the-loop testing.", resume: "emily_avionics_resume.pdf", link: "https://spacex.com/careers/avionics", status: "in_progress", appliedBy: "u3", appliedAt: "2026-03-25 10:00 AM", updatedAt: "2026-03-29 09:30 AM" },
];

const STATUS = {
  applied: { label: "Applied", color: "#3b82f6", bg: "rgba(59,130,246,0.08)", icon: "📨" },
  in_progress: { label: "In Progress", color: "#f59e0b", bg: "rgba(245,158,11,0.08)", icon: "⚙️" },
  interview: { label: "Interview", color: "#10b981", bg: "rgba(16,185,129,0.08)", icon: "🎯" },
  rejected: { label: "Rejected", color: "#ef4444", bg: "rgba(239,68,68,0.06)", icon: "✕" },
  offered: { label: "Offered", color: "#8b5cf6", bg: "rgba(139,92,246,0.08)", icon: "🎉" },
};

// ═══════════════════════════════════════════
// STYLE CONSTANTS
// ═══════════════════════════════════════════
const font = "'Outfit', 'General Sans', system-ui, sans-serif";
const ease = "cubic-bezier(.4,0,.2,1)";

const glass = {
  background: "rgba(255,255,255,0.5)",
  backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.65)",
  borderRadius: 18,
  boxShadow: "0 4px 24px rgba(0,0,0,0.03), 0 1px 3px rgba(0,0,0,0.02)",
};

const glassHover = {
  ...glass,
  cursor: "pointer",
  transition: `all 0.4s ${ease}`,
};

// ═══════════════════════════════════════════
// SHARED COMPONENTS
// ═══════════════════════════════════════════
function Blobs() {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden", pointerEvents: "none" }}>
      <div style={{ position: "absolute", width: 520, height: 520, top: "-8%", right: "-6%", borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)", animation: "blobA 20s ease-in-out infinite" }} />
      <div style={{ position: "absolute", width: 440, height: 440, bottom: "-4%", left: "-5%", borderRadius: "50%", background: "radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 70%)", animation: "blobB 25s ease-in-out infinite" }} />
      <div style={{ position: "absolute", width: 320, height: 320, top: "35%", left: "45%", borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.04) 0%, transparent 70%)", animation: "blobC 17s ease-in-out infinite" }} />
    </div>
  );
}

function Badge({ status }) {
  const s = STATUS[status];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 650, padding: "4px 10px", borderRadius: 8, background: s.bg, color: s.color, letterSpacing: 0.3, whiteSpace: "nowrap" }}>
      <span style={{ fontSize: 10 }}>{s.icon}</span> {s.label}
    </span>
  );
}

function Avatar({ initials, size = 36, color = "#3b82f6" }) {
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.32, background: `linear-gradient(135deg, ${color}15, ${color}08)`, border: `1.5px solid ${color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.31, fontWeight: 700, color, flexShrink: 0 }}>
      {initials}
    </div>
  );
}

function StatCard({ icon, value, label, delay = 0 }) {
  const [show, setShow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShow(true), 80 + delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div style={{ ...glass, padding: "18px 16px", textAlign: "center", opacity: show ? 1 : 0, transform: show ? "translateY(0)" : "translateY(14px)", transition: `all 0.55s ${ease}` }}>
      <div style={{ fontSize: 20, marginBottom: 2 }}>{icon}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: "#1e293b", lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 10.5, color: "#94a3b8", fontWeight: 600, marginTop: 4, textTransform: "uppercase", letterSpacing: 0.6 }}>{label}</div>
    </div>
  );
}

function Header({ user, onLogout, onBack, subtitle }) {
  return (
    <div style={{ position: "sticky", top: 0, zIndex: 10, background: "rgba(248,250,255,0.72)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(255,255,255,0.5)", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {onBack && <button onClick={onBack} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", padding: "2px 6px", color: "#64748b" }}>←</button>}
        <div style={{ width: 34, height: 34, borderRadius: 11, background: "linear-gradient(135deg, #3b82f6, #10b981)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 3px 12px rgba(59,130,246,0.2)" }}>
          <span style={{ color: "#fff", fontSize: 13, fontWeight: 800 }}>CP</span>
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>ConsultPro</div>
          <div style={{ fontSize: 10.5, color: "#94a3b8", fontWeight: 500 }}>{subtitle || user.role.charAt(0).toUpperCase() + user.role.slice(1) + " Portal"}</div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>{user.name}</span>
        <button onClick={onLogout} style={{ padding: "6px 14px", borderRadius: 9, border: "1px solid rgba(0,0,0,0.06)", background: "rgba(255,255,255,0.5)", color: "#64748b", fontSize: 11, fontWeight: 600, cursor: "pointer", transition: `all 0.3s ${ease}` }}
          onMouseEnter={e => { e.target.style.background = "rgba(239,68,68,0.06)"; e.target.style.color = "#ef4444"; }}
          onMouseLeave={e => { e.target.style.background = "rgba(255,255,255,0.5)"; e.target.style.color = "#64748b"; }}
        >Logout</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// LOGIN SCREEN
// ═══════════════════════════════════════════
function LoginScreen({ onLogin }) {
  const [show, setShow] = useState(false);
  useEffect(() => { setTimeout(() => setShow(true), 100); }, []);

  const roles = [
    { key: "admin", user: USERS.admin, desc: "Full system access", color: "#8b5cf6", icon: "👑" },
    { key: "counselor1", user: USERS.counselor1, desc: "Add & manage applications", color: "#3b82f6", icon: "📋" },
    { key: "student1", user: USERS.student1, desc: "View your applications", color: "#10b981", icon: "🎓" },
  ];

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(155deg, #f8faff 0%, #f0f5ff 40%, #f5f3ff 100%)", fontFamily: font, position: "relative" }}>
      <Blobs />
      <div style={{ zIndex: 1, width: "100%", maxWidth: 400, padding: "0 20px", opacity: show ? 1 : 0, transform: show ? "translateY(0) scale(1)" : "translateY(24px) scale(0.97)", transition: `all 0.7s ${ease}` }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 52, height: 52, borderRadius: 15, margin: "0 auto 14px", background: "linear-gradient(135deg, #3b82f6, #10b981)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 20px rgba(59,130,246,0.25)", animation: "float 4s ease-in-out infinite" }}>
            <span style={{ color: "#fff", fontSize: 20, fontWeight: 800 }}>CP</span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1e293b", margin: 0, letterSpacing: "-0.4px" }}>ConsultPro CRM</h1>
          <p style={{ color: "#94a3b8", fontSize: 13, marginTop: 4 }}>Select a role to explore the dashboard</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {roles.map((r, i) => (
            <div key={r.key} onClick={() => onLogin(r.user)}
              style={{ ...glassHover, padding: "18px 20px", display: "flex", alignItems: "center", gap: 14, animation: `fadeUp 0.45s ${ease} ${i * 0.08}s both` }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 30px rgba(0,0,0,0.06)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = glass.boxShadow; }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 13, background: `${r.color}10`, border: `1.5px solid ${r.color}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{r.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>{r.user.name}</div>
                <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 1 }}>{r.desc}</div>
              </div>
              <span style={{ fontSize: 16, color: "#cbd5e1" }}>→</span>
            </div>
          ))}
        </div>
        <p style={{ textAlign: "center", fontSize: 11, color: "#cbd5e1", marginTop: 20 }}>Live Demo — All data is simulated</p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// STUDENT DASHBOARD
// ═══════════════════════════════════════════
function StudentDashboard({ user, apps, onLogout }) {
  const [expanded, setExpanded] = useState(null);
  const [filter, setFilter] = useState("all");
  const myApps = apps.filter(a => a.studentId === user.id);
  const filtered = filter === "all" ? myApps : myApps.filter(a => a.status === filter);

  const counts = { total: myApps.length, applied: myApps.filter(a => a.status === "applied").length, in_progress: myApps.filter(a => a.status === "in_progress").length, interview: myApps.filter(a => a.status === "interview").length, rejected: myApps.filter(a => a.status === "rejected").length };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(155deg, #f8faff 0%, #f0f5ff 40%, #f5f3ff 100%)", fontFamily: font, position: "relative" }}>
      <Blobs />
      <Header user={user} onLogout={onLogout} />
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "20px 16px 60px", position: "relative", zIndex: 1 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1e293b", margin: "0 0 4px" }}>Hi {user.name.split(" ")[0]} 👋</h2>
        <p style={{ fontSize: 13, color: "#94a3b8", margin: "0 0 20px" }}>Here's everything we're doing for you — full transparency.</p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 22 }}>
          <StatCard icon="📨" value={counts.applied} label="Applied" delay={0} />
          <StatCard icon="⚙️" value={counts.in_progress} label="In Progress" delay={70} />
          <StatCard icon="🎯" value={counts.interview} label="Interview" delay={140} />
          <StatCard icon="📊" value={counts.total} label="Total" delay={210} />
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 5, marginBottom: 16, flexWrap: "wrap" }}>
          {[{ k: "all", l: "All" }, ...Object.entries(STATUS).map(([k, v]) => ({ k, l: v.label }))].map(f => (
            <button key={f.k} onClick={() => { setFilter(f.k); setExpanded(null); }}
              style={{ padding: "6px 14px", borderRadius: 9, border: "none", fontSize: 11, fontWeight: 650, cursor: "pointer", transition: `all 0.3s ${ease}`, background: filter === f.k ? "linear-gradient(135deg, #3b82f6, #10b981)" : "rgba(255,255,255,0.45)", color: filter === f.k ? "#fff" : "#64748b", boxShadow: filter === f.k ? "0 3px 12px rgba(59,130,246,0.2)" : "none" }}
            >{f.l}</button>
          ))}
        </div>

        {/* Application Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((app, i) => {
            const isOpen = expanded === app.id;
            const counselor = Object.values(USERS).find(u => u.id === app.appliedBy);
            return (
              <div key={app.id} onClick={() => setExpanded(isOpen ? null : app.id)}
                style={{ ...glassHover, padding: 0, overflow: "hidden", border: isOpen ? "1.5px solid rgba(59,130,246,0.15)" : glass.border, animation: `fadeUp 0.4s ${ease} ${i * 0.06}s both` }}
                onMouseEnter={e => { if (!isOpen) e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
              >
                {/* Main Row */}
                <div style={{ padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: `${STATUS[app.status].color}08`, border: `1.5px solid ${STATUS[app.status].color}12`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 800, color: STATUS[app.status].color, flexShrink: 0 }}>
                    {app.company[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>{app.company}</span>
                      <Badge status={app.status} />
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{app.role}</div>
                    <div style={{ fontSize: 10.5, color: "#cbd5e1", marginTop: 3 }}>Applied by {counselor?.name || "Team"} • {app.appliedAt}</div>
                  </div>
                  <span style={{ fontSize: 14, color: "#cbd5e1", transition: `transform 0.3s ${ease}`, transform: isOpen ? "rotate(90deg)" : "rotate(0)" }}>›</span>
                </div>

                {/* Expanded Detail */}
                <div style={{ maxHeight: isOpen ? 300 : 0, overflow: "hidden", transition: `max-height 0.45s ${ease}`, borderTop: isOpen ? "1px solid rgba(0,0,0,0.04)" : "none" }}>
                  <div style={{ padding: "14px 18px 18px" }}>
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 10.5, fontWeight: 650, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 5 }}>Job Description</div>
                      <p style={{ fontSize: 12.5, color: "#475569", lineHeight: 1.55, margin: 0 }}>{app.jd}</p>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <div style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(59,130,246,0.04)" }}>
                        <div style={{ fontSize: 10, fontWeight: 650, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 }}>Resume Used</div>
                        <div style={{ fontSize: 12, color: "#3b82f6", fontWeight: 600, marginTop: 3 }}>📄 {app.resume}</div>
                      </div>
                      <div style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(16,185,129,0.04)" }}>
                        <div style={{ fontSize: 10, fontWeight: 650, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 }}>Last Updated</div>
                        <div style={{ fontSize: 12, color: "#10b981", fontWeight: 600, marginTop: 3 }}>🕐 {app.updatedAt}</div>
                      </div>
                    </div>
                    <a href={app.link} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                      style={{ display: "inline-block", marginTop: 10, fontSize: 11, color: "#3b82f6", fontWeight: 600, textDecoration: "none" }}>
                      View Job Posting →
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && <div style={{ textAlign: "center", padding: 40, color: "#cbd5e1", fontSize: 13 }}>No applications in this category</div>}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// COUNSELOR DASHBOARD
// ═══════════════════════════════════════════
function CounselorDashboard({ user, apps, setApps, onLogout }) {
  const [view, setView] = useState("dashboard");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ studentId: "", company: "", role: "", jd: "", resume: "", link: "", status: "applied" });
  const [toast, setToast] = useState(null);
  const [editingStatus, setEditingStatus] = useState(null);

  const myStudents = Object.values(USERS).filter(u => u.role === "student" && u.counselor === user.id);
  const myStudentIds = myStudents.map(s => s.id);
  const myApps = apps.filter(a => myStudentIds.includes(a.studentId));

  const showToast = useCallback((msg) => { setToast(msg); setTimeout(() => setToast(null), 2500); }, []);

  const handleSubmit = () => {
    if (!form.studentId || !form.company || !form.role) { showToast("⚠️ Fill required fields"); return; }
    const newApp = { ...form, id: "a" + Date.now(), appliedBy: user.id, appliedAt: new Date().toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true }), updatedAt: new Date().toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true }) };
    setApps(prev => [newApp, ...prev]);
    setForm({ studentId: "", company: "", role: "", jd: "", resume: "", link: "", status: "applied" });
    setShowForm(false);
    showToast("✅ Application added successfully");
  };

  const handleStatusChange = (appId, newStatus) => {
    setApps(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus, updatedAt: new Date().toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true }) } : a));
    setEditingStatus(null);
    showToast(`✅ Status updated to ${STATUS[newStatus].label}`);
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(155deg, #f8faff 0%, #f0f5ff 40%, #f5f3ff 100%)", fontFamily: font, position: "relative" }}>
      <Blobs />
      <Header user={user} onLogout={onLogout} subtitle="Counselor Portal" />

      {/* Toast */}
      {toast && <div style={{ position: "fixed", top: 16, right: 16, zIndex: 100, ...glass, padding: "12px 20px", fontSize: 13, fontWeight: 600, color: "#1e293b", animation: `fadeUp 0.35s ${ease}`, boxShadow: "0 8px 30px rgba(0,0,0,0.08)" }}>{toast}</div>}

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "20px 16px 60px", position: "relative", zIndex: 1 }}>
        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1e293b", margin: 0 }}>Counselor Dashboard</h2>
            <p style={{ fontSize: 13, color: "#94a3b8", margin: "2px 0 0" }}>{myStudents.length} students • {myApps.length} applications</p>
          </div>
          <button onClick={() => setShowForm(true)}
            style={{ padding: "10px 20px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #3b82f6, #10b981)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(59,130,246,0.25)", transition: `all 0.3s ${ease}` }}
            onMouseEnter={e => e.target.style.transform = "translateY(-1px)"}
            onMouseLeave={e => e.target.style.transform = "translateY(0)"}
          >+ Add Application</button>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginBottom: 22 }}>
          <StatCard icon="👥" value={myStudents.length} label="Students" delay={0} />
          <StatCard icon="📨" value={myApps.filter(a => a.status === "applied").length} label="Applied" delay={60} />
          <StatCard icon="⚙️" value={myApps.filter(a => a.status === "in_progress").length} label="In Progress" delay={120} />
          <StatCard icon="🎯" value={myApps.filter(a => a.status === "interview").length} label="Interview" delay={180} />
          <StatCard icon="📊" value={myApps.length} label="Total" delay={240} />
        </div>

        {/* Application Table */}
        <div style={{ ...glass, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(0,0,0,0.04)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>All Applications</span>
            <span style={{ fontSize: 11, color: "#94a3b8" }}>{myApps.length} records</span>
          </div>
          {/* Table Header */}
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.5fr 1.2fr 0.8fr 0.8fr", padding: "10px 18px", background: "rgba(0,0,0,0.01)", borderBottom: "1px solid rgba(0,0,0,0.03)" }}>
            {["Student", "Company / Role", "Resume", "Status", "Date"].map(h => (
              <span key={h} style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.6 }}>{h}</span>
            ))}
          </div>
          {/* Rows */}
          {myApps.map((app, i) => {
            const student = Object.values(USERS).find(u => u.id === app.studentId);
            return (
              <div key={app.id} style={{ display: "grid", gridTemplateColumns: "1.2fr 1.5fr 1.2fr 0.8fr 0.8fr", padding: "12px 18px", borderBottom: "1px solid rgba(0,0,0,0.02)", alignItems: "center", transition: `background 0.2s ${ease}`, animation: `fadeUp 0.35s ${ease} ${i * 0.04}s both`, cursor: "default" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(59,130,246,0.02)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Avatar initials={student?.avatar || "?"} size={28} />
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: "#1e293b" }}>{student?.name}</span>
                </div>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: "#1e293b" }}>{app.company}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>{app.role}</div>
                </div>
                <span style={{ fontSize: 11, color: "#64748b" }}>📄 {app.resume || "—"}</span>
                <div style={{ position: "relative" }}>
                  <div onClick={(e) => { e.stopPropagation(); setEditingStatus(editingStatus === app.id ? null : app.id); }} style={{ cursor: "pointer" }}>
                    <Badge status={app.status} />
                  </div>
                  {editingStatus === app.id && (
                    <div style={{ position: "absolute", top: "100%", left: 0, marginTop: 4, ...glass, padding: 6, zIndex: 20, minWidth: 130, animation: `fadeUp 0.25s ${ease}` }}>
                      {Object.entries(STATUS).map(([k, v]) => (
                        <div key={k} onClick={(e) => { e.stopPropagation(); handleStatusChange(app.id, k); }}
                          style={{ padding: "6px 10px", borderRadius: 7, fontSize: 11, fontWeight: 600, color: v.color, cursor: "pointer", transition: `background 0.2s ${ease}` }}
                          onMouseEnter={e => e.target.style.background = v.bg}
                          onMouseLeave={e => e.target.style.background = "transparent"}
                        >{v.icon} {v.label}</div>
                      ))}
                    </div>
                  )}
                </div>
                <span style={{ fontSize: 11, color: "#94a3b8" }}>{app.appliedAt.split(" ").slice(0, 3).join(" ")}</span>
              </div>
            );
          })}
        </div>

        {/* Add Application Modal */}
        {showForm && (
          <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.12)", backdropFilter: "blur(6px)", animation: `fadeIn 0.3s ${ease}` }}
            onClick={() => setShowForm(false)}>
            <div style={{ ...glass, width: "100%", maxWidth: 480, padding: "28px 24px", margin: 16, background: "rgba(255,255,255,0.85)", animation: `fadeUp 0.4s ${ease}` }}
              onClick={e => e.stopPropagation()}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: "#1e293b", margin: "0 0 20px" }}>Add New Application</h3>

              {/* Student Select */}
              <label style={{ fontSize: 10.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.6 }}>Student *</label>
              <select value={form.studentId} onChange={e => setForm(p => ({ ...p, studentId: e.target.value }))}
                style={{ width: "100%", padding: "11px 12px", marginTop: 4, marginBottom: 14, border: "1.5px solid rgba(59,130,246,0.12)", borderRadius: 10, fontSize: 13, outline: "none", background: "rgba(255,255,255,0.6)", color: "#1e293b", boxSizing: "border-box" }}>
                <option value="">Select student</option>
                {myStudents.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>

              {[
                { key: "company", label: "Company *", ph: "e.g. Google" },
                { key: "role", label: "Role *", ph: "e.g. Software Engineer Intern" },
                { key: "link", label: "Job Link", ph: "https://careers.google.com/..." },
                { key: "resume", label: "Resume File", ph: "e.g. sarah_resume_v3.pdf" },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: 10.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.6 }}>{f.label}</label>
                  <input value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.ph}
                    style={{ width: "100%", padding: "11px 12px", marginTop: 4, marginBottom: 14, border: "1.5px solid rgba(59,130,246,0.12)", borderRadius: 10, fontSize: 13, outline: "none", background: "rgba(255,255,255,0.6)", color: "#1e293b", boxSizing: "border-box", transition: `border 0.3s ${ease}` }}
                    onFocus={e => e.target.style.borderColor = "rgba(59,130,246,0.35)"}
                    onBlur={e => e.target.style.borderColor = "rgba(59,130,246,0.12)"}
                  />
                </div>
              ))}

              <label style={{ fontSize: 10.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.6 }}>Job Description</label>
              <textarea value={form.jd} onChange={e => setForm(p => ({ ...p, jd: e.target.value }))} rows={3} placeholder="Paste JD here..."
                style={{ width: "100%", padding: "11px 12px", marginTop: 4, marginBottom: 18, border: "1.5px solid rgba(59,130,246,0.12)", borderRadius: 10, fontSize: 13, outline: "none", background: "rgba(255,255,255,0.6)", color: "#1e293b", resize: "vertical", fontFamily: font, boxSizing: "border-box" }} />

              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: "12px", borderRadius: 11, border: "1px solid rgba(0,0,0,0.06)", background: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: 600, color: "#64748b", cursor: "pointer" }}>Cancel</button>
                <button onClick={handleSubmit} style={{ flex: 1, padding: "12px", borderRadius: 11, border: "none", background: "linear-gradient(135deg, #3b82f6, #10b981)", fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", boxShadow: "0 4px 14px rgba(59,130,246,0.25)" }}>Submit Application</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// ADMIN DASHBOARD
// ═══════════════════════════════════════════
function AdminDashboard({ user, apps, setApps, onLogout }) {
  const [viewStudent, setViewStudent] = useState(null);

  const allStudents = Object.values(USERS).filter(u => u.role === "student");
  const allCounselors = Object.values(USERS).filter(u => u.role === "counselor");
  const todayApps = apps.filter(a => a.appliedAt.includes("Mar 29") || a.appliedAt.includes("Mar 28"));

  if (viewStudent) {
    const sApps = apps.filter(a => a.studentId === viewStudent.id);
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(155deg, #f8faff 0%, #f0f5ff 40%, #f5f3ff 100%)", fontFamily: font, position: "relative" }}>
        <Blobs />
        <Header user={user} onLogout={onLogout} subtitle={`Viewing: ${viewStudent.name}`} onBack={() => setViewStudent(null)} />
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "20px 16px 60px", position: "relative", zIndex: 1 }}>
          <div style={{ ...glass, padding: "20px", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <Avatar initials={viewStudent.avatar} size={48} color="#8b5cf6" />
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: "#1e293b", margin: 0 }}>{viewStudent.name}</h3>
                <p style={{ fontSize: 12, color: "#94a3b8", margin: "2px 0 0" }}>{viewStudent.email} • {sApps.length} applications</p>
              </div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
            {Object.entries(STATUS).map(([k, v], i) => (
              <StatCard key={k} icon={v.icon} value={sApps.filter(a => a.status === k).length} label={v.label} delay={i * 60} />
            ))}
          </div>
          {sApps.map((app, i) => {
            const counselor = Object.values(USERS).find(u => u.id === app.appliedBy);
            return (
              <div key={app.id} style={{ ...glass, padding: "14px 18px", marginBottom: 8, animation: `fadeUp 0.35s ${ease} ${i * 0.05}s both` }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>{app.company}</span>
                    <span style={{ fontSize: 12, color: "#94a3b8", marginLeft: 8 }}>{app.role}</span>
                  </div>
                  <Badge status={app.status} />
                </div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 6 }}>
                  Applied by {counselor?.name} • {app.appliedAt} • Resume: {app.resume || "—"}
                </div>
                {app.jd && <p style={{ fontSize: 12, color: "#64748b", margin: "8px 0 0", lineHeight: 1.5 }}>{app.jd}</p>}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(155deg, #f8faff 0%, #f0f5ff 40%, #f5f3ff 100%)", fontFamily: font, position: "relative" }}>
      <Blobs />
      <Header user={user} onLogout={onLogout} subtitle="Admin — Full Access" />
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "20px 16px 60px", position: "relative", zIndex: 1 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1e293b", margin: "0 0 4px" }}>Admin Overview 👑</h2>
        <p style={{ fontSize: 13, color: "#94a3b8", margin: "0 0 20px" }}>Complete system visibility — all students, counselors, and applications.</p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 22 }}>
          <StatCard icon="🎓" value={allStudents.length} label="Students" delay={0} />
          <StatCard icon="📋" value={allCounselors.length} label="Counselors" delay={70} />
          <StatCard icon="📊" value={apps.length} label="Total Apps" delay={140} />
          <StatCard icon="🔥" value={todayApps.length} label="Recent (2d)" delay={210} />
        </div>

        {/* Pipeline Overview */}
        <div style={{ ...glass, padding: "18px 20px", marginBottom: 18 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", margin: "0 0 14px" }}>Application Pipeline</h3>
          <div style={{ display: "flex", gap: 6 }}>
            {Object.entries(STATUS).map(([k, v]) => {
              const count = apps.filter(a => a.status === k).length;
              const pct = apps.length > 0 ? (count / apps.length) * 100 : 0;
              return (
                <div key={k} style={{ flex: Math.max(pct, 8), transition: `flex 0.6s ${ease}` }}>
                  <div style={{ height: 32, borderRadius: 8, background: `${v.color}18`, display: "flex", alignItems: "center", justifyContent: "center", transition: `all 0.4s ${ease}` }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: v.color }}>{count}</span>
                  </div>
                  <div style={{ fontSize: 9.5, fontWeight: 650, color: "#94a3b8", textAlign: "center", marginTop: 5, textTransform: "uppercase", letterSpacing: 0.3 }}>{v.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Counselor Cards */}
        <h3 style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", margin: "0 0 10px" }}>Team Performance</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 22 }}>
          {allCounselors.map((c, i) => {
            const cStudents = allStudents.filter(s => s.counselor === c.id);
            const cApps = apps.filter(a => cStudents.map(s => s.id).includes(a.studentId));
            return (
              <div key={c.id} style={{ ...glass, padding: "16px 18px", animation: `fadeUp 0.4s ${ease} ${i * 0.08}s both` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <Avatar initials={c.avatar} size={36} color="#3b82f6" />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>{c.email}</div>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                  <div style={{ textAlign: "center", padding: "6px", borderRadius: 8, background: "rgba(59,130,246,0.04)" }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#3b82f6" }}>{cStudents.length}</div>
                    <div style={{ fontSize: 9, color: "#94a3b8", fontWeight: 600 }}>Students</div>
                  </div>
                  <div style={{ textAlign: "center", padding: "6px", borderRadius: 8, background: "rgba(16,185,129,0.04)" }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#10b981" }}>{cApps.length}</div>
                    <div style={{ fontSize: 9, color: "#94a3b8", fontWeight: 600 }}>Apps</div>
                  </div>
                  <div style={{ textAlign: "center", padding: "6px", borderRadius: 8, background: "rgba(245,158,11,0.04)" }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#f59e0b" }}>{cApps.filter(a => a.status === "interview").length}</div>
                    <div style={{ fontSize: 9, color: "#94a3b8", fontWeight: 600 }}>Interviews</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* All Students */}
        <h3 style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", margin: "0 0 10px" }}>All Students</h3>
        <div style={{ ...glass, overflow: "hidden" }}>
          {allStudents.map((s, i) => {
            const sApps = apps.filter(a => a.studentId === s.id);
            const counselor = Object.values(USERS).find(u => u.id === s.counselor);
            return (
              <div key={s.id} onClick={() => setViewStudent(s)}
                style={{ display: "flex", alignItems: "center", padding: "14px 18px", borderBottom: "1px solid rgba(0,0,0,0.03)", cursor: "pointer", transition: `background 0.2s ${ease}`, animation: `fadeUp 0.35s ${ease} ${i * 0.06}s both` }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(59,130,246,0.02)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <Avatar initials={s.avatar} size={34} color="#10b981" />
                <div style={{ flex: 1, marginLeft: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>Counselor: {counselor?.name || "—"}</div>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  {Object.entries(STATUS).map(([k, v]) => {
                    const c = sApps.filter(a => a.status === k).length;
                    return c > 0 ? <span key={k} style={{ fontSize: 10, fontWeight: 700, padding: "3px 7px", borderRadius: 6, background: v.bg, color: v.color }}>{c} {v.label}</span> : null;
                  })}
                </div>
                <span style={{ fontSize: 16, color: "#cbd5e1", marginLeft: 10 }}>→</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// APP ROOT
// ═══════════════════════════════════════════
export default function App() {
  const [user, setUser] = useState(null);
  const [apps, setApps] = useState(initApps);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
        @keyframes blobA { 0%,100%{transform:translate(0,0) scale(1);border-radius:50%} 33%{transform:translate(-25px,15px) scale(1.08);border-radius:46% 54% 50% 50%} 66%{transform:translate(15px,-20px) scale(0.94);border-radius:54% 46% 48% 52%} }
        @keyframes blobB { 0%,100%{transform:translate(0,0) scale(1);border-radius:50%} 50%{transform:translate(20px,-15px) scale(1.06);border-radius:50% 50% 45% 55%} }
        @keyframes blobC { 0%,100%{transform:translate(0,0) scale(1);border-radius:50%} 50%{transform:translate(-18px,12px) scale(1.1);border-radius:48% 52% 53% 47%} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        * { box-sizing: border-box; margin: 0; }
        body { margin: 0; overflow-x: hidden; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(59,130,246,0.12); border-radius: 4px; }
        select { appearance: none; }
      `}</style>
      {!user ? (
        <LoginScreen onLogin={setUser} />
      ) : user.role === "student" ? (
        <StudentDashboard user={user} apps={apps} onLogout={() => setUser(null)} />
      ) : user.role === "counselor" ? (
        <CounselorDashboard user={user} apps={apps} setApps={setApps} onLogout={() => setUser(null)} />
      ) : (
        <AdminDashboard user={user} apps={apps} setApps={setApps} onLogout={() => setUser(null)} />
      )}
    </>
  );
}
