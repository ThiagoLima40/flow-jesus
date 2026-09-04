import type { Metadata } from "next";
import { CartPage } from "@/components/shop/CartPage";

export const metadata: Metadata = {
  title: "Meu Carrinho",
  description: "Revise seus itens e finalize sua compra na FLOW JESUS.",
};

export default function CarrinhoPage() {
  return (
    <div className="bg-street min-h-screen pt-24">
      <CartPage />
    </div>
  );
}
