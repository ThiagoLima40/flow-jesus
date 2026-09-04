"use client";

import { useMemo, useState } from "react";
import { Play, Pause, Heart } from "lucide-react";
import { usePlayer } from "@/context/PlayerContext";
import { tracks, playlists, fmtTime } from "@/data/tracks";
import { AudioPlayer } from "./AudioPlayer";
import { LogoMini } from "./LogoMini";

export function FlowPlayClient() {
  const { current, isPlaying, play, toggle, favorites, toggleFavorite } = usePlayer();
  const [pl, setPl] = useState<string>("TODAS");

  const list = useMemo(
    () => (pl === "TODAS" ? tracks : tracks.filter((t) => t.playlist === pl)),
    [pl]
  );

  return (
    <section className="bg-street pb-24">
      <div className="mx-auto max-w-container px-4 md:px-8">
        <AudioPlayer />

        {/* playlists */}
        <div className="no-scrollbar mt-10 flex gap-2 overflow-x-auto">
          {["TODAS", ...playlists].map((p) => (
            <button
              key={p}
              onClick={() => setPl(p)}
              className={`shrink-0 border px-4 py-2 font-display text-xs tracking-[0.15em] transition-colors ${
                pl === p ? "border-brand-pink bg-brand-pink text-white" : "border-white/15 text-white/70 hover:border-white/40"
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* lista de faixas */}
        <div className="mt-6 divide-y divide-white/10 border border-white/10">
          {list.length === 0 ? (
            <p className="p-10 text-center text-white/50">Playlist vazia por enquanto. Em breve, mais som. 🎧</p>
          ) : (
            list.map((t, i) => {
              const isCurrent = current?.id === t.id;
              const fav = favorites.includes(t.id);
              return (
                <div
                  key={t.id}
                  className={`flex items-center gap-4 px-4 py-3 transition-colors hover:bg-white/5 ${isCurrent ? "bg-white/5" : ""}`}
                >
                  <span className="w-5 text-center text-sm text-white/40">{i + 1}</span>
                  <button
                    onClick={() => (isCurrent ? toggle() : play(t, list))}
                    aria-label={isCurrent && isPlaying ? "Pausar" : `Tocar ${t.title}`}
                    className="relative"
                  >
                    <LogoMini accent={t.accent} className="h-12 w-12" />
                    <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100">
                      {isCurrent && isPlaying ? (
                        <Pause className="h-5 w-5 fill-white" />
                      ) : (
                        <Play className="ml-0.5 h-5 w-5 fill-white" />
                      )}
                    </span>
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-sm ${isCurrent ? "text-brand-pink" : ""}`}>{t.title}</p>
                    <p className="truncate text-xs text-white/45">{t.artist}</p>
                  </div>
                  <span className="hidden font-display text-[0.6rem] tracking-[0.15em] text-white/40 sm:block">
                    {t.playlist}
                  </span>
                  <button
                    onClick={() => toggleFavorite(t.id)}
                    aria-label="Favoritar"
                    className={fav ? "text-brand-pink" : "text-white/30 hover:text-white"}
                  >
                    <Heart className={`h-4 w-4 ${fav ? "fill-current" : ""}`} />
                  </button>
                  <span className="w-10 text-right text-xs tabular-nums text-white/45">{fmtTime(t.duration)}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
