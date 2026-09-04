export type GalleryItem = {
  id: string;
  alt: string;
  category: "treinos" | "competicoes" | "viagens" | "familia" | "flowjesus";
  accent: "pink" | "cyan" | "yellow" | "mono";
  span: "tall" | "wide" | "square"; // proporções para masonry
  src?: string;
};

export const galleryCategories = [
  { key: "todos", label: "TODOS" },
  { key: "treinos", label: "TREINOS" },
  { key: "competicoes", label: "COMPETIÇÕES" },
  { key: "viagens", label: "VIAGENS" },
  { key: "familia", label: "FAMÍLIA" },
  { key: "flowjesus", label: "FLOW JESUS" },
] as const;

const spans: GalleryItem["span"][] = ["tall", "square", "wide", "square", "tall", "wide"];
const accents: GalleryItem["accent"][] = ["pink", "cyan", "yellow", "mono"];
const cats: GalleryItem["category"][] = ["treinos", "competicoes", "viagens", "familia", "flowjesus"];

export const gallery: GalleryItem[] = Array.from({ length: 18 }, (_, i) => ({
  id: `g${i + 1}`,
  alt: `Momento FLOW JESUS ${i + 1}`,
  category: cats[i % cats.length],
  accent: accents[i % accents.length],
  span: spans[i % spans.length],
}));
