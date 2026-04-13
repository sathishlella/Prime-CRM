"use client";

interface ProgressBarProps {
  total: number;
  completed: number;
  failed?: number;
  height?: number;
}

export default function ProgressBar({ total, completed, failed = 0, height = 8 }: ProgressBarProps) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const failPct = total > 0 ? Math.round((failed / total) * 100) : 0;

  return (
    <div style={{ width: "100%" }}>
      <div
        style={{
          height,
          borderRadius: height / 2,
          background: "rgba(0,0,0,0.06)",
          overflow: "hidden",
          display: "flex",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, #3b82f6, #10b981)",
            transition: "width 0.4s cubic-bezier(.4,0,.2,1)",
          }}
        />
        {failed > 0 && (
          <div
            style={{
              width: `${failPct}%`,
              background: "#ef4444",
              transition: "width 0.4s cubic-bezier(.4,0,.2,1)",
            }}
          />
        )}
      </div>
      <div style={{ fontSize: 10.5, color: "#94a3b8", marginTop: 4 }}>
        {completed}/{total} done{failed > 0 ? ` · ${failed} failed` : ""}
      </div>
    </div>
  );
}
