import { ReactNode } from "react";
import { Crown } from "./Graphics";
import { BrushUnderline } from "./BrushUnderline";

/**
 * Título graffiti/pincel com coroa opcional e sublinhado pintado.
 * Aceita spans coloridos via children para misturar cores dentro do título.
 */
export function GraffitiTitle({
  children,
  crown = true,
  underline = "pink",
  size = "lg",
  className = "",
  as: Tag = "h2",
}: {
  children: ReactNode;
  crown?: boolean;
  underline?: "pink" | "cyan" | "yellow" | "white" | false;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  as?: "h1" | "h2" | "h3";
}) {
  const sizeClass = {
    sm: "text-2xl md:text-3xl",
    md: "text-3xl md:text-5xl",
    lg: "text-4xl md:text-6xl",
    xl: "text-5xl md:text-8xl",
  }[size];

  return (
    <div className={`relative inline-block ${className}`}>
      {crown && (
        <Crown className="absolute -right-6 -top-5 h-5 w-8 rotate-12 text-brand-pink md:-right-8 md:h-7 md:w-11" />
      )}
      <Tag className={`headline ${sizeClass} ink-shadow`}>{children}</Tag>
      {underline && (
        <BrushUnderline color={underline} className="mt-1 h-3 w-[70%]" />
      )}
    </div>
  );
}
