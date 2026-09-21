"use client";

import { useMemo, useState } from "react";
import { Instagram } from "lucide-react";
import { videos, videoCategories } from "@/data/videos";
import Image from "next/image";
import type { Video } from "@/data/videos";

const videoCovers: Record<Video["category"], { src: string; position: string }> = {
  treinos: { src: "/images/flow-bjj/treinos.jpg", position: "50% 32%" },
  campeonatos: { src: "/images/flow-bjj/campeonatos.jpg", position: "50% 35%" },
  bastidores: { src: "/images/flow-bjj/bastidores.jpg", position: "50% 30%" },
  oracao: { src: "/images/flow-bjj/oracao.jpg", position: "50% 15%" },
  testemunho: { src: "/images/flow-bjj/testemunho.jpg", position: "50% 5%" },
  viagens: { src: "/images/flow-bjj/viagens.jpg", position: "50% 60%" },
  preparacao: { src: "/images/flow-bjj/preparacao.jpg", position: "50% 35%" },
};

export function BjjClient() {
  const [cat, setCat] = useState<string>("todos");

  const list = useMemo(
    () => videos.filter((v) => v.instagramUrl && (cat === "todos" || v.category === cat)),
    [cat]
  );

  return (
    <section className="bg-street py-16">
      <div className="mx-auto max-w-container px-4 md:px-8">
        <div className="mb-8 flex items-end justify-between gap-4">
          <h2 className="headline text-3xl md:text-5xl">
            <span className="text-white">VÍDEOS EM </span>
            <span className="text-brand-yellow">DESTAQUE</span>
          </h2>
        </div>

        <div className="no-scrollbar mb-8 flex gap-2 overflow-x-auto">
          {videoCategories.map((c) => (
            <button
              key={c.key}
              onClick={() => setCat(c.key)}
              className={`shrink-0 border px-4 py-2 font-display text-xs tracking-[0.15em] transition-colors ${
                cat === c.key ? "border-brand-pink bg-brand-pink text-white" : "border-white/15 text-white/70 hover:border-white/40"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {list.length === 0 ? (
          <p className="py-20 text-center text-white/50">Nenhum vídeo nesta categoria ainda.</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((v) => (
              <a
                key={v.id}
                href={v.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${v.title} — Assistir no Instagram (abre em nova aba)`}
                className="group block text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-yellow"
              >
                <div className="relative overflow-hidden">
                  <div className="relative aspect-video w-full overflow-hidden transition-transform duration-500 group-hover:scale-105">
                    <Image
                      src={videoCovers[v.category].src}
                      alt={v.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover"
                      style={{ objectPosition: videoCovers[v.category].position }}
                    />
                    <span aria-hidden="true" className="absolute inset-0 z-[3] flex items-center justify-center">
                      <span
                        className="flex h-14 w-14 items-center justify-center rounded-full shadow-glowPink"
                        style={{ background: "#00d9ff" }}
                      >
                        <svg viewBox="0 0 24 24" className="ml-0.5 h-6 w-6 fill-white">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </span>
                    </span>
                  </div>
                  <span className="absolute right-2 top-2 z-10 rounded bg-black/70 p-1.5">
                    <Instagram aria-hidden="true" className="h-4 w-4" />
                  </span>
                  <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-xs tabular-nums">
                    {v.duration}
                  </span>
                </div>
                <h3 className="mt-3 font-display text-sm tracking-wide transition-colors group-hover:text-brand-yellow">
                  {v.title}
                </h3>
                <p className="text-sm text-white/55">{v.description}</p>
                <span className="mt-2 inline-block font-display text-xs tracking-wide text-brand-yellow">
                  Assistir no Instagram
                </span>
              </a>
            ))}
          </div>
        )}
      </div>

    </section>
  );
}
