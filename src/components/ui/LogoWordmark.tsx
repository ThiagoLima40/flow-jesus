import Link from "next/link";
import { Crown } from "./Graphics";

/**
 * Wordmark FLOW JESUS — FLOW branco + JESUS amarelo, coroa amarela,
 * assinatura "by Isaque Lima". Fiel à arte da marca.
 */
export function LogoWordmark({
  size = "md",
  className = "",
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const scale = {
    sm: "text-2xl",
    md: "text-3xl",
    lg: "text-5xl md:text-6xl",
  }[size];

  return (
    <Link href="/" className={`group inline-block leading-none ${className}`} aria-label="FLOW JESUS — página inicial">
      <div className="relative inline-block">
        <Crown className="absolute -right-5 -top-3 h-4 w-6 rotate-12 text-brand-yellow transition-transform group-hover:-translate-y-0.5" />
        <span className={`font-brush ${scale} tracking-tight`}>
          <span className="text-white">Flow </span>
          <span className="text-brand-yellow">Jesus</span>
        </span>
      </div>
      <span className="mt-0.5 block font-display text-[0.6rem] tracking-[0.3em] text-white/70">
        BY <span className="text-brand-pink">ISAQUE</span> LIMA
      </span>
    </Link>
  );
}
