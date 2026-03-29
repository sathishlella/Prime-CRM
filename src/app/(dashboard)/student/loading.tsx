import { SkeletonStatRow, SkeletonAppCards } from "@/components/Skeleton";

export default function StudentLoading() {
  return (
    <div>
      {/* Greeting skeleton */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ width: 180, height: 22, borderRadius: 8, background: "rgba(255,255,255,0.4)", backgroundSize: "200% 100%", animation: "shimmer 1.5s ease-in-out infinite", marginBottom: 8 }} />
        <div style={{ width: 320, height: 13, borderRadius: 6, background: "rgba(255,255,255,0.4)", backgroundSize: "200% 100%", animation: "shimmer 1.5s ease-in-out infinite" }} />
      </div>
      <SkeletonStatRow count={4} />
      {/* Filter tab skeletons */}
      <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
        {[70, 80, 100, 90, 80, 70].map((w, i) => (
          <div key={i} style={{ width: w, height: 32, borderRadius: 9, background: "rgba(255,255,255,0.4)", animation: "shimmer 1.5s ease-in-out infinite", backgroundSize: "200% 100%" }} />
        ))}
      </div>
      <SkeletonAppCards count={4} />
    </div>
  );
}
