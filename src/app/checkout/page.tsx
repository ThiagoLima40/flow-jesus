import type { Metadata } from "next";
import { CheckoutClient } from "@/components/shop/CheckoutClient";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Finalize sua compra na FLOW JESUS com segurança.",
};

export default function CheckoutPage() {
  return (
    <div className="bg-street min-h-screen pt-24">
      <CheckoutClient />
    </div>
  );
}
