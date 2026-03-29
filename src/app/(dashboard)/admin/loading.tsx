import { SkeletonStatRow, SkeletonTableRows, SkeletonBox } from "@/components/Skeleton";

export default function AdminLoading() {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <SkeletonBox w={200} h={22} radius={8} />
          <SkeletonBox w={300} h={13} radius={6} />
        </div>
        <SkeletonBox w={130} h={42} radius={12} />
      </div>
      <SkeletonStatRow count={4} />
      {/* Pipeline bar skeleton */}
      <div style={{ background: "rgba(255,255,255,0.5)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.65)", borderRadius: 18, padding: "20px 22px", marginBottom: 22 }}>
        <SkeletonBox w="15%" h={11} radius={6} />
        <div style={{ height: 12, borderRadius: 10, background: "rgba(0,0,0,0.06)", margin: "14px 0 14px", overflow: "hidden" }}>
          <div style={{ width: "100%", height: "100%", background: "linear-gradient(90deg, rgba(255,255,255,0.3) 25%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0.3) 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s ease-in-out infinite" }} />
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          {[60,80,75,65,70].map((w,i) => <SkeletonBox key={i} w={w} h={11} radius={6} />)}
        </div>
      </div>
      {/* Tabs skeleton */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
        <SkeletonBox w={160} h={36} radius={10} />
        <SkeletonBox w={160} h={36} radius={10} />
      </div>
      <SkeletonTableRows rows={5} />
    </div>
  );
}
