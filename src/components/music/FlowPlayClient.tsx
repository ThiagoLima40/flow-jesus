"use client";

import { AudioPlayer } from "./AudioPlayer";

export function FlowPlayClient() {
  return (
    <section className="bg-street pb-24">
      <div className="mx-auto max-w-container px-4 md:px-8">
        <AudioPlayer />
      </div>
    </section>
  );
}
