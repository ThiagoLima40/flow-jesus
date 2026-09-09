"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SlidersHorizontal, X } from "lucide-react";
import { products, categories, type Product } from "@/data/products";
import { ProductCard } from "./ProductCard";
import { Cross } from "@/components/ui/Graphics";

const SIZES = ["P", "M", "G", "GG"];
const COLORS = [
  { name: "Preto", hex: "#0a0a0a" },
  { name: "Branco", hex: "#f4f1ea" },
];
const SORTS = [
  { key: "destaque", label: "Destaque" },
  { key: "menor", label: "Menor preço" },
  { key: "maior", label: "Maior preço" },
  { key: "novos", label: "Novidades" },
];

export function CollectionBrowser() {
  const [cat, setCat] = useState<string>("todos");
  const [sort, setSort] = useState("destaque");
  const [maxPrice, setMaxPrice] = useState(300);
  const [sizes, setSizes] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [drawer, setDrawer] = useState(false);

  const toggle = (arr: string[], v: string, set: (x: string[]) => void) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const filtered = useMemo(() => {
    let list = products.filter((p: Product) => {
      if (cat !== "todos" && p.category !== cat) return false;
      if (p.price > maxPrice) return false;
      if (sizes.length && !sizes.some((s) => p.sizes.includes(s))) return false;
      if (colors.length && !colors.some((c) => p.colors.some((pc) => pc.name === c))) return false;
      return true;
    });
    if (sort === "menor") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "maior") list = [...list].sort((a, b) => b.price - a.price);
    if (sort === "novos") list = [...list].sort((a, b) => (b.badge === "NOVO" ? 1 : 0) - (a.badge === "NOVO" ? 1 : 0));
    if (sort === "destaque") list = [...list].sort((a, b) => Number(b.featured) - Number(a.featured));
    return list;
  }, [cat, sort, maxPrice, sizes, colors]);

  const Filters = () => (
    <div className="space-y-8">
      <div>
        <h3 className="mb-3 font-display text-sm tracking-[0.2em] text-brand-yellow">PREÇO</h3>
        <input
          type="range"
          min={50}
          max={300}
          step={10}
          value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          className="w-full accent-brand-pink"
          aria-label="Preço máximo"
        />
        <p className="mt-1 text-sm text-white/60">Até R$ {maxPrice},00</p>
      </div>
      <div>
        <h3 className="mb-3 font-display text-sm tracking-[0.2em] text-brand-yellow">TAMANHO</h3>
        <div className="flex flex-wrap gap-2">
          {SIZES.map((s) => (
            <button
              key={s}
              onClick={() => toggle(sizes, s, setSizes)}
              className={`h-9 w-9 border text-sm ${
                sizes.includes(s) ? "border-brand-pink bg-brand-pink text-white" : "border-white/20 text-white/70"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      <div>
        <h3 className="mb-3 font-display text-sm tracking-[0.2em] text-brand-yellow">COR</h3>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <button
              key={c.name}
              onClick={() => toggle(colors, c.name, setColors)}
              className={`flex items-center gap-2 border px-3 py-1.5 text-sm ${
                colors.includes(c.name) ? "border-brand-pink" : "border-white/20"
              }`}
            >
              <span className="h-4 w-4 rounded-full border border-white/30" style={{ background: c.hex }} />
              {c.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <section className="bg-street py-14">
      <div className="mx-auto max-w-container px-4 md:px-8">
        {/* categorias */}
        <div className="no-scrollbar mb-8 flex gap-2 overflow-x-auto">
          {categories.map((c) => (
            <button
              key={c.key}
              onClick={() => setCat(c.key)}
              className={`shrink-0 border px-4 py-2 font-display text-xs tracking-[0.15em] transition-colors ${
                cat === c.key
                  ? "border-brand-pink bg-brand-pink text-white"
                  : "border-white/15 text-white/70 hover:border-white/40"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
          {/* filtros laterais desktop */}
          <aside className="hidden lg:block">
            <Filters />
          </aside>

          <div>
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm text-white/55">{filtered.length} peças</p>
              <div className="flex items-center gap-3">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="border border-white/15 bg-ink px-3 py-2 text-sm outline-none focus:border-brand-cyan"
                  aria-label="Ordenar"
                >
                  {SORTS.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setDrawer(true)}
                  className="flex items-center gap-2 border border-white/15 px-3 py-2 text-sm lg:hidden"
                >
                  <SlidersHorizontal className="h-4 w-4" /> Filtros
                </button>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-24 text-center">
                <Cross className="h-12 w-9 text-white/20" />
                <p className="font-brush text-2xl">Nenhuma peça encontrada</p>
                <p className="text-sm text-white/50">Tente ajustar os filtros.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-x-4 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((p, i) => (
                  <ProductCard key={p.id} product={p} index={i} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* drawer de filtros mobile */}
      <AnimatePresence>
        {drawer && (
          <>
            <motion.div className="fixed inset-0 z-[80] bg-black/70" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDrawer(false)} />
            <motion.div
              className="fixed inset-y-0 left-0 z-[81] w-80 max-w-[85%] overflow-y-auto border-r border-white/10 bg-ink p-6"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.3 }}
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="font-brush text-2xl">Filtros</h2>
                <button onClick={() => setDrawer(false)} aria-label="Fechar filtros">
                  <X className="h-6 w-6" />
                </button>
              </div>
              <Filters />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </section>
  );
}
