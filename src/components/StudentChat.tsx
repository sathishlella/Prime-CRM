"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ChatMessage {
  id?: string;
  role: "user" | "assistant" | "tool";
  content: string | null;
}

export default function StudentChat({ studentId }: { studentId: string | null }) {
  const [isOpen, setIsOpen] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  async function send() {
    if (!input.trim() || !studentId) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          thread_id: threadId ?? undefined,
          message: userMsg,
        }),
      });
      if (!res.ok) throw new Error("Chat request failed");
      const data = await res.json();
      if (data.thread_id) setThreadId(data.thread_id);
      if (Array.isArray(data.messages)) {
        setMessages(
          data.messages.map((m: any) => ({
            id: m.id,
            role: m.role,
            content: m.content,
          }))
        );
      }
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          width: 52,
          height: 52,
          borderRadius: 999,
          border: "none",
          background: "linear-gradient(135deg, #3b82f6, #10b981)",
          color: "#fff",
          fontSize: 22,
          cursor: "pointer",
          boxShadow: "0 6px 24px rgba(59,130,246,0.35)",
          zIndex: 50,
          display: "grid",
          placeItems: "center",
        }}
        aria-label="Open chat"
      >
        {isOpen ? "✕" : "💬"}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            style={{
              position: "fixed",
              bottom: 84,
              right: 20,
              width: 340,
              maxWidth: "calc(100vw - 40px)",
              height: 460,
              maxHeight: "calc(100vh - 120px)",
              background: "rgba(255,255,255,0.85)",
              backdropFilter: "blur(30px)",
              WebkitBackdropFilter: "blur(30px)",
              border: "1px solid rgba(255,255,255,0.7)",
              borderRadius: 20,
              boxShadow: "0 12px 40px rgba(0,0,0,0.12)",
              zIndex: 50,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "14px 16px",
                borderBottom: "1px solid rgba(0,0,0,0.05)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ fontSize: 13.5, fontWeight: 700, color: "#1e293b" }}>Assistant</div>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  fontSize: 16,
                  color: "#94a3b8",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
              {messages.length === 0 && (
                <div style={{ fontSize: 12, color: "#94a3b8", textAlign: "center", marginTop: 20 }}>
                  Ask me about your applications, matches, or interview prep.
                </div>
              )}
              {messages.map((m, i) => {
                if (m.role === "tool") return null;
                const isUser = m.role === "user";
                return (
                  <div
                    key={i}
                    style={{
                      alignSelf: isUser ? "flex-end" : "flex-start",
                      maxWidth: "80%",
                      padding: "10px 12px",
                      borderRadius: 12,
                      fontSize: 12.5,
                      lineHeight: 1.5,
                      background: isUser ? "linear-gradient(135deg, #3b82f6, #10b981)" : "rgba(255,255,255,0.7)",
                      color: isUser ? "#fff" : "#1e293b",
                      border: isUser ? "none" : "1px solid rgba(0,0,0,0.06)",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {m.content}
                  </div>
                );
              })}
              {loading && (
                <div
                  style={{
                    alignSelf: "flex-start",
                    padding: "10px 12px",
                    borderRadius: 12,
                    fontSize: 12.5,
                    background: "rgba(255,255,255,0.7)",
                    color: "#64748b",
                    border: "1px solid rgba(0,0,0,0.06)",
                  }}
                >
                  Thinking…
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div style={{ padding: 10, borderTop: "1px solid rgba(0,0,0,0.05)", display: "flex", gap: 8 }}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder="Type a message…"
                disabled={loading}
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid rgba(0,0,0,0.08)",
                  fontSize: 12.5,
                  outline: "none",
                }}
              />
              <button
                onClick={send}
                disabled={loading || !input.trim()}
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "none",
                  background: "linear-gradient(135deg, #3b82f6, #10b981)",
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                  opacity: loading || !input.trim() ? 0.6 : 1,
                }}
              >
                Send
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
