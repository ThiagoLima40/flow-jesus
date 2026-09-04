export type BadgeKind = "NOVO" | "DROP" | "ESGOTANDO" | "MAIS VENDIDO";

const styles: Record<string, string> = {
  NOVO: "bg-brand-cyan text-ink",
  DROP: "bg-brand-pink text-white",
  ESGOTANDO: "bg-brand-red text-white",
  "MAIS VENDIDO": "bg-brand-yellow text-ink",
};

export function Badge({ kind, className = "" }: { kind: string; className?: string }) {
  return (
    <span
      className={`font-display text-[0.6rem] tracking-[0.16em] px-2 py-1 rotate-[-3deg] ${
        styles[kind] ?? "bg-white text-ink"
      } ${className}`}
    >
      {kind}
    </span>
  );
}
