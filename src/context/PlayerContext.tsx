"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { tracks as allTracks, type Track } from "@/data/tracks";

type PlayerCtx = {
  queue: Track[];
  current: Track | null;
  index: number;
  isPlaying: boolean;
  progress: number; // segundos
  volume: number;
  shuffle: boolean;
  repeat: boolean;
  favorites: string[];
  play: (track?: Track, queue?: Track[]) => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (sec: number) => void;
  setVolume: (v: number) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  toggleFavorite: (id: string) => void;
};

const Ctx = createContext<PlayerCtx | null>(null);

/**
 * Player global. NUNCA inicia automaticamente. Modo simulado quando a faixa
 * não tem `src` (timeline avança sem áudio real). Persiste ao trocar de página
 * porque o provider vive no layout raiz.
 */
export function PlayerProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<Track[]>(allTracks);
  const [index, setIndex] = useState(0);
  const [isPlaying, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVol] = useState(0.8);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [favorites, setFav] = useState<string[]>([]);
  const [started, setStarted] = useState(false); // já houve interação de play?

  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const current = started ? queue[index] ?? null : null;

  const gotoNext = useCallback(() => {
    setProgress(0);
    setIndex((i) => {
      if (shuffle && queue.length > 1) {
        let r = i;
        while (r === i) r = Math.floor((i + 1 + queue.length * 0.37) % queue.length);
        return r;
      }
      return (i + 1) % queue.length;
    });
  }, [shuffle, queue.length]);

  // "engine" de progresso (simulado)
  useEffect(() => {
    if (timer.current) clearInterval(timer.current);
    if (isPlaying && current) {
      timer.current = setInterval(() => {
        setProgress((p) => {
          if (p + 1 >= current.duration) {
            if (repeat) return 0;
            gotoNext();
            return 0;
          }
          return p + 1;
        });
      }, 1000);
    }
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [isPlaying, current, repeat, gotoNext]);

  const play = useCallback(
    (track?: Track, q?: Track[]) => {
      setStarted(true);
      if (q) setQueue(q);
      if (track) {
        const list = q ?? queue;
        const i = list.findIndex((t) => t.id === track.id);
        setIndex(i >= 0 ? i : 0);
        setProgress(0);
      }
      setPlaying(true);
    },
    [queue]
  );

  const toggle = useCallback(() => {
    if (!started) {
      setStarted(true);
      setPlaying(true);
      return;
    }
    setPlaying((p) => !p);
  }, [started]);

  const next = useCallback(() => {
    setStarted(true);
    gotoNext();
    setPlaying(true);
  }, [gotoNext]);

  const prev = useCallback(() => {
    setStarted(true);
    setProgress(0);
    setIndex((i) => (i - 1 + queue.length) % queue.length);
    setPlaying(true);
  }, [queue.length]);

  const seek = useCallback((sec: number) => setProgress(sec), []);
  const setVolume = useCallback((v: number) => setVol(Math.min(1, Math.max(0, v))), []);
  const toggleShuffle = useCallback(() => setShuffle((s) => !s), []);
  const toggleRepeat = useCallback(() => setRepeat((r) => !r), []);
  const toggleFavorite = useCallback(
    (id: string) => setFav((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id])),
    []
  );

  const value: PlayerCtx = useMemo(
    () => ({
      queue,
      current,
      index,
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
    }),
    [queue, current, index, isPlaying, progress, volume, shuffle, repeat, favorites, play, toggle, next, prev, seek, setVolume, toggleShuffle, toggleRepeat, toggleFavorite]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePlayer() {
  const c = useContext(Ctx);
  if (!c) throw new Error("usePlayer deve estar dentro de PlayerProvider");
  return c;
}
