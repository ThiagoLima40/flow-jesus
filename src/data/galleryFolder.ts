import fs from "node:fs";
import path from "node:path";
import type { GalleryItem } from "./gallery";

/**
 * Lê automaticamente as fotos de `public/images/gallery/` e monta a galeria.
 * Basta soltar os arquivos na pasta — nenhum código precisa ser editado.
 *
 * Convenção de nome do arquivo (opcional) define a categoria:
 *   treinos-praia.jpg        -> categoria "treinos"
 *   competicoes-final_01.jpg -> categoria "competicoes"
 *   viagens-sp.webp          -> categoria "viagens"
 *   familia-natal.jpg        -> categoria "familia"
 *   qualquer-outro-nome.jpg  -> categoria "flowjesus" (padrão)
 *
 * O prefixo é o texto antes do primeiro "-" ou "_". Sem prefixo válido,
 * a foto entra em "FLOW JESUS".
 */

const GALLERY_DIR = path.join(process.cwd(), "public", "images", "gallery");
const VALID_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif"]);

const validCategories = new Set<GalleryItem["category"]>([
  "treinos",
  "competicoes",
  "viagens",
  "familia",
  "flowjesus",
]);

const spans: GalleryItem["span"][] = ["tall", "square", "wide", "square", "tall", "wide"];
const accents: GalleryItem["accent"][] = ["pink", "cyan", "yellow", "mono"];

const categoryLabel: Record<GalleryItem["category"], string> = {
  treinos: "Treino",
  competicoes: "Competição",
  viagens: "Viagem",
  familia: "Família",
  flowjesus: "FLOW JESUS",
};

function detectCategory(fileName: string): GalleryItem["category"] {
  const prefix = fileName.toLowerCase().split(/[-_]/)[0];
  return validCategories.has(prefix as GalleryItem["category"])
    ? (prefix as GalleryItem["category"])
    : "flowjesus";
}

/**
 * Retorna as fotos reais da pasta, ou `null` se a pasta não existe / está vazia
 * (nesse caso o site usa os placeholders premium de `gallery.ts`).
 */
export function getGalleryFromFolder(): GalleryItem[] | null {
  let files: string[];
  try {
    files = fs.readdirSync(GALLERY_DIR);
  } catch {
    return null;
  }

  const photos = files
    .filter((f) => VALID_EXT.has(path.extname(f).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, "pt-BR", { numeric: true }));

  if (photos.length === 0) return null;

  return photos.map((file, i) => {
    const category = detectCategory(file);
    return {
      id: `folder-${i}-${file}`,
      alt: `${categoryLabel[category]} — FLOW JESUS`,
      category,
      accent: accents[i % accents.length],
      span: spans[i % spans.length],
      src: `/images/gallery/${file}`,
    };
  });
}
