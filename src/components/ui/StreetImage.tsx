import Image from "next/image";
import { Crown, Cross, SmileyCross, Lion } from "./Graphics";

type Accent = "pink" | "cyan" | "yellow" | "mono";
type Kind = "photo" | "product" | "video" | "cover";

const accentHex: Record<Accent, string> = {
  pink: "#ff006e",
  cyan: "#00d9ff",
  yellow: "#ffc400",
  mono: "#8a8a8f",
};

/**
 * Imagem com moldura street. Se `src` existir, usa next/image (as imagens
 * reais fornecidas). Caso contrário, renderiza um placeholder premium com
 * indicação clara de substituição — nunca um banco de imagem aleatório.
 */
export function StreetImage({
  src,
  alt,
  kind = "photo",
  accent = "pink",
  label,
  className = "",
  priority = false,
  sizes = "(max-width: 768px) 100vw, 50vw",
}: {
  src?: string;
  alt: string;
  kind?: Kind;
  accent?: Accent;
  label?: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
}) {
  if (src) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <Image src={src} alt={alt} fill priority={priority} sizes={sizes} className="object-cover" />
      </div>
    );
  }

  const hex = accentHex[accent];
  const Deco = kind === "product" ? Crown : kind === "video" ? SmileyCross : kind === "cover" ? Lion : Cross;

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden bg-ink-soft ${className}`}
      role="img"
      aria-label={alt}
      style={{
        backgroundImage: `radial-gradient(120% 90% at 30% 10%, ${hex}22, transparent 55%), radial-gradient(120% 90% at 85% 90%, ${hex}18, transparent 55%), repeating-linear-gradient(135deg, #0e0e10 0 14px, #0a0a0b 14px 28px)`,
      }}
    >
      {/* textura de ruído */}
      <div className="tex-noise absolute inset-0" />
      {/* respingo de tinta */}
      <div
        className="absolute -right-8 -top-8 h-40 w-40 rounded-full opacity-25 blur-md"
        style={{ background: hex }}
      />
      <div className="relative z-[2] flex flex-col items-center gap-3 px-4 text-center">
        <Deco className="h-14 w-14" style={{ color: hex }} />
        <span className="font-display text-xs tracking-[0.28em] text-white/85">
          {label ?? "FLOW JESUS"}
        </span>
        <span className="rounded-full border border-white/15 px-2.5 py-0.5 font-display text-[0.55rem] tracking-[0.22em] text-white/40">
          SUBSTITUIR IMAGEM
        </span>
      </div>
      {kind === "video" && (
        <span className="absolute inset-0 z-[3] flex items-center justify-center">
          <span
            className="flex h-14 w-14 items-center justify-center rounded-full shadow-glowPink"
            style={{ background: "#ff006e" }}
          >
            <svg viewBox="0 0 24 24" className="ml-0.5 h-6 w-6 fill-white">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </span>
      )}
    </div>
  );
}
