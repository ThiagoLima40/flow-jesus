import { PaintUnderline } from "./Graphics";

type Color = "pink" | "cyan" | "yellow" | "white";
const colorClass: Record<Color, string> = {
  pink: "text-brand-pink",
  cyan: "text-brand-cyan",
  yellow: "text-brand-yellow",
  white: "text-white",
};

export function BrushUnderline({
  color = "pink",
  className = "",
}: {
  color?: Color;
  className?: string;
}) {
  return <PaintUnderline className={`h-3 w-full ${colorClass[color]} ${className}`} />;
}
