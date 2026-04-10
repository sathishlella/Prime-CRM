"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useUIStore } from "@/lib/stores/uiStore";
import type { ScannerConfig, ScanHistoryEntry } from "./page";

export default function ScannerConfigClient({
  initialConfigs,
  recentScans,
}: {
  initialConfigs: ScannerConfig[];
  recentScans: ScanHistoryEntry[];
}) {
  const [configs, setConfigs] = useState<ScannerConfig[]>(initialConfigs);
  const [scanning, setScanning] = useState(false);
  const [tab, setTab] = useState<"config" | "history">("config");
  const { addToast } = useUIStore();

  async function handleRunScan() {
    setScanning(true);
    try {
      const res = await fetch("/api/scan", { method: "POST" });
      if (!res.ok) throw new Error("Scan failed");
      const data = await res.json();
      addToast(`Scan complete: ${data.new_leads ?? 0} new leads discovered`, "success");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Scan failed", "error");
    } finally {
      setScanning(false);
    }
  }

  async function toggleEnabled(configId: string, current: boolean) {
    setConfigs((prev) =>
      prev.map((c) => (c.id === configId ? { ...c, is_enabled: !current } : c))
    );
    // Optimistic update — could add API call here
  }

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}
      >
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1e293b", margin: "0 0 3px" }}>
            Portal Scanner
          </h2>
          <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>
            {configs.length} companies tracked · Auto-scan every 6 hours
          </p>
        </div>
        <button
          onClick={handleRunScan}
          disabled={scanning}
          style={{
            padding: "10px 20px",
            borderRadius: 12,
            border: "none",
            background: scanning ? "#9ca3af" : "linear-gradient(135deg, #8b5cf6, #3b82f6)",
            color: "#fff",
            fontSize: 13.5,
            fontWeight: 700,
            cursor: scanning ? "not-allowed" : "pointer",
            fontFamily: "inherit",
          }}
        >
          {scanning ? "Scanning…" : "🔍 Run Scan Now"}
        </button>
      </motion.div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
        <TabButton active={tab === "config"} onClick={() => setTab("config")}>
          Configuration
        </TabButton>
        <TabButton active={tab === "history"} onClick={() => setTab("history")}>
          Scan History
        </TabButton>
      </div>

      {tab === "config" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
          {configs.length === 0 ? (
            <div
              style={{
                gridColumn: "1 / -1",
                padding: "40px 20px",
                textAlign: "center",
                color: "#94a3b8",
                background: "rgba(255,255,255,0.5)",
                borderRadius: 14,
              }}
            >
              No companies configured. Seed the scanner_config table to get started.
            </div>
          ) : (
            configs.map((config, i) => (
              <motion.div
                key={config.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                style={{
                  background: "rgba(255,255,255,0.7)",
                  border: "1px solid rgba(255,255,255,0.7)",
                  borderRadius: 14,
                  padding: 16,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>
                    {config.company_name}
                  </div>
                  <Toggle
                    active={config.is_enabled}
                    onClick={() => toggleEnabled(config.id, config.is_enabled)}
                  />
                </div>
                <div style={{ fontSize: 11, color: "#94a3b8", textTransform: "capitalize" }}>
                  {config.source}
                </div>
                {config.positive_keywords && config.positive_keywords.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {config.positive_keywords.slice(0, 4).map((kw) => (
                      <span
                        key={kw}
                        style={{
                          fontSize: 10,
                          padding: "2px 7px",
                          borderRadius: 10,
                          background: "#dbeafe",
                          color: "#1d4ed8",
                        }}
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                )}
                {config.last_scanned_at && (
                  <div style={{ fontSize: 10.5, color: "#94a3b8" }}>
                    Last scan: {new Date(config.last_scanned_at).toLocaleString()}
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>
      )}

      {tab === "history" && (
        <div
          style={{
            background: "rgba(255,255,255,0.5)",
            borderRadius: 14,
            padding: 16,
            maxHeight: 600,
            overflowY: "auto",
          }}
        >
          {recentScans.length === 0 ? (
            <div style={{ textAlign: "center", color: "#94a3b8", padding: 40 }}>
              No scan history yet.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {recentScans.map((scan) => (
                <div
                  key={scan.id}
                  style={{
                    padding: "8px 12px",
                    background: "rgba(255,255,255,0.5)",
                    borderRadius: 8,
                    fontSize: 12,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <div style={{ display: "flex", gap: 10, alignItems: "center", minWidth: 0 }}>
                    <strong style={{ color: "#1e293b" }}>{scan.company_name}</strong>
                    <span style={{ fontSize: 10, color: "#94a3b8", textTransform: "capitalize" }}>
                      {scan.source}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: "#94a3b8", whiteSpace: "nowrap" }}>
                    {new Date(scan.scanned_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "10px 18px",
        border: "none",
        background: "transparent",
        fontSize: 13,
        fontWeight: 600,
        color: active ? "#3b82f6" : "#64748b",
        borderBottom: active ? "2px solid #3b82f6" : "2px solid transparent",
        cursor: "pointer",
        marginBottom: -1,
        fontFamily: "inherit",
      }}
    >
      {children}
    </button>
  );
}

function Toggle({ active, onClick }: { active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 36,
        height: 20,
        borderRadius: 10,
        border: "none",
        background: active ? "#10b981" : "#cbd5e1",
        position: "relative",
        cursor: "pointer",
        transition: "background 0.2s",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 2,
          left: active ? 18 : 2,
          width: 16,
          height: 16,
          borderRadius: "50%",
          background: "#fff",
          transition: "left 0.2s",
        }}
      />
    </button>
  );
}
