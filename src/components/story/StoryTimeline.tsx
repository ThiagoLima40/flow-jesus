import { timeline } from "@/data/achievements";
import { StreetImage } from "@/components/ui/StreetImage";
import { HandArrow } from "@/components/ui/Graphics";
import { Reveal } from "@/components/ui/Reveal";

const accentText = {
  pink: "text-brand-pink",
  cyan: "text-brand-cyan",
  yellow: "text-brand-yellow",
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
          {timeline.map((t, i) => (
            <Reveal key={t.key} delay={i * 0.1} className="relative">
              <StreetImage
                src=""
                alt={`${t.key} — jornada de Isaque`}
                kind="photo"
                accent={t.accent}
                label={t.key}
                className="aspect-[4/5] w-full grayscale transition-all hover:grayscale-0"
              />
              <div className="mt-3">
                <p className={`font-brush text-2xl ${accentText[t.accent]}`}>{t.key}</p>
                <p className="mt-1 text-sm text-white/65">{t.text}</p>
              </div>
              {i < timeline.length - 1 && (
                <HandArrow className="absolute -right-4 top-1/3 hidden h-6 w-10 text-white/40 md:block" />
              )}
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
