import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import { CollectionBrowser } from "@/components/shop/CollectionBrowser";
export const metadata: Metadata = {
  title: "Loja FlowJesus+",
  description: "Conheça as estampas FlowJesus+. Camisetas oversized por R$ 99,00, nos tamanhos P, M, G e GG.",
};
export default function LojaPage() {
  return <>
    <PageHero eyebrow="STREETWEAR COM PROPÓSITO" title={<><span className="text-white">COLEÇÃO </span><span className="text-brand-yellow">FLOWJESUS+</span></>} subtitle="Camisetas oversized · R$ 99,00 · P, M, G e GG" />
    <CollectionBrowser />
  </>;
}
