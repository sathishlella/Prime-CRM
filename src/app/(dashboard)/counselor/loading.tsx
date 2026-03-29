import { SkeletonStatRow, SkeletonTableRows } from "@/components/Skeleton";

export default function CounselorLoading() {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, gap: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ width: 220, height: 22, borderRadius: 8, background: "rgba(255,255,255,0.4)", animation: "shimmer 1.5s ease-in-out infinite", backgroundSize: "200% 100%" }} />
          <div style={{ width: 280, height: 13, borderRadius: 6, background: "rgba(255,255,255,0.4)", animation: "shimmer 1.5s ease-in-out infinite", backgroundSize: "200% 100%" }} />
        </div>
        <div style={{ width: 160, height: 42, borderRadius: 12, background: "rgba(255,255,255,0.4)", animation: "shimmer 1.5s ease-in-out infinite", backgroundSize: "200% 100%" }} />
      </div>
      <SkeletonStatRow count={5} />
      <div style={{ width: 320, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.4)", animation: "shimmer 1.5s ease-in-out infinite", backgroundSize: "200% 100%", marginBottom: 14 }} />
      <SkeletonTableRows rows={6} />
    </div>
  );
}
