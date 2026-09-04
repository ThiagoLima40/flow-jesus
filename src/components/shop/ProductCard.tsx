"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { type Product, formatBRL } from "@/data/products";
import { useCart } from "@/context/CartContext";
import { StreetImage } from "@/components/ui/StreetImage";
import { Badge } from "@/components/ui/Badge";

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const { addItem } = useCart();
  const defaultSize = product.sizes.includes("M") ? "M" : product.sizes[0];
  const defaultColor = product.colors[0]?.name ?? "Preto";
  const installment = (product.price / 3).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  return (
    <div className="group relative flex flex-col">
      <Link href={`/produto/${product.slug}`} className="relative block overflow-hidden">
        {product.badge && (
          <div className="absolute left-2 top-2 z-10">
            <Badge kind={product.badge} />
          </div>
        )}
        {/* imagem base */}
        <StreetImage
          src={product.images[0]}
          alt={product.name}
          kind="product"
          accent={product.accent}
          label={product.name}
          className="aspect-[4/5] w-full transition-transform duration-500 group-hover:scale-105"
        />
        {/* imagem hover (costas/alt) */}
        <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
          <StreetImage
            src={product.images[1]}
            alt={`${product.name} — verso`}
            kind="product"
            accent={product.accent === "pink" ? "cyan" : "pink"}
            label={`${product.name} · verso`}
            className="aspect-[4/5] w-full"
          />
        </div>
        {/* botão comprar revelado no hover */}
        <button
          onClick={(e) => {
            e.preventDefault();
            addItem(product.id, defaultSize, defaultColor);
          }}
          className="absolute inset-x-0 bottom-0 z-10 flex translate-y-full items-center justify-center gap-2 bg-brand-pink py-3 font-display text-xs tracking-[0.2em] text-white transition-transform duration-300 group-hover:translate-y-0"
          aria-label={`Adicionar ${product.name} ao carrinho`}
        >
          <ShoppingBag className="h-4 w-4" /> ADICIONAR
        </button>
      </Link>

      <div className="mt-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Link href={`/produto/${product.slug}`}>
            <h3 className="truncate font-display text-sm tracking-wide transition-colors group-hover:text-brand-yellow">
              {product.name}
            </h3>
          </Link>
          <p className="mt-0.5 font-display text-base text-white">{formatBRL(product.price)}</p>
          <p className="text-xs text-white/45">3x de {installment}</p>
        </div>
        <button
          onClick={() => addItem(product.id, defaultSize, defaultColor)}
          aria-label={`Adicionar ${product.name} ao carrinho`}
          className="shrink-0 rounded-full border border-white/15 p-2 text-white/70 transition-colors hover:border-brand-pink hover:bg-brand-pink hover:text-white"
        >
          <ShoppingBag className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
