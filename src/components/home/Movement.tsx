import { testimonials } from "@/data/testimonials";
import { StreetImage } from "@/components/ui/StreetImage";
import { Crown } from "@/components/ui/Graphics";
import { BrushUnderline } from "@/components/ui/BrushUnderline";
import { Reveal } from "@/components/ui/Reveal";

export function Movement() {
  return (
    <section className="border-y border-white/10 bg-ink py-20">
      <div className="mx-auto max-w-container px-4 md:px-8">
        <Reveal className="mb-10">
          <div className="flex items-end gap-2">
            <Crown className="mb-2 h-6 w-9 text-brand-cyan" />
            <h2 className="headline text-4xl md:text-6xl">
              <span className="text-white">O </span>
              <span className="text-brand-yellow">MOVIMENTO</span>
            </h2>
          </div>
          <BrushUnderline color="pink" className="mt-2 h-3 w-40" />
          <p className="mt-4 text-white/60">
            Histórias reais. Vidas transformadas. Propósito que se multiplica.
          </p>
        </Reveal>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {testimonials.map((t, i) => (
            <Reveal key={t.id} delay={i * 0.08}>
              <figure className="flex h-full flex-col border border-white/10 bg-black/30 p-5 transition-colors hover:border-brand-pink/40">
                <div className="mb-4 flex items-center gap-3">
                  <StreetImage
                    src=""
                    alt={t.name}
                    kind="photo"
                    accent={t.accent}
                    label={t.name}
                    className="h-12 w-12 rounded-full"
                  />
                  <figcaption>
                    <p className="font-display text-sm tracking-wide">{t.name}</p>
                    <p className="text-xs text-white/50">{t.role}</p>
                  </figcaption>
                </div>
                <blockquote className="text-sm leading-relaxed text-white/75">“{t.quote}”</blockquote>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
