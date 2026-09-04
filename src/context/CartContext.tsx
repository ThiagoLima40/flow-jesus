"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { products, type Product } from "@/data/products";

export type CartItem = {
  productId: string;
  size: string;
  color: string;
  qty: number;
};

type CartCtx = {
  items: CartItem[];
  count: number;
  subtotal: number;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  addItem: (productId: string, size: string, color: string, qty?: number) => void;
  removeItem: (productId: string, size: string, color: string) => void;
  updateQuantity: (productId: string, size: string, color: string, qty: number) => void;
  clearCart: () => void;
  getProduct: (id: string) => Product | undefined;
};

const Ctx = createContext<CartCtx | null>(null);
const KEY = "flowjesus.cart.v1";

const sameLine = (a: CartItem, id: string, size: string, color: string) =>
  a.productId === id && a.size === size && a.color === color;

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const addItem = useCallback((productId: string, size: string, color: string, qty = 1) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => sameLine(i, productId, size, color));
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], qty: copy[idx].qty + qty };
        return copy;
      }
      return [...prev, { productId, size, color, qty }];
    });
    setOpen(true);
  }, []);

  const removeItem = useCallback((productId: string, size: string, color: string) => {
    setItems((prev) => prev.filter((i) => !sameLine(i, productId, size, color)));
  }, []);

  const updateQuantity = useCallback(
    (productId: string, size: string, color: string, qty: number) => {
      setItems((prev) =>
        prev
          .map((i) => (sameLine(i, productId, size, color) ? { ...i, qty: Math.max(0, qty) } : i))
          .filter((i) => i.qty > 0)
      );
    },
    []
  );

  const clearCart = useCallback(() => setItems([]), []);
  const getProduct = useCallback((id: string) => products.find((p) => p.id === id), []);

  const count = useMemo(() => items.reduce((s, i) => s + i.qty, 0), [items]);
  const subtotal = useMemo(
    () =>
      items.reduce((s, i) => {
        const p = products.find((x) => x.id === i.productId);
        return s + (p ? p.price * i.qty : 0);
      }, 0),
    [items]
  );

  const value: CartCtx = {
    items,
    count,
    subtotal,
    isOpen,
    open: () => setOpen(true),
    close: () => setOpen(false),
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getProduct,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart deve estar dentro de CartProvider");
  return c;
}
