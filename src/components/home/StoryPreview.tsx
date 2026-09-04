import { StreetImage } from "@/components/ui/StreetImage";
import { Button } from "@/components/ui/Button";
import { BrushUnderline } from "@/components/ui/BrushUnderline";
import { Crown, Splatter, StampSeal } from "@/components/ui/Graphics";
import { Reveal } from "@/components/ui/Reveal";

export function StoryPreview() {
  return (
    <section className="relative overflow-hidden border-y border-white/10 bg-ink py-20">
      <Splatter className="pointer-events-none absolute right-0 top-0 h-96 w-96 text-brand-pink/10" />
      <div className="mx-auto grid max-w-container items-center gap-10 px-4 md:px-8 lg:grid-cols-2">
        {/* imagem editorial */}
        <Reveal dir="left" className="relative">
          <div className="absolute -left-4 -top-4 h-40 w-40 rounded-full bg-brand-cyan/20 blur-2xl" />
          <StreetImage
            src=""
            alt="Isaque Lima com kimono de jiu-jítsu"
            kind="cover"
            accent="yellow"
            label="ISAQUE LIMA · KIMONO"
            className="aspect-[4/5] w-full shadow-card"
          />
          <StampSeal className="absolute -bottom-6 -right-4 h-28 w-24 text-brand-yellow drop-shadow-xl" />
        </Reveal>

        {/* texto */}
        <Reveal dir="right">
          <Crown className="mb-4 h-7 w-11 text-brand-pink" />
          <h2 className="headline text-4xl leading-[0.9] md:text-6xl">
            <span className="text-white">Antes das medalhas,</span>
            <br />
            <span className="text-brand-yellow">existe um propósito.</span>
          </h2>
          <BrushUnderline color="pink" className="mt-3 h-4 w-2/3" />
          <p className="mt-6 max-w-lg text-white/70">
            Uma história de fé, disciplina e família. De treinos que ninguém vê às competições que
            todos aplaudem — cada conquista aponta para um mesmo lugar:{" "}
            <span className="text-brand-cyan">o propósito de glorificar a Deus.</span>
          </p>
          <div className="mt-8">
            <Button href="/historia" variant="pink">
              CONHECER A HISTÓRIA
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
