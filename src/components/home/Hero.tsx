"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { StreetImage } from "@/components/ui/StreetImage";
import { Crown, Splatter, SmileyCross, Cross, PeaceHand } from "@/components/ui/Graphics";
import { Sticker } from "@/components/ui/Sticker";
import { BrushUnderline } from "@/components/ui/BrushUnderline";

export function Hero() {
  const reduce = useReducedMotion();
  const rise = (d: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 26 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.7, delay: d, ease: [0.22, 1, 0.36, 1] as const },
        };

  return (
    <section className="relative overflow-hidden bg-street tex-noise pt-28 md:pt-32">
      {/* respingos de tinta ao fundo */}
      <Splatter className="pointer-events-none absolute -left-20 top-24 h-72 w-72 text-brand-cyan/20" />
      <Splatter className="pointer-events-none absolute right-0 top-1/3 h-80 w-80 text-brand-pink/20" />

      <div className="mx-auto grid max-w-container items-center gap-8 px-4 pb-16 md:px-8 lg:grid-cols-[45%_55%] lg:pb-24">
        {/* ESQUERDA */}
        <div className="relative z-10">
          <motion.div {...rise(0)} className="relative z-20 mb-5 flex flex-wrap items-center gap-2">
            <Sticker color="cyan" rotate={-4}>
              JOÃO 3:16
            </Sticker>
            <Sticker color="pink" rotate={3}>
              ELE VIVE
            </Sticker>
            <Sticker color="yellow" rotate={-2}>
              ROMANOS 8:31
            </Sticker>
          </motion.div>

          <div className="relative">
            <Crown className="absolute -left-1 -top-7 z-0 h-8 w-12 -rotate-12 text-brand-pink md:-top-9 md:h-10 md:w-16" />
            <motion.h1 {...rise(0.05)} className="headline text-6xl leading-[0.85] md:text-8xl">
              <span className="text-white ink-shadow">Vista</span>{" "}
              <span className="text-white ink-shadow">a fé.</span>
            </motion.h1>
            <motion.h1 {...rise(0.15)} className="headline mt-1 text-6xl leading-[0.85] text-brand-yellow ink-shadow md:text-8xl">
              Viva o propósito.
            </motion.h1>
            <motion.div {...rise(0.2)}>
              <BrushUnderline color="pink" className="mt-2 h-4 w-3/4" />
            </motion.div>
          </div>

          <motion.p {...rise(0.28)} className="mt-6 max-w-lg text-base leading-relaxed text-white/75 md:text-lg">
            <span className="font-display tracking-wide text-brand-yellow">FÉ</span> que te move.{" "}
            <span className="font-display tracking-wide text-brand-cyan">DISCIPLINA</span> que te forma.
            Estilo que te representa.{" "}
            <span className="font-display tracking-wide text-brand-pink">PROPÓSITO</span> que te define.
          </motion.p>

          <motion.div {...rise(0.38)} className="mt-8 flex flex-wrap gap-3">
            <Button href="/colecao" variant="pink">
              VER COLEÇÃO
            </Button>
            <Button href="/historia" variant="outline">
              CONHECER A HISTÓRIA
            </Button>
          </motion.div>

          {/* mini-stats */}
          <motion.div {...rise(0.5)} className="mt-10 flex gap-8 border-t border-white/10 pt-6">
            {[
              ["28", "CAMPEONATOS", "text-brand-yellow"],
              ["+1.000", "NO MOVIMENTO", "text-brand-cyan"],
              ["1", "PROPÓSITO", "text-brand-pink"],
            ].map(([n, l, c]) => (
              <div key={l}>
                <p className={`font-brush text-3xl ${c}`}>{n}</p>
                <p className="font-display text-[0.6rem] tracking-[0.18em] text-white/55">{l}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* DIREITA — composição editorial */}
        <motion.div
          initial={reduce ? undefined : { opacity: 0, scale: 0.96 }}
          animate={reduce ? undefined : { opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto h-[420px] w-full max-w-xl md:h-[560px]"
        >
          {/* pinceladas de fundo */}
          <div className="absolute right-6 top-6 h-72 w-72 rotate-12 rounded-full bg-brand-cyan/20 blur-2xl md:h-96 md:w-96" />
          <div className="absolute bottom-10 left-2 h-56 w-56 -rotate-12 rounded-full bg-brand-pink/20 blur-2xl" />

          {/* camiseta branca atrás */}
          <div className="absolute right-2 top-2 w-[58%] rotate-3">
            <StreetImage
              src=""
              alt="Camiseta FLOW JESUS branca — coleção"
              kind="product"
              accent="cyan"
              label="REINO"
              className="aspect-[4/5] w-full shadow-card"
            />
          </div>
          {/* camiseta preta na frente */}
          <div className="absolute bottom-0 left-0 w-[62%] -rotate-3">
            <StreetImage
              src=""
              alt="Camiseta FLOW JESUS preta — destaque"
              kind="product"
              accent="pink"
              label="NADA ALÉM DA GRAÇA"
              className="aspect-[4/5] w-full shadow-card"
              priority
            />
          </div>

          {/* selos flutuantes */}
          <SmileyCross className="absolute -left-4 top-8 h-16 w-16 text-brand-yellow drop-shadow-lg" />
          <Crown className="absolute right-4 top-0 h-8 w-12 rotate-6 text-brand-yellow" />
          <PeaceHand className="absolute -bottom-2 right-6 h-24 w-16 text-white/90" />
          <Cross className="absolute bottom-24 right-0 h-10 w-8 text-brand-pink" />
        </motion.div>
      </div>

      {/* faixa inferior de frase */}
      <div className="border-y border-white/10 bg-black/40">
        <div className="mx-auto max-w-container overflow-hidden px-4 py-3">
          <p className="text-center font-brush text-xl md:text-2xl">
            Dê o <span className="text-brand-pink">play.</span> Vista a{" "}
            <span className="text-brand-cyan">fé.</span> Viva o{" "}
            <span className="text-brand-yellow">propósito.</span>
          </p>
        </div>
      </div>
    </section>
  );
}
