"use client";

import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Volume2, Heart } from "lucide-react";
import { usePlayer } from "@/context/PlayerContext";
import { tracks, fmtTime } from "@/data/tracks";
import { LogoMini } from "./LogoMini";

export function AudioPlayer() {
  const {
    current,
    isPlaying,
    progress,
    volume,
    shuffle,
    repeat,
    favorites,
    play,
    toggle,
    next,
    prev,
    seek,
    setVolume,
    toggleShuffle,
    toggleRepeat,
    toggleFavorite,
  } = usePlayer();

  const shown = current ?? tracks[0];
  const pct = current ? Math.min(100, (progress / current.duration) * 100) : 0;
  const fav = favorites.includes(shown.id);

  return (
    <div className="relative overflow-hidden border border-white/10 bg-black/40 p-6 md:p-10">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{ background: "radial-gradient(80% 60% at 20% 0%, rgba(0,217,255,0.18), transparent 60%)" }}
      />
      <div className="relative flex flex-col items-center gap-8 lg:flex-row">
        {/* capa */}
        <LogoMini accent={shown.accent} className="h-52 w-52 shrink-0 shadow-card md:h-64 md:w-64" />

        <div className="w-full flex-1">
          <p className="font-display text-xs tracking-[0.3em] text-brand-cyan">TOCANDO AGORA</p>
          <div className="mt-2 flex items-start justify-between gap-4">
            <div>
              <h2 className="font-brush text-4xl md:text-5xl">{shown.title}</h2>
              <p className="mt-1 text-white/60">{shown.artist}</p>
            </div>
            <button
              onClick={() => toggleFavorite(shown.id)}
              aria-label="Favoritar"
              className={fav ? "text-brand-pink" : "text-white/40 hover:text-white"}
            >
              <Heart className={`h-7 w-7 ${fav ? "fill-current" : ""}`} />
            </button>
          </div>

          {/* timeline */}
          <div className="mt-6 flex items-center gap-3">
            <span className="text-xs tabular-nums text-white/50">{fmtTime(current ? progress : 0)}</span>
            <button
              className="group relative h-4 flex-1"
              aria-label="Buscar na faixa"
              onClick={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                seek(((e.clientX - r.left) / r.width) * shown.duration);
              }}
            >
              <div className="absolute top-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div className="h-full bg-brand-pink" style={{ width: `${pct}%` }} />
              </div>
            </button>
            <span className="text-xs tabular-nums text-white/50">{fmtTime(shown.duration)}</span>
          </div>

          {/* controles */}
          <div className="mt-6 flex items-center justify-center gap-5 lg:justify-start">
            <button
              onClick={toggleShuffle}
              aria-label="Aleatório"
              className={shuffle ? "text-brand-cyan" : "text-white/50 hover:text-white"}
            >
              <Shuffle className="h-5 w-5" />
            </button>
            <button onClick={prev} aria-label="Anterior" className="text-white/80 hover:text-white">
              <SkipBack className="h-6 w-6 fill-current" />
            </button>
            <button
              onClick={() => (current ? toggle() : play(tracks[0], tracks))}
              aria-label={isPlaying ? "Pausar" : "Tocar"}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-pink text-white shadow-glowPink transition-transform hover:scale-105"
            >
              {isPlaying ? <Pause className="h-7 w-7 fill-current" /> : <Play className="ml-1 h-7 w-7 fill-current" />}
            </button>
            <button onClick={next} aria-label="Próxima" className="text-white/80 hover:text-white">
              <SkipForward className="h-6 w-6 fill-current" />
            </button>
            <button
              onClick={toggleRepeat}
              aria-label="Repetir"
              className={repeat ? "text-brand-cyan" : "text-white/50 hover:text-white"}
            >
              <Repeat className="h-5 w-5" />
            </button>
          </div>

          {/* volume */}
          <div className="mt-6 flex items-center gap-3">
            <Volume2 className="h-5 w-5 text-white/50" />
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-40 accent-brand-pink"
              aria-label="Volume"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
