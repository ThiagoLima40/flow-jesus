"use client";

import { ReactNode } from "react";
import { CartProvider } from "@/context/CartContext";
import { PlayerProvider } from "@/context/PlayerContext";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      <PlayerProvider>{children}</PlayerProvider>
    </CartProvider>
  );
}
