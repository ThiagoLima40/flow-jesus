"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Play, Pause, SkipBack, SkipForward, Heart, X } from "lucide-react";
import { useState } from "react";
import { usePlayer } from "@/context/PlayerContext";
import { fmtTime } from "@/data/tracks";
import { LogoMini } from "./LogoMini";

export function MiniPlayer() {
  const {
    current,
    isPlaying,
    progress,
    toggle,
    next,
    prev,
    seek,
    favorites,
    toggleFavorite,
  } = usePlayer();
  const [dismissed, setDismissed] = useState(false);

  if (!current || dismissed) return null;
  const pct = Math.min(100, (progress / current.duration) * 100);
  const fav = favorites.includes(current.id);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 90, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 90, opacity: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 30 }}
        className="fixed inset-x-0 bottom-0 z-[70] border-t border-white/10 bg-ink/90 backdrop-blur-md"
        role="region"
        aria-label="Player em reprodução"
      >
        {/* timeline */}
        <button
          className="group absolute inset-x-0 -top-1 h-3 cursor-pointer"
          aria-label="Avançar faixa"
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            seek(((e.clientX - r.left) / r.width) * current.duration);
          }}
        >
          <div className="mt-1 h-1 w-full bg-white/10">
            <div className="h-full bg-brand-pink transition-all" style={{ width: `${pct}%` }} />
          </div>
        </button>

        <div className="mx-auto flex max-w-container items-center gap-3 px-3 py-2.5 md:px-8">
          <LogoMini accent={current.accent} className="h-11 w-11 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-sm tracking-wide">{current.title}</p>
            <p className="truncate text-xs text-white/50">{current.artist}</p>
          </div>

          <span className="hidden text-xs tabular-nums text-white/50 sm:block">
            {fmtTime(progress)} / {fmtTime(current.duration)}
          </span>

          <div className="flex items-center gap-1.5">
            <button onClick={prev} aria-label="Anterior" className="p-2 text-white/70 hover:text-white">
              <SkipBack className="h-4 w-4 fill-current" />
            </button>
            <button
              onClick={toggle}
              aria-label={isPlaying ? "Pausar" : "Tocar"}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-pink text-white shadow-glowPink"
            >
              {isPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="ml-0.5 h-5 w-5 fill-current" />}
            </button>
            <button onClick={next} aria-label="Próxima" className="p-2 text-white/70 hover:text-white">
              <SkipForward className="h-4 w-4 fill-current" />
            </button>
            <button
              onClick={() => toggleFavorite(current.id)}
              aria-label="Favoritar"
              className={`hidden p-2 sm:block ${fav ? "text-brand-pink" : "text-white/50 hover:text-white"}`}
            >
              <Heart className={`h-4 w-4 ${fav ? "fill-current" : ""}`} />
            </button>
            <button
              onClick={() => setDismissed(true)}
              aria-label="Fechar player"
              className="p-2 text-white/40 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
