"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { X, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { formatBRL, getProductImages } from "@/data/products";
import { StreetImage } from "@/components/ui/StreetImage";
import { Button } from "@/components/ui/Button";
import { Cross } from "@/components/ui/Graphics";

export function CartDrawer() {
  const { isOpen, close, items, getProduct, updateQuantity, removeItem, subtotal, count } = useCart();

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          />
          <motion.aside
            className="fixed inset-y-0 right-0 z-[81] flex w-full max-w-md flex-col border-l border-white/10 bg-ink tex-noise"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            aria-label="Carrinho de compras"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <h2 className="font-brush text-2xl">
                Meu <span className="text-brand-pink">carrinho</span>
                <span className="ml-2 font-sans text-sm text-white/50">({count})</span>
              </h2>
              <button onClick={close} aria-label="Fechar carrinho" className="rounded-full p-2 hover:bg-white/10">
                <X className="h-6 w-6" />
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
                <Cross className="h-12 w-9 text-white/20" />
                <p className="font-brush text-2xl">Seu carrinho está vazio</p>
                <p className="text-sm text-white/50">Que tal vestir aquilo em que você acredita?</p>
                <Button href="/colecao" onClick={close} variant="pink">
                  VER COLEÇÃO
                </Button>
              </div>
            ) : (
              <>
                <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
                  {items.map((item) => {
                    const p = getProduct(item.productId);
                    if (!p) return null;
                    return (
                      <div key={`${item.productId}-${item.size}-${item.color}`} className="flex gap-3 border-b border-white/10 pb-4">
                        <StreetImage
                          src={getProductImages(p, item.color)[0]}
                          alt={p.name}
                          kind="product"
                          accent={p.accent}
                          label={p.name}
                          className="h-24 w-20 shrink-0"
                        />
                        <div className="flex min-w-0 flex-1 flex-col">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-display text-sm tracking-wide">{p.name}</p>
                            <button
                              onClick={() => removeItem(item.productId, item.size, item.color)}
                              aria-label="Remover item"
                              className="text-white/40 hover:text-brand-pink"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          <p className="text-xs text-white/50">
                            {item.size} · {item.color}
                          </p>
                          <div className="mt-auto flex items-center justify-between">
                            <div className="flex items-center border border-white/15">
                              <button
                                onClick={() => updateQuantity(item.productId, item.size, item.color, item.qty - 1)}
                                aria-label="Diminuir"
                                className="p-1.5 hover:text-brand-pink"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <span className="w-8 text-center text-sm tabular-nums">{item.qty}</span>
                              <button
                                onClick={() => updateQuantity(item.productId, item.size, item.color, item.qty + 1)}
                                aria-label="Aumentar"
                                className="p-1.5 hover:text-brand-pink"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <span className="font-display text-sm text-brand-yellow">
                              {formatBRL(p.price * item.qty)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-white/10 px-5 py-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="font-display text-sm tracking-[0.15em] text-white/60">SUBTOTAL</span>
                    <span className="font-brush text-2xl text-brand-yellow">{formatBRL(subtotal)}</span>
                  </div>
                  <Button href="/carrinho" onClick={close} variant="pink" className="w-full justify-center">
                    CALCULAR FRETE
                  </Button>
                  <button
                    onClick={close}
                    className="mt-2 flex w-full items-center justify-center gap-2 py-2 text-xs tracking-[0.15em] text-white/50 hover:text-white"
                  >
                    <ShoppingBag className="h-4 w-4" /> CONTINUAR COMPRANDO
                  </button>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
