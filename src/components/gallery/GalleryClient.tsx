"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { gallery, galleryCategories, type GalleryItem } from "@/data/gallery";
import { StreetImage } from "@/components/ui/StreetImage";

const spanClass: Record<GalleryItem["span"], string> = {
  tall: "row-span-2 aspect-[3/4]",
  wide: "aspect-[3/2]",
  square: "aspect-square",
};

export function GalleryClient({ items }: { items?: GalleryItem[] }) {
  const source = items && items.length > 0 ? items : gallery;
  const [cat, setCat] = useState<string>("todos");
  const [idx, setIdx] = useState<number | null>(null);

  const list = useMemo(
    () => (cat === "todos" ? source : source.filter((g) => g.category === cat)),
    [cat, source]
  );

  const close = useCallback(() => setIdx(null), []);
  const prev = useCallback(() => setIdx((i) => (i === null ? i : (i - 1 + list.length) % list.length)), [list.length]);
  const next = useCallback(() => setIdx((i) => (i === null ? i : (i + 1) % list.length)), [list.length]);

  useEffect(() => {
    if (idx === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [idx, close, prev, next]);

  const openItem = idx === null ? null : list[idx];

  return (
    <section className="bg-street py-14">
      <div className="mx-auto max-w-container px-4 md:px-8">
        <div className="no-scrollbar mb-8 flex gap-2 overflow-x-auto">
          {galleryCategories.map((c) => (
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
          <p className="py-24 text-center text-white/50">Nenhuma imagem nesta categoria ainda.</p>
        ) : (
          <div className="grid auto-rows-[minmax(0,1fr)] grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {list.map((g, i) => (
              <button
                key={g.id}
                onClick={() => setIdx(i)}
                className={`group relative overflow-hidden ${spanClass[g.span]}`}
                aria-label={`Abrir ${g.alt}`}
              >
                <StreetImage
                  src={g.src}
                  alt={g.alt}
                  kind="photo"
                  accent={g.accent}
                  label={g.category.toUpperCase()}
                  className="h-full w-full transition-transform duration-500 group-hover:scale-110"
                />
                <span className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* lightbox */}
      <AnimatePresence>
        {openItem && (
          <motion.div
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/90 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-label={openItem.alt}
          >
            <button onClick={close} aria-label="Fechar" className="absolute right-4 top-4 rounded-full p-2 hover:bg-white/10">
              <X className="h-8 w-8" />
            </button>
            <button onClick={prev} aria-label="Anterior" className="absolute left-2 rounded-full p-2 hover:bg-white/10 md:left-8">
              <ChevronLeft className="h-9 w-9" />
            </button>
            <motion.div
              key={openItem.id}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="max-h-[80vh] w-full max-w-3xl"
            >
              <StreetImage
                src={openItem.src}
                alt={openItem.alt}
                kind="photo"
                accent={openItem.accent}
                label={openItem.alt}
                className="aspect-[4/3] w-full"
              />
              <p className="mt-3 text-center text-sm text-white/60">{openItem.alt}</p>
            </motion.div>
            <button onClick={next} aria-label="Próxima" className="absolute right-2 rounded-full p-2 hover:bg-white/10 md:right-8">
              <ChevronRight className="h-9 w-9" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
