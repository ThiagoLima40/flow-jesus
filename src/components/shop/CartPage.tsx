"use client";

import { useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatBRL, getProductImages } from "@/data/products";
import { StreetImage } from "@/components/ui/StreetImage";
import { Button } from "@/components/ui/Button";
import { Cross } from "@/components/ui/Graphics";

export function CartPage() {
  const { items, getProduct, updateQuantity, removeItem, subtotal, count, clearCart } = useCart();
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const shipping = subtotal > 250 || subtotal === 0 ? 0 : 24.9;
  const total = Math.max(0, subtotal - discount) + shipping;

  const applyCoupon = () => {
    if (coupon.trim().toUpperCase() === "FLOW10") setDiscount(subtotal * 0.1);
    else setDiscount(0);
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-container flex-col items-center gap-5 px-4 py-32 text-center">
        <Cross className="h-16 w-12 text-white/20" />
        <h1 className="headline text-4xl md:text-5xl">Seu carrinho está vazio</h1>
        <p className="max-w-md text-white/55">
          Ainda não há nada por aqui. Que tal vestir aquilo em que você acredita?
        </p>
        <Button href="/colecao" variant="pink">VER COLEÇÃO</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-container px-4 py-12 md:px-8">
      <h1 className="headline text-4xl md:text-6xl">
        <span className="text-white">MEU </span>
        <span className="text-brand-yellow">CARRINHO</span>
        <span className="ml-3 font-sans text-lg text-white/50">({count})</span>
      </h1>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_360px]">
        {/* itens */}
        <div className="divide-y divide-white/10 border-y border-white/10">
          {items.map((item) => {
            const p = getProduct(item.productId);
            if (!p) return null;
            return (
              <div key={`${item.productId}-${item.size}-${item.color}`} className="flex gap-4 py-6">
                <StreetImage
                  src={getProductImages(p, item.color)[0]}
                  alt={p.name}
                  kind="product"
                  accent={p.accent}
                  label={p.name}
                  className="h-32 w-24 shrink-0"
                />
                <div className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display text-base tracking-wide">{p.name}</h3>
                      <p className="text-sm text-white/50">
                        {item.size} · {item.color}
                      </p>
                    </div>
                    <button
                      onClick={() => removeItem(item.productId, item.size, item.color)}
                      aria-label="Remover"
                      className="text-white/40 hover:text-brand-pink"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex items-center border border-white/15">
                      <button onClick={() => updateQuantity(item.productId, item.size, item.color, item.qty - 1)} aria-label="Diminuir" className="p-2 hover:text-brand-pink">
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-10 text-center tabular-nums">{item.qty}</span>
                      <button onClick={() => updateQuantity(item.productId, item.size, item.color, item.qty + 1)} aria-label="Aumentar" className="p-2 hover:text-brand-pink">
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <span className="font-display text-lg text-brand-yellow">{formatBRL(p.price * item.qty)}</span>
                  </div>
                </div>
              </div>
            );
          })}
          <div className="flex justify-between py-4">
            <button onClick={clearCart} className="text-sm text-white/40 hover:text-brand-pink">
              Esvaziar carrinho
            </button>
            <Button href="/colecao" variant="outline" arrow={false} className="!px-4 !py-2 text-xs">
              CONTINUAR COMPRANDO
            </Button>
          </div>
        </div>

        {/* resumo */}
        <aside className="h-fit border border-white/10 bg-black/30 p-6">
          <h2 className="font-brush text-2xl">Resumo</h2>

          <div className="mt-4 flex gap-2">
            <input
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
              placeholder="Cupom (ex: FLOW10)"
              className="h-11 flex-1 border border-white/20 bg-transparent px-3 text-sm outline-none focus:border-brand-cyan"
              aria-label="Cupom de desconto"
            />
            <button onClick={applyCoupon} className="border border-white/20 px-4 text-sm hover:border-brand-pink">
              Aplicar
            </button>
          </div>

          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-white/60">Subtotal</dt>
              <dd>{formatBRL(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-white/60">Frete</dt>
              <dd>{shipping === 0 ? "Grátis" : formatBRL(shipping)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-white/60">Desconto</dt>
              <dd className="text-brand-cyan">{discount > 0 ? `- ${formatBRL(discount)}` : "—"}</dd>
            </div>
            <div className="flex justify-between border-t border-white/10 pt-3">
              <dt className="font-display tracking-[0.15em]">TOTAL</dt>
              <dd className="font-brush text-2xl text-brand-yellow">{formatBRL(total)}</dd>
            </div>
          </dl>

          <Button href="/checkout" variant="pink" className="mt-6 w-full justify-center">
            FINALIZAR COMPRA
          </Button>
          <p className="mt-3 text-center text-xs text-white/40">Compra 100% segura · Frete grátis acima de R$ 250</p>
        </aside>
      </div>
    </div>
  );
}
