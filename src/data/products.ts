export type Accent = "pink" | "cyan" | "yellow" | "mono";

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  images: string[]; // vazio => placeholder premium
  category: "camisetas" | "moletons" | "bones" | "acessorios" | "drops";
  sizes: string[];
  colors: { name: string; hex: string }[];
  featured: boolean;
  badge?: "NOVO" | "DROP" | "ESGOTANDO" | "MAIS VENDIDO";
  stock: number;
  accent: Accent;
  story: string;
};

const SIZES = ["P", "M", "G", "GG", "XG"];
const COLORS = [
  { name: "Preto", hex: "#0a0a0a" },
  { name: "Branco", hex: "#f4f1ea" },
];

import { productImagesBySlug } from "./productImages.generated";

// Lista base (metadados). As fotos vêm da pasta public/images/products/<slug>/
// via mesclagem automática logo abaixo — não é preciso preencher `images` aqui.
const baseProducts: Product[] = [
  {
    id: "p1",
    slug: "graca-que-salva",
    name: "Graça que Salva",
    description:
      "Oversized com estampa full-print inspirada na graça que alcança e transforma. Algodão premium 220g.",
    price: 169.9,
    images: [],
    category: "drops",
    sizes: SIZES,
    colors: COLORS,
    featured: true,
    badge: "DROP",
    stock: 24,
    accent: "yellow",
    story:
      "A arte celebra Efésios 2:8 — pela graça sois salvos. Cada traço lembra que não há mérito próprio: tudo é dom de Deus.",
  },
  {
    id: "p2",
    slug: "reino",
    name: "Reino",
    description:
      "Camiseta branca com estampa central do Leão de Judá. Uma declaração de quem pertence ao Reino.",
    price: 159.9,
    images: [],
    category: "camisetas",
    sizes: SIZES,
    colors: COLORS,
    featured: true,
    badge: "MAIS VENDIDO",
    stock: 40,
    accent: "yellow",
    story:
      "O Leão de Judá (Apocalipse 5:5) representa a realeza de Cristo. Buscai primeiro o Reino — e o resto é acréscimo.",
  },
  {
    id: "p3",
    slug: "essencial",
    name: "Essencial",
    description: "O básico que não é básico. Preto absoluto, etiqueta bordada FLOW JESUS.",
    price: 129.9,
    images: [],
    category: "camisetas",
    sizes: SIZES,
    colors: COLORS,
    featured: true,
    badge: "NOVO",
    stock: 60,
    accent: "cyan",
    story: "Menos é mais. A fé essencial é aquela vivida todos os dias, no silêncio da disciplina.",
  },
  {
    id: "p4",
    slug: "fe-que-move",
    name: "Fé que Move",
    description: "Boné trucker com bordado NOW e coroa. Aba curva, ajuste snapback.",
    price: 89.9,
    images: [],
    category: "bones",
    sizes: ["Único"],
    colors: [{ name: "Preto", hex: "#0a0a0a" }],
    featured: true,
    badge: "NOVO",
    stock: 35,
    accent: "yellow",
    story: "A fé sem obras é morta (Tiago 2:17). Fé que move é fé que age — hoje, agora.",
  },
  {
    id: "p5",
    slug: "nada-alem-da-graca",
    name: "Nada Além da Graça",
    description:
      "Full-print branca com colagem de graffiti, versículos e coroa. A peça-manifesto da marca.",
    price: 129.9,
    images: [],
    category: "drops",
    sizes: SIZES,
    colors: [{ name: "Branco", hex: "#f4f1ea" }],
    featured: true,
    badge: "DROP",
    stock: 18,
    accent: "pink",
    story: "Romanos 8:31 — se Deus é por nós, quem será contra nós? Nada além da graça. Tudo para a glória.",
  },
  {
    id: "p6",
    slug: "ele-vive",
    name: "Ele Vive",
    description: "Camiseta preta com lettering brush ELE VIVE em amarelo e respingos de spray.",
    price: 139.9,
    images: [],
    category: "camisetas",
    sizes: SIZES,
    colors: COLORS,
    featured: true,
    badge: undefined,
    stock: 50,
    accent: "yellow",
    story: "A ressurreição é o centro de tudo. Ele vive — e porque Ele vive, podemos viver o amanhã.",
  },
  {
    id: "p7",
    slug: "basic-flow",
    name: "Basic Flow",
    description: "Camiseta regular fit com wordmark FLOW JESUS discreto no peito. Preto e branco.",
    price: 119.9,
    images: [],
    category: "camisetas",
    sizes: SIZES,
    colors: COLORS,
    featured: false,
    stock: 70,
    accent: "cyan",
    story: "O flow começa no básico — na constância silenciosa de quem confia no processo de Deus.",
  },
  {
    id: "p8",
    slug: "moletom-cristo-no-centro",
    name: "Cristo no Centro",
    description: "Moletom oversized com capuz, estampa nas costas CRISTO NO CENTRO. Felpado premium.",
    price: 249.9,
    images: [],
    category: "moletons",
    sizes: SIZES,
    colors: COLORS,
    featured: false,
    badge: "MAIS VENDIDO",
    stock: 22,
    accent: "cyan",
    story: "Quando Cristo está no centro, todo o resto encontra o seu lugar. Colossenses 1:17.",
  },
  {
    id: "p9",
    slug: "moletom-propósito",
    name: "Propósito",
    description: "Moletom crewneck com bordado PROPÓSITO no peito e coroa na manga.",
    price: 229.9,
    images: [],
    category: "moletons",
    sizes: SIZES,
    colors: COLORS,
    featured: false,
    badge: "NOVO",
    stock: 28,
    accent: "yellow",
    story: "Antes das medalhas, existe um propósito. Cada dia é uma chance de vivê-lo.",
  },
  {
    id: "p10",
    slug: "gorro-reino",
    name: "Gorro Reino",
    description: "Gorro canelado com etiqueta bordada. Para os dias frios de treino.",
    price: 79.9,
    images: [],
    category: "acessorios",
    sizes: ["Único"],
    colors: [{ name: "Preto", hex: "#0a0a0a" }],
    featured: false,
    stock: 45,
    accent: "pink",
    story: "Detalhe que fecha o look. O Reino nos detalhes, o propósito na jornada.",
  },
  {
    id: "p11",
    slug: "ecobag-flow",
    name: "Ecobag Flow",
    description: "Bolsa de algodão cru com serigrafia FLOW JESUS. Leve a fé para todo lugar.",
    price: 59.9,
    images: [],
    category: "acessorios",
    sizes: ["Único"],
    colors: [{ name: "Cru", hex: "#d8d2c4" }],
    featured: false,
    stock: 80,
    accent: "cyan",
    story: "Pequenos gestos carregam grandes mensagens. Vista — e leve — aquilo em que você acredita.",
  },
  {
    id: "p12",
    slug: "camiseta-joao-316",
    name: "João 3:16",
    description: "Camiseta preta com sticker João 3:16 e cruz brush. Clássico atemporal.",
    price: 134.9,
    images: [],
    category: "camisetas",
    sizes: SIZES,
    colors: COLORS,
    featured: false,
    badge: "ESGOTANDO",
    stock: 6,
    accent: "pink",
    story: "Porque Deus amou o mundo de tal maneira... o versículo que resume o evangelho inteiro.",
  },
];

// Mescla as fotos encontradas na pasta. Se houver imagens em
// public/images/products/<slug>/, elas entram; senão mantém o placeholder.
export const products: Product[] = baseProducts.map((p) => {
  const fromFolder = productImagesBySlug[p.slug];
  return fromFolder && fromFolder.length ? { ...p, images: fromFolder } : p;
});

export const categories = [
  { key: "todos", label: "TODOS" },
  { key: "camisetas", label: "CAMISETAS" },
  { key: "moletons", label: "MOLETONS" },
  { key: "bones", label: "BONÉS" },
  { key: "acessorios", label: "ACESSÓRIOS" },
  { key: "drops", label: "DROPS" },
] as const;

export function getProduct(slug: string) {
  return products.find((p) => p.slug === slug);
}

export function relatedProducts(slug: string, n = 4) {
  const p = getProduct(slug);
  return products.filter((x) => x.slug !== slug && (!p || x.category === p.category)).slice(0, n);
}

export function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
