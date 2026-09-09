import type { MetadataRoute } from "next";
import { products } from "@/data/products";
import { site } from "@/data/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = site.url;
  const routes = ["", "/loja", "/colecao", "/historia", "/flow-play", "/flow-bjj", "/galeria", "/sobre", "/contato", "/carrinho"].map(
    (r) => ({
      url: `${base}${r}`,
      changeFrequency: "weekly" as const,
      priority: r === "" ? 1 : 0.7,
    })
  );
  const productRoutes = products.map((p) => ({
    url: `${base}/produto/${p.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));
  return [...routes, ...productRoutes];
}
