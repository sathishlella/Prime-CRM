// Fixed-position animated blob background — GPU-accelerated, pointer-events: none
// Place once in the layout; renders behind all content.

export default function BlobBackground() {
  return (
    <div
      style={{
        position:      "fixed",
        inset:         0,
        zIndex:        0,
        overflow:      "hidden",
        pointerEvents: "none",
      }}
    >
      {/* Blue blob — top right */}
      <div
        style={{
          position:   "absolute",
          width:      520,
          height:     520,
          top:        "-8%",
          right:      "-6%",
          background: "radial-gradient(circle, rgba(59,130,246,0.14) 0%, rgba(59,130,246,0.04) 40%, transparent 70%)",
          animation:  "blobA 20s ease-in-out infinite",
          willChange: "transform, border-radius",
        }}
      />
      {/* Mint blob — bottom left */}
      <div
        style={{
          position:   "absolute",
          width:      440,
          height:     440,
          bottom:     "-4%",
          left:       "-5%",
          background: "radial-gradient(circle, rgba(16,185,129,0.12) 0%, rgba(16,185,129,0.03) 40%, transparent 70%)",
          animation:  "blobB 25s ease-in-out infinite",
          willChange: "transform, border-radius",
        }}
      />
      {/* Violet blob — centre */}
      <div
        style={{
          position:   "absolute",
          width:      320,
          height:     320,
          top:        "35%",
          left:       "45%",
          background: "radial-gradient(circle, rgba(139,92,246,0.10) 0%, rgba(139,92,246,0.02) 40%, transparent 70%)",
          animation:  "blobC 17s ease-in-out infinite",
          willChange: "transform, border-radius",
        }}
      />
    </div>
  );
}
