import { timeline } from "@/data/achievements";
import { StreetImage } from "@/components/ui/StreetImage";
import { HandArrow } from "@/components/ui/Graphics";
import { Reveal } from "@/components/ui/Reveal";

const accentText = {
  pink: "text-brand-pink",
  cyan: "text-brand-cyan",
  yellow: "text-brand-yellow",
} as const;

const photos = {
  COMEÇO: { file: "comeco-familia", alt: "Isaque criança com a família na academia", framing: "[&>img]:object-[45%_50%]", fit: "cover" },
  TREINO: { file: "treino-kimono", alt: "Isaque ainda jovem de kimono e mãos na cintura no tatame", framing: "[&>img]:object-top", fit: "cover" },
  COMPETIÇÃO: { file: "competicao-tatame", alt: "Isaque disputando uma luta de jiu-jitsu no tatame", framing: "[&>img]:object-[45%_50%]", fit: "cover" },
  VITÓRIAS: { file: "vitorias-medalhas", alt: "Isaque de kimono exibindo suas medalhas", framing: "[&>img]:object-top", fit: "cover" },
  FAMÍLIA: { file: "familia-pai", alt: "Isaque junto do pai, ambos de kimono na academia", framing: "[&>img]:object-top", fit: "cover" },
} as const;

export function StoryTimeline() {
  return (
    <section className="border-y border-white/10 bg-ink py-16">
      <div className="mx-auto max-w-container px-4 md:px-8">
        <Reveal className="mb-10">
          <h2 className="headline text-4xl md:text-6xl">
            <span className="text-white">A HISTÓRIA DO</span>{" "}
            <span className="text-brand-yellow">ISAQUE</span>
          </h2>
        </Reveal>

        <div className="grid gap-6 md:grid-cols-5">
          {timeline.map((t, i) => {
            const photo = photos[t.key as keyof typeof photos];
            const aspect = t.key === "COMEÇO" ? "aspect-square" : t.key === "COMPETIÇÃO" ? "aspect-[3/4]" : "aspect-[4/5]";
            return (
              <Reveal key={t.key} delay={i * 0.1} className="relative">
                <StreetImage
                  src={`/images/historia/${photo.file}.jpg`}
                  alt={photo.alt}
                  fit={photo.fit}
                  sizes="(max-width: 767px) calc(100vw - 32px), (max-width: 1279px) 18vw, 224px"
                  kind="photo"
                  accent={t.accent}
                  label={t.key}
                  className={`${aspect} w-full bg-black ${photo.framing}`}
                />
                <div className="mt-3">
                  <p className={`font-brush text-2xl ${accentText[t.accent]}`}>{t.key}</p>
                  <p className="mt-1 text-sm text-white/65">{t.text}</p>
                </div>
                {i < timeline.length - 1 && (
                  <HandArrow className="absolute -right-4 top-1/3 hidden h-6 w-10 text-white/40 md:block" />
                )}
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
