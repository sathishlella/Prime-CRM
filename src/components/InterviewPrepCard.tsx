"use client";

import { useState } from "react";

interface PrepData {
  process_overview?: {
    rounds: string;
    format: string;
    difficulty: string;
    quirks: string;
  };
  rounds?: Array<{
    number: number;
    type: string;
    duration: string;
    evaluates: string;
    reported_questions: string[];
    how_to_prepare: string;
  }>;
  questions?: {
    technical?: Array<{ question: string; strong_answer_angle: string }>;
    behavioral?: Array<{ question: string; recommended_story: string }>;
    role_specific?: Array<{ question: string; jd_requirement: string; best_angle: string }>;
    red_flags?: Array<{ question: string; why_asked: string; recommended_framing: string }>;
  };
  technical_prep_checklist?: Array<{ topic: string; reason: string }>;
  company_signals?: {
    values?: string[];
    vocabulary?: string[];
    things_to_avoid?: string[];
    questions_to_ask?: string[];
  };
}

export default function InterviewPrepCard({ prepData }: { prepData: PrepData }) {
  const [activeTab, setActiveTab] = useState("overview");

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "questions", label: "Questions" },
    { id: "prep", label: "Prep Checklist" },
    { id: "signals", label: "Company Signals" },
  ];

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.95)",
        borderRadius: 16,
        border: "1px solid rgba(0,0,0,0.06)",
        padding: 20,
        marginTop: 12,
      }}
    >
      <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0A0F1E", marginBottom: 12 }}>
        Interview Preparation
      </h3>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16, borderBottom: "1px solid #e5e7eb" }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "8px 14px",
              border: "none",
              background: "transparent",
              fontSize: 13,
              fontWeight: 500,
              color: activeTab === tab.id ? "#0A6EBD" : "#6b7280",
              borderBottom: activeTab === tab.id ? "2px solid #0A6EBD" : "2px solid transparent",
              cursor: "pointer",
              marginBottom: -1,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ fontSize: 13, color: "#374151" }}>
        {activeTab === "overview" && prepData.process_overview && (
          <div>
            <InfoRow label="Rounds" value={prepData.process_overview.rounds} />
            <InfoRow label="Format" value={prepData.process_overview.format} />
            <InfoRow label="Difficulty" value={prepData.process_overview.difficulty} />
            {prepData.process_overview.quirks && (
              <InfoRow label="Known Quirks" value={prepData.process_overview.quirks} />
            )}

            {prepData.rounds && prepData.rounds.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Round Breakdown</h4>
                {prepData.rounds.map((round, i) => (
                  <div
                    key={i}
                    style={{
                      padding: 12,
                      background: "#f9fafb",
                      borderRadius: 8,
                      marginBottom: 8,
                    }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>
                      Round {round.number}: {round.type}
                    </div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>
                      {round.duration} · Evaluates: {round.evaluates}
                    </div>
                    {round.how_to_prepare && (
                      <div style={{ marginTop: 6, fontSize: 12 }}>
                        <strong>Prep:</strong> {round.how_to_prepare}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "questions" && prepData.questions && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {prepData.questions.technical && prepData.questions.technical.length > 0 && (
              <QuestionSection title="Technical" color="#3b82f6">
                {prepData.questions.technical.map((q, i) => (
                  <div key={i} style={{ marginBottom: 8 }}>
                    <div style={{ fontWeight: 500 }}>{q.question}</div>
                    <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
                      {q.strong_answer_angle}
                    </div>
                  </div>
                ))}
              </QuestionSection>
            )}
            {prepData.questions.behavioral && prepData.questions.behavioral.length > 0 && (
              <QuestionSection title="Behavioral" color="#10b981">
                {prepData.questions.behavioral.map((q, i) => (
                  <div key={i} style={{ marginBottom: 8 }}>
                    <div style={{ fontWeight: 500 }}>{q.question}</div>
                    <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
                      Story: {q.recommended_story}
                    </div>
                  </div>
                ))}
              </QuestionSection>
            )}
            {prepData.questions.role_specific && prepData.questions.role_specific.length > 0 && (
              <QuestionSection title="Role-Specific" color="#8b5cf6">
                {prepData.questions.role_specific.map((q, i) => (
                  <div key={i} style={{ marginBottom: 8 }}>
                    <div style={{ fontWeight: 500 }}>{q.question}</div>
                    <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
                      Angle: {q.best_angle}
                    </div>
                  </div>
                ))}
              </QuestionSection>
            )}
            {prepData.questions.red_flags && prepData.questions.red_flags.length > 0 && (
              <QuestionSection title="Red Flags" color="#ef4444">
                {prepData.questions.red_flags.map((q, i) => (
                  <div key={i} style={{ marginBottom: 8 }}>
                    <div style={{ fontWeight: 500 }}>{q.question}</div>
                    <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
                      Framing: {q.recommended_framing}
                    </div>
                  </div>
                ))}
              </QuestionSection>
            )}
          </div>
        )}

        {activeTab === "prep" && prepData.technical_prep_checklist && (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {prepData.technical_prep_checklist.map((item, i) => (
              <li
                key={i}
                style={{
                  padding: 10,
                  background: "#f9fafb",
                  borderRadius: 6,
                  marginBottom: 6,
                  display: "flex",
                  alignItems: "start",
                  gap: 8,
                }}
              >
                <input type="checkbox" style={{ marginTop: 3 }} />
                <div>
                  <div style={{ fontWeight: 500 }}>{item.topic}</div>
                  <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>{item.reason}</div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {activeTab === "signals" && prepData.company_signals && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {prepData.company_signals.values && prepData.company_signals.values.length > 0 && (
              <SignalSection title="Values They Screen For" items={prepData.company_signals.values} />
            )}
            {prepData.company_signals.vocabulary && prepData.company_signals.vocabulary.length > 0 && (
              <SignalSection title="Vocabulary to Use" items={prepData.company_signals.vocabulary} />
            )}
            {prepData.company_signals.things_to_avoid && prepData.company_signals.things_to_avoid.length > 0 && (
              <SignalSection title="Things to Avoid" items={prepData.company_signals.things_to_avoid} />
            )}
            {prepData.company_signals.questions_to_ask && prepData.company_signals.questions_to_ask.length > 0 && (
              <SignalSection title="Questions to Ask Them" items={prepData.company_signals.questions_to_ask} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", gap: 12, padding: "6px 0", borderBottom: "1px solid #f3f4f6" }}>
      <span style={{ fontWeight: 600, color: "#6b7280", minWidth: 100 }}>{label}:</span>
      <span style={{ flex: 1 }}>{value}</span>
    </div>
  );
}

function QuestionSection({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div style={{ borderLeft: `3px solid ${color}`, paddingLeft: 12 }}>
      <h4 style={{ fontSize: 13, fontWeight: 700, color, marginBottom: 8 }}>{title}</h4>
      {children}
    </div>
  );
}

function SignalSection({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 style={{ fontSize: 13, fontWeight: 600, color: "#0A0F1E", marginBottom: 6 }}>{title}</h4>
      <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: "#4b5563" }}>
        {items.map((item, i) => (
          <li key={i} style={{ marginBottom: 4 }}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
