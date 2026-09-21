export type GalleryItem = {
  id: string;
  alt: string;
  category: "treinos" | "competicoes" | "viagens" | "familia" | "flowjesus";
  accent: "pink" | "cyan" | "yellow" | "mono";
  span: "tall" | "wide" | "square"; // proporções para masonry
  src: string;
  objectPosition?: string;
};

export const galleryCategories = [
  { key: "todos", label: "TODOS" },
  { key: "treinos", label: "TREINOS" },
  { key: "competicoes", label: "COMPETIÇÕES" },
  { key: "viagens", label: "VIAGENS" },
  { key: "familia", label: "FAMÍLIA" },
  { key: "flowjesus", label: "FLOW JESUS" },
] as const;

export const gallery: GalleryItem[] = [
  {
    "id": "g1",
    "alt": "Isaque de kimono com medalhas no International Open",
    "category": "competicoes",
    "accent": "pink",
    "span": "tall",
    "src": "/images/gallery/competicoes-open-medalhas.jpg",
    "objectPosition": "50% 35%"
  },
  {
    "id": "g2",
    "alt": "Isaque em viagem na Times Square",
    "category": "viagens",
    "accent": "cyan",
    "span": "tall",
    "src": "/images/flow-bjj/viagens.jpg",
    "objectPosition": "50% 40%"
  },
  {
    "id": "g3",
    "alt": "Isaque com camiseta e mensagem da FlowJesus",
    "category": "flowjesus",
    "accent": "yellow",
    "span": "tall",
    "src": "/images/gallery/flowjesus-camiseta.jpg",
    "objectPosition": "50% 30%"
  },
  {
    "id": "g4",
    "alt": "Isaque concentrado durante a preparação no tatame",
    "category": "treinos",
    "accent": "mono",
    "span": "wide",
    "src": "/images/flow-bjj/bastidores.jpg",
    "objectPosition": "50% 40%"
  },
  {
    "id": "g5",
    "alt": "Isaque ainda criança com o pai e a mãe na academia",
    "category": "familia",
    "accent": "pink",
    "span": "wide",
    "src": "/images/historia/comeco-familia.jpg",
    "objectPosition": "50% 30%"
  },
  {
    "id": "g6",
    "alt": "Isaque no pódio do ADCC Latin America",
    "category": "competicoes",
    "accent": "cyan",
    "span": "tall",
    "src": "/images/gallery/competicoes-podio-adcc.jpg",
    "objectPosition": "50% 35%"
  },
  {
    "id": "g7",
    "alt": "Isaque alongando no tatame antes do treino",
    "category": "treinos",
    "accent": "yellow",
    "span": "tall",
    "src": "/images/gallery/treinos-alongamento.jpg",
    "objectPosition": "50% 40%"
  },
  {
    "id": "g8",
    "alt": "Isaque acompanhado em passeio noturno durante viagem",
    "category": "viagens",
    "accent": "mono",
    "span": "square",
    "src": "/images/gallery/viagens-passeio-grupo.jpg",
    "objectPosition": "50% 35%"
  },
  {
    "id": "g9",
    "alt": "Isaque mostrando de perto uma medalha de competição",
    "category": "competicoes",
    "accent": "pink",
    "span": "tall",
    "src": "/images/gallery/competicoes-detalhe-medalha.jpg",
    "objectPosition": "50% 40%"
  },
  {
    "id": "g10",
    "alt": "Isaque e o pai de kimono na academia",
    "category": "familia",
    "accent": "cyan",
    "span": "tall",
    "src": "/images/historia/familia-pai.jpg",
    "objectPosition": "50% 25%"
  },
  {
    "id": "g11",
    "alt": "Isaque em ação durante uma luta de jiu-jítsu",
    "category": "competicoes",
    "accent": "yellow",
    "span": "wide",
    "src": "/images/gallery/competicoes-luta-ibjjf.jpg",
    "objectPosition": "50% 55%"
  },
  {
    "id": "g12",
    "alt": "Isaque de camiseta verde durante a preparação na academia",
    "category": "treinos",
    "accent": "mono",
    "span": "tall",
    "src": "/images/gallery/treinos-preparacao-camiseta.jpg",
    "objectPosition": "50% 30%"
  },
  {
    "id": "g13",
    "alt": "Arte FlowJesus com o nome Isaque Lima e símbolos da marca",
    "category": "flowjesus",
    "accent": "pink",
    "span": "square",
    "src": "/images/gallery/flowjesus-identidade.jpg",
    "objectPosition": "50% 50%"
  },
  {
    "id": "g14",
    "alt": "Isaque no pódio do International Open de jiu-jítsu",
    "category": "competicoes",
    "accent": "cyan",
    "span": "tall",
    "src": "/images/gallery/competicoes-podio-open.jpg",
    "objectPosition": "50% 40%"
  },
  {
    "id": "g15",
    "alt": "Isaque praticando uma técnica com parceiro de treino",
    "category": "treinos",
    "accent": "yellow",
    "span": "tall",
    "src": "/images/flow-bjj/treinos.jpg",
    "objectPosition": "50% 35%"
  },
  {
    "id": "g16",
    "alt": "Isaque com o pai e medalhas após competição",
    "category": "familia",
    "accent": "mono",
    "span": "tall",
    "src": "/images/gallery/familia-apoio-pai.jpg",
    "objectPosition": "50% 20%"
  },
  {
    "id": "g17",
    "alt": "Isaque de kimono com o braço erguido no campeonato",
    "category": "competicoes",
    "accent": "pink",
    "span": "tall",
    "src": "/images/gallery/competicoes-braco-erguido.jpg",
    "objectPosition": "50% 25%"
  },
  {
    "id": "g18",
    "alt": "Isaque de kimono branco em momento de concentração",
    "category": "treinos",
    "accent": "cyan",
    "span": "tall",
    "src": "/images/gallery/treinos-concentracao-kimono.jpg",
    "objectPosition": "50% 25%"
  },
  {
    "id": "g19",
    "alt": "Isaque com medalhas e cinturões diante da bandeira do Brasil",
    "category": "competicoes",
    "accent": "yellow",
    "span": "tall",
    "src": "/images/gallery/competicoes-bandeira-brasil.jpg",
    "objectPosition": "50% 30%"
  },
  {
    "id": "g20",
    "alt": "Isaque durante a preparação física na academia",
    "category": "treinos",
    "accent": "mono",
    "span": "tall",
    "src": "/images/gallery/treinos-preparacao-fisica.jpg",
    "objectPosition": "50% 30%"
  },
  {
    "id": "g21",
    "alt": "Isaque de kimono exibindo medalhas de jiu-jítsu",
    "category": "competicoes",
    "accent": "pink",
    "span": "tall",
    "src": "/images/gallery/competicoes-medalhas-jiu-jitsu.jpg",
    "objectPosition": "50% 25%"
  },
  {
    "id": "g22",
    "alt": "Isaque ainda criança de kimono no tatame",
    "category": "treinos",
    "accent": "cyan",
    "span": "tall",
    "src": "/images/historia/treino-kimono.jpg",
    "objectPosition": "50% 25%"
  },
  {
    "id": "g23",
    "alt": "Coleção de medalhas e cinturões conquistados por Isaque",
    "category": "competicoes",
    "accent": "yellow",
    "span": "tall",
    "src": "/images/gallery/competicoes-colecao-conquistas.jpg",
    "objectPosition": "50% 50%"
  },
  {
    "id": "g24",
    "alt": "Isaque exibindo uma medalha dourada após campeonato",
    "category": "competicoes",
    "accent": "mono",
    "span": "tall",
    "src": "/images/gallery/competicoes-medalha-dourada.jpg",
    "objectPosition": "50% 35%"
  }
];
