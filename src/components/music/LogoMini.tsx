import { CSSProperties } from "react";

const map = {
  pink: "#ff006e",
  cyan: "#00d9ff",
  yellow: "#ffc400",
  mono: "#8a8a8f",
} as const;

/** Capa quadrada estilizada FLOW (placeholder de arte de faixa). */
export function LogoMini({
  accent = "pink",
  className = "",
  style,
}: {
  accent?: keyof typeof map;
  className?: string;
  style?: CSSProperties;
}) {
  const c = map[accent];
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden ${className}`}
      style={{
        ...style,
        background: `radial-gradient(circle at 30% 20%, ${c}55, #0a0a0a 70%)`,
      }}
      aria-hidden
    >
      <div className="tex-noise absolute inset-0" />
      <span className="relative font-brush text-[0.7rem] leading-none text-white">
        FLOW
      </span>
    </div>
  );
}
