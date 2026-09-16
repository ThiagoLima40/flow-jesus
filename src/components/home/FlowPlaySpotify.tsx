import { Crown, Splatter } from "@/components/ui/Graphics";

export function FlowPlaySpotify() {
  return (
    <section aria-labelledby="flow-play-spotify-title" className="relative overflow-hidden border-t border-white/10 bg-ink py-16 md:py-24">
      <Splatter className="pointer-events-none absolute -left-20 top-6 h-64 w-64 text-brand-cyan/10" />
      <div className="relative mx-auto grid max-w-container items-center gap-10 px-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] md:gap-12 md:px-8">
        <div>
          <div className="mb-4 flex items-center gap-3">
            <span className="h-1 w-10 bg-brand-cyan" />
            <span className="font-display text-xs tracking-[0.25em] text-brand-cyan">SOM PRA SEGUIR EM FRENTE</span>
          </div>
          <h2 id="flow-play-spotify-title" className="headline text-6xl text-white sm:text-7xl lg:text-8xl">
            FLOW <span className="text-brand-yellow">PLAY</span>
          </h2>
          <p className="mt-5 font-brush text-3xl text-brand-cyan md:text-4xl">Playlist do Isaque</p>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-white/75 md:text-lg">
            Fé, treino e propósito. A trilha sonora que acompanha o Isaque dentro e fora dos tatames.
          </p>
          <Crown className="mt-7 h-7 w-11 text-brand-yellow" />
        </div>

        <div className="min-w-0 border border-brand-yellow/40 bg-black p-2 shadow-card sm:p-3">
          <iframe
            title="Playlist do Isaque no Spotify"
            src="https://open.spotify.com/embed/playlist/4Pqg1S87nwGKqxd1G2q1LO"
            width="100%"
            height="352"
            loading="lazy"
            allow="clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            className="block w-full rounded-lg"
          />
        </div>
      </div>
    </section>
  );
}
