import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { products, getProduct, relatedProducts } from "@/data/products";
import { ProductDetail } from "@/components/shop/ProductDetail";
import { ProductCard } from "@/components/shop/ProductCard";
import { GraffitiTitle } from "@/components/ui/GraffitiTitle";

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const p = getProduct(params.slug);
  if (!p) return { title: "Produto não encontrado" };
  return {
    title: p.name,
    description: p.description,
    openGraph: { title: `${p.name} · FLOW JESUS`, description: p.description },
  };
}

export default function ProdutoPage({ params }: { params: { slug: string } }) {
  const product = getProduct(params.slug);
  if (!product) notFound();
  const related = relatedProducts(params.slug, 4);

  return (
    <>
      <ProductDetail product={product} />
      <section className="bg-ink py-16">
        <div className="mx-auto max-w-container px-4 md:px-8">
          <GraffitiTitle as="h2" size="md" underline="cyan" crown={false} className="mb-10">
            <span className="text-white">VOCÊ TAMBÉM PODE </span>
            <span className="text-brand-pink">CURTIR</span>
          </GraffitiTitle>
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
            {related.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
