import type { ApplicationStatus } from "@/lib/supabase/database.types";

const STATUS_MAP: Record<
  ApplicationStatus,
  { label: string; color: string; bg: string; dot: string }
> = {
  applied:     { label: "Applied",     color: "#2563EB", bg: "rgba(37,99,235,0.08)",   dot: "#2563EB" },
  in_progress: { label: "In Progress", color: "#D97706", bg: "rgba(217,119,6,0.08)",   dot: "#D97706" },
  interview:   { label: "Interview",   color: "#059669", bg: "rgba(5,150,105,0.08)",   dot: "#059669" },
  rejected:    { label: "Rejected",    color: "#DC2626", bg: "rgba(220,38,38,0.07)",   dot: "#DC2626" },
  offered:     { label: "Offered",     color: "#7C3AED", bg: "rgba(124,58,237,0.08)",  dot: "#7C3AED" },
};

interface StatusBadgeProps {
  status:   ApplicationStatus;
  onClick?: () => void;
  size?:    "sm" | "md";
}

export default function StatusBadge({ status, onClick, size = "md" }: StatusBadgeProps) {
  const s = STATUS_MAP[status];
  if (!s) return null;

  const isSmall = size === "sm";

  return (
    <span
      onClick={onClick}
      style={{
        display:       "inline-flex",
        alignItems:    "center",
        gap:           5,
        fontSize:      isSmall ? 10.5 : 11.5,
        fontWeight:    600,
        padding:       isSmall ? "3px 8px" : "4px 10px",
        borderRadius:  7,
        background:    s.bg,
        color:         s.color,
        letterSpacing: "0.05px",
        whiteSpace:    "nowrap",
        cursor:        onClick ? "pointer" : "default",
        border:        `1px solid ${s.color}22`,
        transition:    "all 0.2s cubic-bezier(.4,0,.2,1)",
        userSelect:    "none",
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          (e.currentTarget as HTMLSpanElement).style.filter    = "brightness(1.06)";
          (e.currentTarget as HTMLSpanElement).style.transform = "scale(1.02)";
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLSpanElement).style.filter    = "";
        (e.currentTarget as HTMLSpanElement).style.transform = "";
      }}
    >
      {/* Status dot */}
      <span style={{
        width:        isSmall ? 5 : 6,
        height:       isSmall ? 5 : 6,
        borderRadius: "50%",
        background:   s.dot,
        flexShrink:   0,
        display:      "inline-block",
      }} />
      {s.label}
      {onClick && (
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none" style={{ marginLeft: 1, opacity: 0.5 }}>
          <path d="M2 3l2 2 2-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </span>
  );
}

export { STATUS_MAP };
export type { ApplicationStatus };
