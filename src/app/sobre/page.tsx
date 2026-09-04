import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import { StreetImage } from "@/components/ui/StreetImage";
import { Marquee } from "@/components/ui/Marquee";
import { Button } from "@/components/ui/Button";
import { Eye, Target } from "lucide-react";
import { Cross, Crown, SmileyCross } from "@/components/ui/Graphics";
import { Reveal } from "@/components/ui/Reveal";

export const metadata: Metadata = {
  title: "Sobre",
  description: "Mais que uma marca. Um movimento. A FLOW JESUS nasceu para unir estilo, fé e propósito.",
};

const valores = ["Fé", "Família", "Disciplina", "Humildade", "Propósito"];

export default function SobrePage() {
  return (
    <>
      <PageHero
        eyebrow="SOBRE A FLOW JESUS"
        title={
          <>
            <span className="text-white">MAIS QUE UMA MARCA.</span>
            <br />
            <span className="text-brand-yellow">UM MOVIMENTO.</span>
          </>
        }
        subtitle="A FLOW JESUS nasceu do desejo de unir estilo, fé e propósito. Criamos roupas que falam sobre quem somos e em quem acreditamos."
      />

      <section className="bg-street py-20">
        <div className="mx-auto max-w-container px-4 md:px-8">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <Reveal dir="left" className="relative">
              <StreetImage
                src=""
                alt="Movimento FLOW JESUS"
                kind="cover"
                accent="pink"
                label="O MOVIMENTO"
                className="aspect-[4/3] w-full shadow-card"
              />
              <SmileyCross className="absolute -bottom-6 -left-4 h-24 w-24 text-brand-yellow" />
            </Reveal>
            <Reveal dir="right">
              <Crown className="mb-4 h-7 w-11 text-brand-cyan" />
              <h2 className="headline text-3xl md:text-5xl">
                <span className="text-white">Vista aquilo em que</span>{" "}
                <span className="text-brand-pink">você acredita.</span>
              </h2>
              <p className="mt-5 text-white/70">
                Não vendemos apenas roupas — carregamos uma mensagem. Cada peça é um convite para
                viver com propósito, no tatame e na vida. Somos jovens que vestem a verdade e
                acreditam que a fé transforma.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {valores.map((v) => (
                  <span key={v} className="border border-white/15 px-3 py-1.5 font-display text-xs tracking-[0.15em] text-white/80">
                    {v.toUpperCase()}
                  </span>
                ))}
              </div>
            </Reveal>
          </div>

          {/* visão / missão / valores */}
          <div className="mt-16 grid gap-6 md:grid-cols-3">
            <Reveal className="border border-white/10 bg-black/30 p-7">
              <Eye className="h-8 w-8 text-brand-yellow" />
              <h3 className="mt-4 font-brush text-3xl">Nossa Visão</h3>
              <p className="mt-2 text-white/65">Alcançar vidas através da moda, do esporte e da fé.</p>
            </Reveal>
            <Reveal delay={0.1} className="border border-white/10 bg-black/30 p-7">
              <Target className="h-8 w-8 text-brand-pink" />
              <h3 className="mt-4 font-brush text-3xl">Nossa Missão</h3>
              <p className="mt-2 text-white/65">Levar a mensagem de Cristo de forma autêntica e criativa.</p>
            </Reveal>
            <Reveal delay={0.2} className="border border-white/10 bg-black/30 p-7">
              <Cross className="h-8 w-6 text-brand-cyan" />
              <h3 className="mt-4 font-brush text-3xl">Nossos Valores</h3>
              <p className="mt-2 text-white/65">Fé · Família · Disciplina · Humildade · Propósito.</p>
            </Reveal>
          </div>
        </div>
      </section>

      <Marquee items={["FÉ", "FAMÍLIA", "DISCIPLINA", "HUMILDADE", "PROPÓSITO"]} className="bg-ink" />

      <section className="bg-ink py-20 text-center">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="headline text-4xl md:text-6xl">
            <span className="text-white">Faça parte do</span>{" "}
            <span className="text-brand-yellow">movimento.</span>
          </h2>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button href="/colecao" variant="pink">VER COLEÇÃO</Button>
            <Button href="/contato" variant="outline">FALAR CONOSCO</Button>
          </div>
        </div>
      </section>
    </>
  );
}
