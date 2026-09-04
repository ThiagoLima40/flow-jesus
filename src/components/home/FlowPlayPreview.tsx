"use client";

import { Play, Pause, SkipBack, SkipForward, Heart } from "lucide-react";
import { usePlayer } from "@/context/PlayerContext";
import { tracks, fmtTime } from "@/data/tracks";
import { Button } from "@/components/ui/Button";
import { LogoMini } from "@/components/music/LogoMini";
import { Splatter, Crown } from "@/components/ui/Graphics";
import { Reveal } from "@/components/ui/Reveal";

export function FlowPlayPreview() {
  const { current, isPlaying, progress, play, toggle, next, prev, favorites, toggleFavorite } = usePlayer();
  const shown = current ?? tracks[0];
  const pct = current ? Math.min(100, (progress / current.duration) * 100) : 0;
  const fav = favorites.includes(shown.id);

  return (
    <section className="relative overflow-hidden border-y border-white/10 bg-ink py-20">
      <Splatter className="pointer-events-none absolute -right-16 bottom-0 h-80 w-80 text-brand-cyan/10" />
      <div className="mx-auto max-w-container px-4 md:px-8">
        <Reveal className="mb-10">
          <div className="flex items-end gap-3">
            <h2 className="headline text-4xl md:text-6xl">
              <span className="text-white">FLOW</span> <span className="text-brand-pink">PLAY</span>
            </h2>
            <Crown className="mb-2 h-6 w-9 text-brand-yellow" />
          </div>
          <p className="mt-2 font-display text-sm tracking-[0.2em] text-white/55">
            DÊ O PLAY. VISTA A FÉ. VIVA O PROPÓSITO.
          </p>
        </Reveal>

        <Reveal className="relative border border-white/10 bg-black/40 p-5 md:p-7">
          <div className="flex flex-col items-center gap-5 md:flex-row">
            <LogoMini accent={shown.accent} className="h-28 w-28 shrink-0 md:h-32 md:w-32" />
            <div className="w-full flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-display text-xl tracking-wide">{shown.title}</p>
                  <p className="text-sm text-white/55">{shown.artist}</p>
                </div>
                <button
                  onClick={() => toggleFavorite(shown.id)}
                  aria-label="Favoritar"
                  className={fav ? "text-brand-pink" : "text-white/40 hover:text-white"}
                >
                  <Heart className={`h-6 w-6 ${fav ? "fill-current" : ""}`} />
                </button>
              </div>

              {/* timeline */}
              <div className="mt-4 flex items-center gap-3">
                <span className="text-xs tabular-nums text-white/50">{fmtTime(current ? progress : 0)}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full bg-brand-pink" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs tabular-nums text-white/50">{fmtTime(shown.duration)}</span>
              </div>

              {/* controles */}
              <div className="mt-4 flex items-center justify-center gap-4 md:justify-start">
                <button onClick={prev} aria-label="Anterior" className="text-white/70 hover:text-white">
                  <SkipBack className="h-5 w-5 fill-current" />
                </button>
                <button
                  onClick={() => (current ? toggle() : play(tracks[0], tracks))}
                  aria-label={isPlaying ? "Pausar" : "Tocar"}
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-pink text-white shadow-glowPink transition-transform hover:scale-105"
                >
                  {isPlaying ? <Pause className="h-6 w-6 fill-current" /> : <Play className="ml-1 h-6 w-6 fill-current" />}
                </button>
                <button onClick={next} aria-label="Próxima" className="text-white/70 hover:text-white">
                  <SkipForward className="h-5 w-5 fill-current" />
                </button>
              </div>
            </div>
          </div>

          {/* faixas rápidas */}
          <div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {tracks.slice(0, 4).map((t) => (
              <button
                key={t.id}
                onClick={() => play(t, tracks)}
                className="flex items-center gap-3 border border-white/10 p-2 text-left transition-colors hover:border-brand-pink/50 hover:bg-white/5"
              >
                <LogoMini accent={t.accent} className="h-10 w-10 shrink-0" />
                <div className="min-w-0">
                  <p className="truncate text-sm">{t.title}</p>
                  <p className="truncate text-xs text-white/45">{t.artist}</p>
                </div>
                <Play className="ml-auto h-4 w-4 shrink-0 fill-current text-white/40" />
              </button>
            ))}
          </div>

          <div className="mt-6 flex justify-center">
            <Button href="/flow-play" variant="outline">
              ABRIR FLOW PLAY
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
