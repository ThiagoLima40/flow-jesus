import { Hero } from "@/components/home/Hero";
import { Marquee } from "@/components/ui/Marquee";
import { BrandValues } from "@/components/home/BrandValues";
import { FeaturedCollection } from "@/components/home/FeaturedCollection";
import { StoryPreview } from "@/components/home/StoryPreview";
import { BjjPreview } from "@/components/home/BjjPreview";
import { Movement } from "@/components/home/Movement";
import { FinalCta } from "@/components/home/FinalCta";
import { FlowPlaySpotify } from "@/components/home/FlowPlaySpotify";

// Reativar somente após substituir os depoimentos provisórios por relatos reais.
const showMovementTestimonials = false;

export default function HomePage() {
  return (
    <>
      <Hero />
      <Marquee items={["FÉ", "DISCIPLINA", "LUTA", "VITÓRIA", "PROPÓSITO"]} className="bg-ink" />
      <BrandValues />
      <FeaturedCollection />
      <StoryPreview />
      <BjjPreview />
      {showMovementTestimonials && <Movement />}
      <FinalCta />
      <FlowPlaySpotify />
    </>
  );
}
