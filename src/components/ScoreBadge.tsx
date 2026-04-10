"use client";

interface ScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

function getScoreColor(score: number): string {
  if (score >= 4.5) return "#3b82f6"; // blue
  if (score >= 4.0) return "#10b981"; // green
  if (score >= 3.5) return "#f59e0b"; // amber
  if (score >= 3.0) return "#f97316"; // orange
  return "#ef4444"; // red
}

function getScoreLabel(score: number): string {
  if (score >= 4.5) return "Strong Match";
  if (score >= 4.0) return "Good Match";
  if (score >= 3.5) return "Decent";
  if (score >= 3.0) return "Weak";
  return "Poor Match";
}

export default function ScoreBadge({ score, size = "md", showLabel = false }: ScoreBadgeProps) {
  const color = getScoreColor(score);
  const label = getScoreLabel(score);

  const sizes = {
    sm: { width: 32, height: 32, fontSize: 11, ringWidth: 2.5 },
    md: { width: 44, height: 44, fontSize: 14, ringWidth: 3 },
    lg: { width: 56, height: 56, fontSize: 18, ringWidth: 3.5 },
  };

  const s = sizes[size];
  const radius = (s.width - s.ringWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 5) * circumference;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ position: "relative", width: s.width, height: s.height }}>
        <svg width={s.width} height={s.height} viewBox={`0 0 ${s.width} ${s.height}`}>
          <circle
            cx={s.width / 2}
            cy={s.height / 2}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={s.ringWidth}
          />
          <circle
            cx={s.width / 2}
            cy={s.height / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={s.ringWidth}
            strokeDasharray={`${progress} ${circumference - progress}`}
            strokeDashoffset={circumference / 4}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 0.5s ease" }}
          />
        </svg>
        <span
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: s.fontSize,
            fontWeight: 700,
            color,
          }}
        >
          {score.toFixed(1)}
        </span>
      </div>
      {showLabel && (
        <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 500 }}>{label}</span>
      )}
    </div>
  );
}
