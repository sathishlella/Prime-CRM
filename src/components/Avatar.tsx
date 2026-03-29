interface AvatarProps {
  initials: string;
  size?:    number;
  color?:   string;
  src?:     string | null;
}

export default function Avatar({
  initials,
  size  = 36,
  color = "#3b82f6",
  src,
}: AvatarProps) {
  const radius = Math.round(size * 0.32);

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={initials}
        width={size}
        height={size}
        style={{
          width:        size,
          height:       size,
          borderRadius: radius,
          objectFit:    "cover",
          border:       `1.5px solid ${color}20`,
          flexShrink:   0,
        }}
      />
    );
  }

  return (
    <div
      style={{
        width:           size,
        height:          size,
        borderRadius:    radius,
        background:      `linear-gradient(135deg, ${color}18, ${color}08)`,
        border:          `1.5px solid ${color}20`,
        display:         "flex",
        alignItems:      "center",
        justifyContent:  "center",
        fontSize:        size * 0.31,
        fontWeight:      700,
        color:           color,
        flexShrink:      0,
        userSelect:      "none",
      }}
    >
      {initials.slice(0, 2).toUpperCase()}
    </div>
  );
}
