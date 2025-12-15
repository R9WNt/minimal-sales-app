import React from "react";

export type CubeProps = {
  size?: number;
  color?: string;
  active?: boolean;
  title?: string;
};

export default function Cube({ size = 18, color = "#059669", active = false, title }: CubeProps) {
  const rim = "rgba(0,0,0,0.06)";
  const shadowMain = active ? "0 6px 12px rgba(2,6,23,0.16)" : "0 3px 8px rgba(2,6,23,0.10)";
  const inset = active ? "inset 0 -5px 8px rgba(0,0,0,0.12)" : "inset 0 -2px 5px rgba(0,0,0,0.06)";
  const bg = active ? "#10b981" : color;
  const gradient = `linear-gradient(180deg, ${bg} 0%, ${color} 65%)`;

  const style: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: Math.max(3, Math.round(size * 0.14)),
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box",
    boxShadow: `${shadowMain}, ${inset}`,
    background: gradient,
    border: `1px solid ${rim}`,
    transformOrigin: "center",
    pointerEvents: "none",
  };

  const highlightStyle: React.CSSProperties = {
    width: Math.round(size * 0.36),
    height: Math.round(size * 0.36),
    borderRadius: Math.max(2, Math.round(size * 0.08)),
    background: "rgba(255,255,255,0.12)",
    transform: "translateY(-1.2px)",
  };

  return (
    <div style={style} title={title} role="img" aria-label={title}>
      <div style={highlightStyle} />
    </div>
  );
}
