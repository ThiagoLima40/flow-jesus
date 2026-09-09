"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { type Product, formatBRL, getProductImages } from "@/data/products";
import { useCart } from "@/context/CartContext";
import { StreetImage } from "@/components/ui/StreetImage";
import { Badge } from "@/components/ui/Badge";

export function ProductCard({ product }: { product: Product; index?: number }) {
  const { addItem } = useCart();
  const defaultSize = product.sizes.includes("M") ? "M" : product.sizes[0];
  const defaultColor = product.colors[0].name;
  const images = getProductImages(product, defaultColor);
  const href = `/produto/${product.slug}`;

  return (
    <article className="group relative flex h-full flex-col border border-white/10 bg-black/30">
      <Link href={href} className="relative block overflow-hidden bg-ink-soft" aria-label={`Ver ${product.name}`}>
        {product.badge && <div className="absolute left-2 top-2 z-10"><Badge kind={product.badge} /></div>}
        <StreetImage src={images[0]} alt={`${product.name} — estampa, ${defaultColor}`} kind="product" fit="contain" accent={product.accent} label={product.name} className="aspect-[4/5] w-full" />
        {images[1] && (
          <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-within:opacity-100">
            <StreetImage src={images[1]} alt={`${product.name} — frente, ${defaultColor}`} kind="product" fit="contain" accent={product.accent} className="aspect-[4/5] w-full bg-ink-soft" />
          </div>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <Link href={href} className="font-display text-base tracking-wide hover:text-brand-yellow">{product.name}</Link>
        <div>
          <p className="font-display text-xl text-brand-yellow">{formatBRL(product.price)}</p>
          <p className="text-xs text-white/50">3x de {formatBRL(product.price / 3)}</p>
        </div>
        <ul className="flex flex-wrap gap-3" aria-label="Cores disponíveis">
          {product.colors.map((color) => <li key={color.name} className="flex items-center gap-1.5 text-xs text-white/70"><span className="h-3.5 w-3.5 rounded-full border border-white/30" style={{ background: color.hex }} />{color.name}</li>)}
        </ul>
        <div className="mt-auto flex items-center gap-2 pt-2">
          <Link href={href} className="btn btn-pink flex-1 justify-center !px-3 !py-3 text-xs">Ver produto</Link>
          <button onClick={() => addItem(product.id, defaultSize, defaultColor)} aria-label={`Adicionar ${product.name}, ${defaultColor}, tamanho ${defaultSize} ao carrinho`} title={`Adicionar ${defaultColor}, tamanho ${defaultSize}`} className="shrink-0 border border-white/20 p-3 text-white/70 hover:border-brand-pink hover:text-white"><ShoppingBag className="h-5 w-5" /></button>
        </div>
      </div>
    </article>
  );
}
