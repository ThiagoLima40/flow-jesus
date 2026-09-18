"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { LogoMini } from "./LogoMini";

const PLAYLIST_ID = "5vPYOTxwUm2CBuffXzGFCL";
const PLAYLIST_URL = `https://open.spotify.com/playlist/${PLAYLIST_ID}`;

type SpotifyController = {
  play: () => void;
  pause: () => void;
  addListener: (
    event: "playback_update",
    callback: (event: { data: { isPaused: boolean } }) => void
  ) => void;
};

type SpotifyIframeApi = {
  createController: (
    element: HTMLElement,
    options: { uri: string; width: string; height: number },
    callback: (controller: SpotifyController) => void
  ) => void;
};

declare global {
  interface Window {
    onSpotifyIframeApiReady?: (api: SpotifyIframeApi) => void;
  }
}

export function AudioPlayer() {
  const embedRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<SpotifyController | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [embedFailed, setEmbedFailed] = useState(false);

  useEffect(() => {
    let active = true;
    const onReady = (api: SpotifyIframeApi) => {
      if (!active || !embedRef.current) return;
      api.createController(
        embedRef.current,
        { uri: `spotify:playlist:${PLAYLIST_ID}`, width: "100%", height: 352 },
        (controller) => {
          if (!active) return;
          controllerRef.current = controller;
          controller.addListener("playback_update", (event) => {
            if (active) setIsPlaying(!event.data.isPaused);
          });
          setIsReady(true);
        }
      );
    };

    window.onSpotifyIframeApiReady = onReady;
    const script = document.createElement("script");
    script.src = "https://open.spotify.com/embed/iframe-api/v1";
    script.async = true;
    script.onerror = () => {
      if (!active || !embedRef.current) return;
      const iframe = document.createElement("iframe");
      iframe.src = `https://open.spotify.com/embed/playlist/${PLAYLIST_ID}`;
      iframe.title = "Playlist Flow Play no Spotify";
      iframe.width = "100%";
      iframe.height = "352";
      iframe.allow = "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture";
      iframe.loading = "lazy";
      embedRef.current.appendChild(iframe);
      setEmbedFailed(true);
    };
    document.body.appendChild(script);

    return () => {
      active = false;
      controllerRef.current?.pause();
      controllerRef.current = null;
      if (window.onSpotifyIframeApiReady === onReady) {
        window.onSpotifyIframeApiReady = undefined;
      }
      script.remove();
    };
  }, []);

  const togglePlayback = () => {
    if (controllerRef.current) {
      if (isPlaying) controllerRef.current.pause();
      else controllerRef.current.play();
    } else {
      embedRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <>
      <div className="relative overflow-hidden border border-white/10 bg-black/40 p-6 md:p-10">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{ background: "radial-gradient(80% 60% at 20% 0%, rgba(0,217,255,0.18), transparent 60%)" }}
        />
        <div className="relative flex flex-col items-center gap-8 lg:flex-row">
          <LogoMini accent="pink" className="h-52 w-52 shrink-0 shadow-card md:h-64 md:w-64" />
          <div className="w-full flex-1">
            <p className="font-display text-xs tracking-[0.3em] text-brand-cyan">TOCANDO AGORA</p>
            <h2 className="mt-2 font-brush text-4xl md:text-5xl">FLOW PLAY</h2>
            <p className="mt-1 text-white/60">Dê o play. Vista a fé. Viva o propósito.</p>
            <div className="mt-6 flex items-center justify-center lg:justify-start">
              <button
                onClick={togglePlayback}
                aria-label={isPlaying ? "Pausar Spotify" : "Tocar Spotify"}
                aria-controls="flow-play-spotify"
                className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-pink text-white shadow-glowPink transition-transform hover:scale-105"
              >
                {isPlaying ? <Pause className="h-7 w-7 fill-current" /> : <Play className="ml-1 h-7 w-7 fill-current" />}
              </button>
            </div>
            <p className="mt-5 text-sm text-white/50">
              {isReady || embedFailed
                ? "Se o áudio não iniciar, toque no Play do Spotify abaixo."
                : "Carregando Spotify..."}
            </p>
          </div>
        </div>
      </div>
      <div className="mt-6 border border-white/10 bg-black/40 p-3 sm:p-4" id="flow-play-spotify">
        <div ref={embedRef} className="min-h-[352px] [&_iframe]:w-full" aria-label="Playlist Flow Play no Spotify" />
        <a
          href={PLAYLIST_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-block font-display text-xs tracking-[0.15em] text-brand-cyan hover:text-white"
        >
          ABRIR PLAYLIST NO SPOTIFY ↗
        </a>
      </div>
    </>
  );
}
