"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag, Shield, Truck, RefreshCw, Ruler, Minus, Plus } from "lucide-react";
import { type Product, formatBRL } from "@/data/products";
import { useCart } from "@/context/CartContext";
import { StreetImage } from "@/components/ui/StreetImage";
import { Badge } from "@/components/ui/Badge";
import { BrushUnderline } from "@/components/ui/BrushUnderline";
import { Cross } from "@/components/ui/Graphics";

export function ProductDetail({ product }: { product: Product }) {
  const { addItem } = useCart();
  const router = useRouter();
  const [size, setSize] = useState<string>(product.sizes.includes("M") ? "M" : product.sizes[0]);
  const [color, setColor] = useState(product.colors[0]?.name ?? "Preto");
  const [qty, setQty] = useState(1);
  const [active, setActive] = useState(0);
  const installment = formatBRL(product.price / 3);

  const add = () => addItem(product.id, size, color, qty);
  const buyNow = () => {
    addItem(product.id, size, color, qty);
    router.push("/carrinho");
  };

  return (
    <section className="bg-street pt-28 pb-20 md:pt-32">
      <div className="mx-auto max-w-container px-4 md:px-8">
        <div className="grid gap-10 lg:grid-cols-2">
          {/* GALERIA */}
          <div className="flex flex-col-reverse gap-4 md:flex-row">
            <div className="flex gap-3 md:flex-col">
              {[0, 1, 2, 3].map((i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={`h-20 w-16 shrink-0 border ${active === i ? "border-brand-pink" : "border-white/15"}`}
                  aria-label={`Ver imagem ${i + 1}`}
                >
                  <StreetImage
                    src={product.images[i]}
                    alt={`${product.name} ${i + 1}`}
                    kind="product"
                    accent={i % 2 ? "cyan" : product.accent}
                    label={`${i + 1}`}
                    className="h-full w-full"
                  />
                </button>
              ))}
            </div>
            <div className="relative flex-1">
              {product.badge && (
                <div className="absolute left-3 top-3 z-10">
                  <Badge kind={product.badge} />
                </div>
              )}
              <StreetImage
                src={product.images[active]}
                alt={product.name}
                kind="product"
                accent={active % 2 ? "cyan" : product.accent}
                label={product.name}
                className="aspect-[4/5] w-full shadow-card"
                priority
              />
            </div>
          </div>

          {/* INFO */}
          <div>
            <h1 className="headline text-4xl md:text-6xl">{product.name}</h1>
            <BrushUnderline color="pink" className="mt-2 h-3 w-40" />
            <p className="mt-5 text-white/70">{product.description}</p>

            <div className="mt-6">
              <p className="font-display text-3xl text-brand-yellow">{formatBRL(product.price)}</p>
              <p className="text-sm text-white/50">ou 3x de {installment} sem juros</p>
            </div>

            {/* cor */}
            <div className="mt-7">
              <p className="mb-2 font-display text-xs tracking-[0.2em] text-white/60">COR: {color}</p>
              <div className="flex gap-2">
                {product.colors.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => setColor(c.name)}
                    className={`flex items-center gap-2 border px-3 py-1.5 text-sm ${color === c.name ? "border-brand-pink" : "border-white/20"}`}
                  >
                    <span className="h-4 w-4 rounded-full border border-white/30" style={{ background: c.hex }} />
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* tamanho */}
            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between">
                <p className="font-display text-xs tracking-[0.2em] text-white/60">TAMANHO</p>
                <button className="flex items-center gap-1 text-xs text-brand-cyan hover:underline">
                  <Ruler className="h-3.5 w-3.5" /> Guia de medidas
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`h-11 min-w-11 border px-3 font-display text-sm ${size === s ? "border-brand-pink bg-brand-pink text-white" : "border-white/20 text-white/80"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* qtd + ações */}
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <div className="flex items-center border border-white/20">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Diminuir" className="p-3 hover:text-brand-pink">
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center tabular-nums">{qty}</span>
                <button onClick={() => setQty((q) => q + 1)} aria-label="Aumentar" className="p-3 hover:text-brand-pink">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <button onClick={add} className="btn btn-outline flex-1 justify-center">
                <ShoppingBag className="h-4 w-4" /> ADICIONAR AO CARRINHO
              </button>
            </div>
            <button onClick={buyNow} className="btn btn-pink mt-3 w-full justify-center">
              COMPRAR AGORA
            </button>

            {/* garantias */}
            <div className="mt-7 grid grid-cols-3 gap-3 border-t border-white/10 pt-6 text-center">
              {[
                { icon: Shield, t: "Compra 100% segura" },
                { icon: Truck, t: "Envio para todo Brasil" },
                { icon: RefreshCw, t: "Troca fácil" },
              ].map(({ icon: Icon, t }) => (
                <div key={t} className="flex flex-col items-center gap-1.5">
                  <Icon className="h-5 w-5 text-brand-cyan" />
                  <span className="text-xs text-white/60">{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* história da arte */}
        <div className="mt-16 grid gap-6 border-t border-white/10 pt-12 md:grid-cols-[auto_1fr] md:gap-10">
          <div className="flex items-start gap-3">
            <Cross className="h-8 w-6 text-brand-pink" />
            <h2 className="headline text-3xl md:text-4xl">
              A HISTÓRIA POR
              <br />
              <span className="text-brand-yellow">TRÁS DA ARTE</span>
            </h2>
          </div>
          <p className="max-w-2xl text-lg leading-relaxed text-white/75">{product.story}</p>
        </div>
      </div>
    </section>
  );
}
