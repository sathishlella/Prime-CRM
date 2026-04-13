"use client";

interface ChatMessageProps {
  role: "user" | "assistant" | "tool";
  content: string;
}

export default function ChatMessage({ role, content }: ChatMessageProps) {
  const isUser = role === "user";
  if (role === "tool") return null; // Hide raw tool results

  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start" }}>
      <div
        style={{
          maxWidth: "85%",
          padding: "10px 14px",
          borderRadius: 14,
          fontSize: 13,
          lineHeight: 1.55,
          background: isUser ? "linear-gradient(135deg, #3b82f6, #10b981)" : "rgba(255,255,255,0.7)",
          color: isUser ? "#fff" : "#1e293b",
          border: isUser ? "none" : "1px solid rgba(0,0,0,0.05)",
          boxShadow: isUser ? "0 3px 10px rgba(59,130,246,0.2)" : "none",
          whiteSpace: "pre-wrap",
        }}
      >
        {content}
      </div>
    </div>
  );
}
