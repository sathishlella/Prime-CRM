"use client";

import { useEffect, useState } from "react";

export default function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const goOffline = () => {
      setOffline(true);
      setVisible(true);
    };
    const goOnline = () => {
      setOffline(false);
      // keep banner visible briefly so user sees "back online"
      setTimeout(() => setVisible(false), 2500);
    };

    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);

    // Check on mount
    if (!navigator.onLine) {
      setOffline(true);
      setVisible(true);
    }

    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        padding: "10px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        fontSize: 14,
        fontWeight: 600,
        background: offline
          ? "linear-gradient(90deg, #ef4444, #dc2626)"
          : "linear-gradient(90deg, #10b981, #059669)",
        color: "#fff",
        boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
        transition: "background 0.4s ease",
      }}
    >
      <span style={{ fontSize: 16 }}>{offline ? "📡" : "✅"}</span>
      {offline
        ? "You're offline — changes may not be saved"
        : "Back online!"}
    </div>
  );
}
