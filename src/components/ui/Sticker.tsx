import { ReactNode } from "react";

type Color = "white" | "pink" | "cyan" | "yellow";
const border: Record<Color, string> = {
  white: "border-white text-white",
  pink: "border-brand-pink text-brand-pink",
  cyan: "border-brand-cyan text-brand-cyan",
  yellow: "border-brand-yellow text-brand-yellow",
};

/** Sticker/adesivo com borda, leve rotação — igual aos selos da arte. */
export function Sticker({
  children,
  color = "white",
  rotate = -4,
  className = "",
}: {
  children: ReactNode;
  color?: Color;
  rotate?: number;
  className?: string;
}) {
  return (
    <span
      className={`sticker text-[0.62rem] ${border[color]} ${className}`}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      {children}
    </span>
  );
}
