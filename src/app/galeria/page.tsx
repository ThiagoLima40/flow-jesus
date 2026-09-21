import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import { GalleryClient } from "@/components/gallery/GalleryClient";
import { gallery } from "@/data/gallery";

export const metadata: Metadata = {
  title: "Galeria",
  description: "Momentos que marcam a jornada. Treinos, competições, viagens, família e movimento FLOW JESUS.",
};

export default function GaleriaPage() {
  return (
    <>
      <PageHero
        eyebrow="GALERIA"
        title={
          <>
            <span className="text-white">MOMENTOS QUE MARCAM</span>{" "}
            <span className="text-brand-yellow">A JORNADA.</span>
          </>
        }
        subtitle="Cada imagem é um pedaço da história. Treino, luta, fé e família."
      />
      <GalleryClient items={gallery} />
    </>
  );
}
