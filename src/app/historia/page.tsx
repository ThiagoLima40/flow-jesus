import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import { StreetImage } from "@/components/ui/StreetImage";
import { StoryTimeline } from "@/components/story/StoryTimeline";
import { AchievementCard } from "@/components/story/AchievementCard";
import { Marquee } from "@/components/ui/Marquee";
import { GraffitiTitle } from "@/components/ui/GraffitiTitle";
import { achievements, pillars } from "@/data/achievements";
import { StampSeal } from "@/components/ui/Graphics";
import { Reveal } from "@/components/ui/Reveal";

export const metadata: Metadata = {
  title: "História",
  description: "Antes das medalhas, existe um propósito. A história de fé, disciplina e vitória de Isaque Lima.",
};

const pillarText = { pink: "text-brand-pink", cyan: "text-brand-cyan", yellow: "text-brand-yellow" } as const;

export default function HistoriaPage() {
  return (
    <>
      <PageHero
        eyebrow="A JORNADA"
        title={
          <>
            <span className="text-white">Antes das medalhas,</span>
            <br />
            <span className="text-brand-yellow">existe um propósito.</span>
          </>
        }
        subtitle={
          <>
            A história de <span className="text-brand-pink">Isaque Lima</span> é prova viva de que{" "}
            <span className="text-brand-cyan">fé + atitude</span> mudam destinos e inspiram gerações.
          </>
        }
      >
        <Reveal className="mt-10 grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
          <p className="max-w-2xl text-white/70">
            De uma promessa de infância aos tatames internacionais, cada renúncia teve um mesmo
            destino: glorificar a Deus. Não é sobre medalhas — é sobre o propósito que existe antes
            delas.
          </p>
          <div className="relative">
            <StreetImage
              src=""
              alt="Isaque Lima"
              kind="cover"
              accent="yellow"
              label="ISAQUE LIMA"
              className="aspect-square w-full max-w-xs shadow-card md:w-72"
            />
            <StampSeal className="absolute -bottom-5 -right-4 h-24 w-20 text-brand-pink" />
          </div>
        </Reveal>
      </PageHero>

      <StoryTimeline />

      <Marquee
        items={["FÉ", "DISCIPLINA", "LUTA", "VITÓRIA", "PROPÓSITO"]}
        className="bg-street"
      />

      <section className="bg-ink py-20">
        <div className="mx-auto max-w-container px-4 md:px-8">
          <GraffitiTitle as="h2" size="lg" underline="pink" className="mb-10">
            <span className="text-white">CONQUISTAS QUE </span>
            <span className="text-brand-yellow">GLORIFICAM</span>
          </GraffitiTitle>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {achievements.map((a, i) => (
              <AchievementCard key={a.id} item={a} index={i} />
            ))}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {pillars.map((p) => (
              <div key={p.word} className="border border-white/10 bg-black/30 p-6 text-center">
                <p className={`font-brush text-3xl ${pillarText[p.accent]}`}>{p.word}</p>
                <p className="mt-1 font-display text-xs tracking-[0.18em] text-white/60">{p.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
