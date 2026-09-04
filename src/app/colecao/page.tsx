import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import { CollectionBrowser } from "@/components/shop/CollectionBrowser";

export const metadata: Metadata = {
  title: "Coleção",
  description: "Coleção FLOW JESUS — camisetas, moletons, bonés e drops. Vista sua fé. Viva seu propósito.",
};

export default function ColecaoPage() {
  return (
    <>
      <PageHero
        eyebrow="STREETWEAR CRISTÃO"
        title={
          <>
            <span className="text-white">COLEÇÃO</span>{" "}
            <span className="text-brand-yellow">FLOW JESUS</span>
          </>
        }
        subtitle="Vista sua fé. Viva seu propósito. Peças que falam sobre quem você é."
      />
      <CollectionBrowser />
    </>
  );
}
