"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Play } from "lucide-react";
import { videos, videoCategories, type Video } from "@/data/videos";
import { StreetImage } from "@/components/ui/StreetImage";

export function BjjClient() {
  const [cat, setCat] = useState<string>("todos");
  const [open, setOpen] = useState<Video | null>(null);

  const list = useMemo(
    () => (cat === "todos" ? videos : videos.filter((v) => v.category === cat)),
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
              <button key={v.id} onClick={() => setOpen(v)} className="group text-left">
                <div className="relative overflow-hidden">
                  <StreetImage
                    src=""
                    alt={v.title}
                    kind="video"
                    accent={v.accent}
                    label={v.title}
                    className="aspect-video w-full transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-xs tabular-nums">
                    {v.duration}
                  </span>
                </div>
                <h3 className="mt-3 font-display text-sm tracking-wide transition-colors group-hover:text-brand-yellow">
                  {v.title}
                </h3>
                <p className="text-sm text-white/55">{v.description}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* modal de vídeo */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(null)}
            role="dialog"
            aria-modal="true"
            aria-label={open.title}
          >
            <motion.div
              className="relative w-full max-w-4xl"
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setOpen(null)}
                aria-label="Fechar vídeo"
                className="absolute -top-12 right-0 rounded-full p-2 text-white hover:bg-white/10"
              >
                <X className="h-7 w-7" />
              </button>
              <div className="relative flex aspect-video items-center justify-center border border-white/10 bg-ink-soft">
                {open.youtubeId ? (
                  <iframe
                    className="h-full w-full"
                    src={`https://www.youtube.com/embed/${open.youtubeId}`}
                    title={open.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="text-center">
                    <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-pink shadow-glowPink">
                      <Play className="ml-1 h-7 w-7 fill-white" />
                    </span>
                    <p className="mt-4 font-brush text-2xl">{open.title}</p>
                    <p className="text-sm text-white/50">Vídeo placeholder — pronto para integração com YouTube.</p>
                  </div>
                )}
              </div>
              <div className="mt-4">
                <h3 className="font-display text-lg tracking-wide">{open.title}</h3>
                <p className="text-white/60">{open.description}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
