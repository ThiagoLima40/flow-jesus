import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import { GalleryClient } from "@/components/gallery/GalleryClient";
import { gallery } from "@/data/gallery";
import { getGalleryFromFolder } from "@/data/galleryFolder";

export const metadata: Metadata = {
  title: "Galeria",
  description: "Momentos que marcam a jornada. Treinos, competições, viagens, família e movimento FLOW JESUS.",
};

// Relê a pasta a cada requisição — soltar uma foto em public/images/gallery/
// já aparece no site (sem editar código).
export const dynamic = "force-dynamic";

export default function GaleriaPage() {
  // Usa as fotos reais da pasta; se estiver vazia, cai nos placeholders.
  const items = getGalleryFromFolder() ?? gallery;
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
      <GalleryClient items={items} />
    </>
  );
}
