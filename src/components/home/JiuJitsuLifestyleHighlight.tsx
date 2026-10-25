import { Button } from "@/components/ui/Button";
import { StreetImage } from "@/components/ui/StreetImage";
import { BrushUnderline } from "@/components/ui/BrushUnderline";

const grapplingClubImage = "/images/products/jiu-jitsu-lifestyle/flowjesus-grappling-club-branca.jpg";

export function JiuJitsuLifestyleHighlight() {
  return (
    <section className="relative overflow-hidden bg-ink py-16 md:py-24">
      <div className="pointer-events-none absolute -left-24 top-12 h-64 w-64 rounded-full bg-brand-cyan/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-brand-yellow/10 blur-3xl" />
      <div className="relative mx-auto grid max-w-container items-center gap-10 px-4 md:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        <div className="relative mx-auto w-full max-w-xl">
          <div className="absolute -inset-3 rotate-2 border border-brand-cyan/30" />
          <StreetImage
            src={grapplingClubImage}
            alt="Camiseta branca FlowJesus Grappling Club"
            kind="product"
            fit="contain"
            accent="cyan"
            className="aspect-[4/5] w-full bg-ink-soft shadow-card"
            priority
          />
          <span className="absolute -bottom-4 -right-3 rotate-[-4deg] bg-brand-yellow px-3 py-1 font-display text-xs tracking-[0.18em] text-ink md:-right-5">
            NOVA COLEÇÃO
          </span>
        </div>

        <div className="relative">
          <p className="font-display text-sm tracking-[0.3em] text-brand-cyan">JIU-JITSU LIFESTYLE</p>
          <h2 className="headline mt-4 max-w-xl text-5xl leading-[0.9] md:text-7xl">
            <span className="text-white">Fé no coração.</span>
            <br />
            <span className="text-brand-yellow">Jiu-jitsu como estilo de vida.</span>
          </h2>
          <BrushUnderline color="cyan" className="mt-4 h-4 w-56 md:w-72" />
          <div className="mt-8 border-l-2 border-brand-pink pl-5">
            <p className="font-display text-xl tracking-wide text-white">FLOWJESUS GRAPPLING CLUB</p>
            <p className="mt-3 max-w-md text-base leading-relaxed text-white/70">
              Uma peça criada para quem leva o jiu-jitsu além do tatame.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="font-display text-3xl text-brand-yellow">R$ 99,00</p>
              <p className="mt-1 font-display text-base text-brand-cyan">R$ 94,05 no Pix</p>
            </div>
            <Button href="/loja?categoria=jiu-jitsu-lifestyle" variant="pink" className="shrink-0">
              CONHECER A COLEÇÃO
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
