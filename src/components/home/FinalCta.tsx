import { Button } from "@/components/ui/Button";
import { Splatter, PeaceHand, SmileyCross, Crown } from "@/components/ui/Graphics";
import { Reveal } from "@/components/ui/Reveal";

export function FinalCta() {
  return (
    <section className="relative overflow-hidden bg-street py-24 tex-noise">
      <Splatter className="pointer-events-none absolute left-0 top-0 h-96 w-96 text-brand-pink/15" />
      <Splatter className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 text-brand-cyan/15" />
      <SmileyCross className="pointer-events-none absolute bottom-6 left-8 hidden h-24 w-24 text-brand-yellow/70 md:block" />
      <PeaceHand className="pointer-events-none absolute right-8 top-10 hidden h-28 w-20 text-white/80 md:block" />

      <Reveal className="relative mx-auto max-w-container px-4 text-center md:px-8">
        <Crown className="mx-auto mb-4 h-9 w-14 text-brand-yellow" />
        <h2 className="headline text-5xl leading-[0.9] md:text-8xl">
          <span className="text-white">FAÇA PARTE DO</span>{" "}
          <span className="text-brand-yellow">MOVIMENTO.</span>
        </h2>
        <p className="mx-auto mt-6 max-w-2xl font-brush text-2xl md:text-3xl">
          Vista a <span className="text-brand-pink">fé.</span> Viva o{" "}
          <span className="text-brand-yellow">propósito.</span> Transforme o{" "}
          <span className="text-brand-cyan">mundo.</span>
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Button href="/colecao" variant="pink">
            COMPRAR AGORA
          </Button>
          <Button href="/historia" variant="outline">
            CONHECER A HISTÓRIA
          </Button>
        </div>
      </Reveal>
    </section>
  );
}
