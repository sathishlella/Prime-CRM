// Reusable skeleton primitives used across loading.tsx files

export function SkeletonBox({ w = "100%", h = 20, radius = 8, className }: { w?: string | number; h?: string | number; radius?: number; className?: string }) {
  return (
    <div
      className={className}
      style={{
        width:            w,
        height:           h,
        borderRadius:     radius,
        background:       "linear-gradient(90deg, rgba(255,255,255,0.4) 25%, rgba(255,255,255,0.65) 50%, rgba(255,255,255,0.4) 75%)",
        backgroundSize:   "200% 100%",
        animation:        "shimmer 1.5s ease-in-out infinite",
      }}
    />
  );
}

export function SkeletonCard({ height = 90 }: { height?: number }) {
  return (
    <div
      style={{
        background:           "rgba(255,255,255,0.45)",
        backdropFilter:       "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border:               "1px solid rgba(255,255,255,0.6)",
        borderRadius:         18,
        padding:              "18px 20px",
        height,
        display:              "flex",
        flexDirection:        "column",
        gap:                  10,
        justifyContent:       "center",
      }}
    >
      <SkeletonBox h={14} w="40%" />
      <SkeletonBox h={28} w="55%" />
      <SkeletonBox h={10} w="60%" />
    </div>
  );
}

export function SkeletonStatRow({ count = 4 }: { count?: number }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${count}, 1fr)`, gap: 10, marginBottom: 22 }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} height={90} />
      ))}
    </div>
  );
}

export function SkeletonTableRows({ rows = 6 }: { rows?: number }) {
  return (
    <div
      style={{
        background:           "rgba(255,255,255,0.5)",
        backdropFilter:       "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border:               "1px solid rgba(255,255,255,0.65)",
        borderRadius:         18,
        overflow:             "hidden",
      }}
    >
      {/* fake header */}
      <div style={{ background: "rgba(248,250,255,0.6)", padding: "12px 16px", borderBottom: "1px solid rgba(0,0,0,0.05)", display: "flex", gap: 40 }}>
        {["30%","20%","20%","15%"].map((w, i) => <SkeletonBox key={i} w={w} h={10} />)}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ padding: "14px 16px", borderBottom: "1px solid rgba(0,0,0,0.035)", display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, width: "30%" }}>
            <SkeletonBox w={32} h={32} radius={10} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
              <SkeletonBox h={12} w="70%" />
              <SkeletonBox h={9}  w="50%" />
            </div>
          </div>
          <SkeletonBox w="20%" h={12} />
          <SkeletonBox w="15%" h={22} radius={8} />
          <SkeletonBox w="12%" h={10} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonAppCards({ count = 4 }: { count?: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ background: "rgba(255,255,255,0.5)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.65)", borderRadius: 18, padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
          <SkeletonBox w={42} h={42} radius={13} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7 }}>
            <SkeletonBox h={14} w="40%" />
            <SkeletonBox h={11} w="28%" />
            <SkeletonBox h={9}  w="55%" />
          </div>
          <SkeletonBox w={80} h={24} radius={8} />
        </div>
      ))}
    </div>
  );
}
