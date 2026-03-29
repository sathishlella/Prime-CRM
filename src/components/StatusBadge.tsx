import type { ApplicationStatus } from "@/lib/supabase/database.types";

const STATUS_MAP: Record<
  ApplicationStatus,
  { label: string; color: string; bg: string; icon: string }
> = {
  applied:     { label: "Applied",     color: "#3b82f6", bg: "rgba(59,130,246,0.08)",   icon: "📨" },
  in_progress: { label: "In Progress", color: "#f59e0b", bg: "rgba(245,158,11,0.08)",   icon: "⚙️" },
  interview:   { label: "Interview",   color: "#10b981", bg: "rgba(16,185,129,0.08)",   icon: "🎯" },
  rejected:    { label: "Rejected",    color: "#ef4444", bg: "rgba(239,68,68,0.06)",    icon: "✕"  },
  offered:     { label: "Offered",     color: "#8b5cf6", bg: "rgba(139,92,246,0.08)",   icon: "🎉" },
};

interface StatusBadgeProps {
  status:    ApplicationStatus;
  onClick?:  () => void;
  size?:     "sm" | "md";
}

export default function StatusBadge({ status, onClick, size = "md" }: StatusBadgeProps) {
  const s = STATUS_MAP[status];
  if (!s) return null;

  const isSmall = size === "sm";

  return (
    <span
      onClick={onClick}
      style={{
        display:        "inline-flex",
        alignItems:     "center",
        gap:            4,
        fontSize:       isSmall ? 10 : 11,
        fontWeight:     650,
        padding:        isSmall ? "3px 8px" : "4px 10px",
        borderRadius:   8,
        background:     s.bg,
        color:          s.color,
        letterSpacing:  0.3,
        whiteSpace:     "nowrap",
        cursor:         onClick ? "pointer" : "default",
        border:         `1px solid ${s.color}20`,
        transition:     "all 0.2s cubic-bezier(.4,0,.2,1)",
        userSelect:     "none",
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          (e.currentTarget as HTMLSpanElement).style.filter = "brightness(1.08)";
          (e.currentTarget as HTMLSpanElement).style.transform = "scale(1.03)";
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLSpanElement).style.filter = "";
        (e.currentTarget as HTMLSpanElement).style.transform = "";
      }}
    >
      <span style={{ fontSize: isSmall ? 9 : 10 }}>{s.icon}</span>
      {s.label}
      {onClick && (
        <span style={{ fontSize: 8, marginLeft: 2, opacity: 0.6 }}>▼</span>
      )}
    </span>
  );
}

export { STATUS_MAP };
export type { ApplicationStatus };
