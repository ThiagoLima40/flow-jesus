// Varre public/images/products/ e gera src/data/productImages.generated.ts
// com um mapa { "<slug>": ["/images/products/.../foto.jpg", ...] }.
//
// Como o Thiago usa (sem editar código):
//   1. Crie uma pasta com o "slug" do produto dentro de public/images/products/
//      Ex.: public/images/products/reino/
//   2. Solte as fotos dentro dela (a 1ª é a frente, a 2ª o verso no hover).
//   Alternativa sem pasta: arquivos soltos com o slug no nome, ex.:
//      public/images/products/reino.jpg  e  public/images/products/reino-2.jpg
//
// Este script roda sozinho antes de `npm run dev` e `npm run build`.

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const PRODUCTS_DIR = path.join(ROOT, "public", "images", "products");
const OUT_FILE = path.join(ROOT, "src", "data", "productImages.generated.ts");

const VALID_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif"]);
const isImage = (f) => VALID_EXT.has(path.extname(f).toLowerCase());
const sortNat = (a, b) => a.localeCompare(b, "pt-BR", { numeric: true });

function build() {
  const map = {};
  let entries;
  try {
    entries = fs.readdirSync(PRODUCTS_DIR, { withFileTypes: true });
  } catch {
    return map; // pasta ainda não existe -> mapa vazio
  }

  // 1) subpastas: products/<slug>/*.jpg
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const slug = entry.name;
    const dir = path.join(PRODUCTS_DIR, slug);
    const files = fs
      .readdirSync(dir)
      .filter(isImage)
      .sort(sortNat)
      .map((f) => `/images/products/${slug}/${f}`);
    if (files.length) map[slug] = files;
  }

  // 2) arquivos soltos: products/<slug>.jpg  ou  products/<slug>-2.jpg
  const loose = entries
    .filter((e) => e.isFile() && isImage(e.name))
    .map((e) => e.name)
    .sort(sortNat);
  for (const file of loose) {
    const base = path.basename(file, path.extname(file));
    const slug = base.replace(/-\d+$/, ""); // "reino-2" -> "reino"
    if (map[slug]?.some((p) => p.includes("/"))) {
      // já veio de subpasta; a subpasta tem prioridade -> ignora solto
      if (map[slug][0].includes(`/${slug}/`)) continue;
    }
    (map[slug] ??= []).push(`/images/products/${file}`);
  }

  return map;
}

const map = build();
const count = Object.values(map).reduce((n, arr) => n + arr.length, 0);

const banner = `// ARQUIVO GERADO AUTOMATICAMENTE — não edite à mão.
// Gerado por scripts/generate-product-images.mjs a partir de public/images/products/.
// Para adicionar fotos de produto, solte os arquivos na pasta e rode o site de novo.

export const productImagesBySlug: Record<string, string[]> = ${JSON.stringify(map, null, 2)};
`;

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.writeFileSync(OUT_FILE, banner);
console.log(`[product-images] ${Object.keys(map).length} produto(s), ${count} imagem(ns) mapeadas.`);
