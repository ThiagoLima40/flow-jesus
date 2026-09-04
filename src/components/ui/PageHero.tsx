import { ReactNode } from "react";
import { Crown, Splatter, Cross } from "./Graphics";
import { BrushUnderline } from "./BrushUnderline";

/** Hero padrão de páginas internas — street, com respingos e coroa. */
export function PageHero({
  eyebrow,
  title,
  subtitle,
  underline = "pink",
  children,
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  underline?: "pink" | "cyan" | "yellow" | "white";
  children?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden bg-street tex-noise pt-32 pb-14 md:pt-40 md:pb-20">
      <Splatter className="pointer-events-none absolute -left-16 top-24 h-72 w-72 text-brand-cyan/15" />
      <Splatter className="pointer-events-none absolute -right-12 bottom-0 h-72 w-72 text-brand-pink/15" />
      <Cross className="pointer-events-none absolute right-10 top-28 hidden h-12 w-9 text-white/10 md:block" />

      <div className="relative mx-auto max-w-container px-4 md:px-8">
        {eyebrow && (
          <p className="mb-3 font-display text-sm tracking-[0.3em] text-brand-pink">{eyebrow}</p>
        )}
        <div className="relative inline-block">
          <Crown className="absolute -right-6 -top-6 h-6 w-10 rotate-12 text-brand-yellow md:-right-8 md:h-8 md:w-12" />
          <h1 className="headline text-5xl leading-[0.9] md:text-8xl">{title}</h1>
        </div>
        <BrushUnderline color={underline} className="mt-3 h-4 w-56 md:w-80" />
        {subtitle && <p className="mt-6 max-w-2xl text-lg text-white/70">{subtitle}</p>}
        {children}
      </div>
    </section>
  );
}
