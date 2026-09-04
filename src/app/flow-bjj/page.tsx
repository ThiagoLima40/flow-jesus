import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import { StreetImage } from "@/components/ui/StreetImage";
import { BjjClient } from "@/components/bjj/BjjClient";
import { AchievementCard } from "@/components/story/AchievementCard";
import { GraffitiTitle } from "@/components/ui/GraffitiTitle";
import { testimonials } from "@/data/testimonials";
import { bjjStats } from "@/data/achievements";
import { StampSeal } from "@/components/ui/Graphics";
import { Reveal } from "@/components/ui/Reveal";
import type { Achievement } from "@/data/achievements";

export const metadata: Metadata = {
  title: "Flow BJJ",
  description: "Fé no tatame. Cristo no centro. Jiu-jítsu é mais que luta — é propósito, disciplina e eternidade.",
};

const accentText = { pink: "text-brand-pink", cyan: "text-brand-cyan", yellow: "text-brand-yellow", mono: "text-white" } as const;

export default function FlowBjjPage() {
  const stats: Achievement[] = bjjStats.map((s, i) => ({
    id: `bs${i}`,
    value: s.value,
    label: s.label,
    sub: "",
    icon: s.icon as Achievement["icon"],
    accent: s.accent,
  }));

  return (
    <>
      <PageHero
        eyebrow="FLOW BJJ"
        title={
          <>
            <span className="text-white">Fé no tatame.</span>
            <br />
            <span className="text-brand-yellow">Cristo no centro.</span>
          </>
        }
        subtitle={
          <>
            Jiu-jítsu é mais que luta. É <span className="text-brand-pink">propósito</span>,{" "}
            <span className="text-brand-cyan">disciplina</span> e eternidade.
          </>
        }
        underline="cyan"
      >
        <Reveal className="relative mt-10">
          <StreetImage
            src=""
            alt="Isaque Lima com kimono no tatame"
            kind="cover"
            accent="pink"
            label="ISAQUE LIMA · TATAME"
            className="aspect-[16/7] w-full shadow-card"
          />
          <StampSeal className="absolute -bottom-6 right-6 h-24 w-20 text-brand-yellow" />
        </Reveal>
      </PageHero>

      <section className="border-y border-white/10 bg-ink py-10">
        <div className="mx-auto grid max-w-container grid-cols-2 gap-4 px-4 md:px-8 lg:grid-cols-4">
          {stats.map((s, i) => (
            <AchievementCard key={s.id} item={s} index={i} />
          ))}
        </div>
      </section>

      <BjjClient />

      {/* O MOVIMENTO */}
      <section className="border-t border-white/10 bg-ink py-20">
        <div className="mx-auto max-w-container px-4 md:px-8">
          <GraffitiTitle as="h2" size="lg" underline="pink" className="mb-10">
            <span className="text-white">O </span>
            <span className="text-brand-yellow">MOVIMENTO</span>
          </GraffitiTitle>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {testimonials.map((t) => (
              <figure key={t.id} className="flex h-full flex-col border border-white/10 bg-black/30 p-6">
                <blockquote className="text-sm leading-relaxed text-white/80">“{t.quote}”</blockquote>
                <figcaption className="mt-4 border-t border-white/10 pt-3">
                  <p className={`font-display text-sm tracking-wide ${accentText[t.accent]}`}>{t.name}</p>
                  <p className="text-xs text-white/50">{t.role}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
