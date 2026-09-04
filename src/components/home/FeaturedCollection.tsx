import { products } from "@/data/products";
import { ProductCard } from "@/components/shop/ProductCard";
import { GraffitiTitle } from "@/components/ui/GraffitiTitle";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";

export function FeaturedCollection() {
  const featured = products.filter((p) => p.featured).slice(0, 6);
  return (
    <section className="relative bg-street py-20">
      <div className="mx-auto max-w-container px-4 md:px-8">
        <div className="mb-12 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <GraffitiTitle as="h2" size="lg" underline="pink">
              <span className="text-white">COLE</span>
              <span className="text-brand-yellow">ÇÃO</span>
            </GraffitiTitle>
            <p className="mt-4 max-w-md text-white/60">Peças que falam sobre quem você é.</p>
          </div>
          <Button href="/colecao" variant="outline" className="shrink-0">
            VER TODA A COLEÇÃO
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3">
          {featured.map((p, i) => (
            <Reveal key={p.id} delay={(i % 3) * 0.08}>
              <ProductCard product={p} index={i} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
