export type Accent = "pink" | "cyan" | "yellow" | "mono";
export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  sharedColorImages?: boolean; // Montagem original que mostra todas as cores cadastradas.
  category: "camisetas" | "moletons" | "bones" | "acessorios" | "drops";
  sizes: string[];
  colors: { name: string; hex: string }[];
  featured: boolean;
  badge?: "NOVO" | "DROP" | "ESGOTANDO" | "MAIS VENDIDO";
  stock?: number; // Ausente quando a quantidade não foi informada.
  accent: Accent;
  story: string;
  biblicalReference?: string;
};

// Fotos explícitas: preserva a ordem editorial sem depender do mapa gerado.
export const products: Product[] = [
  {
    "id": "flow-70x7",
    "slug": "70x7",
    "name": "70x7",
    "description": "Camiseta oversized FlowJesus+. Estampa 70x7 com referência a Mateus 18:22.",
    "price": 99,
    "images": [
      "/images/products/70x7/01-verso-preta.jpg",
      "/images/products/70x7/02-frente-preta.jpg",
      "/images/products/70x7/03-verso-branca.jpg",
      "/images/products/70x7/04-frente-branca.jpg"
    ],
    "category": "camisetas",
    "sizes": [
      "P",
      "M",
      "G",
      "GG"
    ],
    "colors": [
      {
        "name": "Preto",
        "hex": "#0a0a0a"
      },
      {
        "name": "Branco",
        "hex": "#f4f1ea"
      }
    ],
    "featured": true,
    "accent": "pink",
    "story": "Camiseta oversized da coleção FlowJesus+, nos tamanhos P, M, G e GG. Os números 70x7 ocupam as costas, acompanhados da referência Mateus 18:22. Uma mensagem sobre perdão em uma composição de alto contraste.",
    "biblicalReference": "Mateus 18:22"
  },
  {
    "id": "flow-a-razao-de-viver",
    "slug": "a-razao-de-viver",
    "name": "A Razão de Viver",
    "description": "Camiseta oversized FlowJesus+. Cruz nas costas com a frase “The cross is the reason I’m alive”.",
    "price": 99,
    "images": [
      "/images/products/a-razao-de-viver/01-verso-preta.jpg",
      "/images/products/a-razao-de-viver/02-frente-preta.jpg",
      "/images/products/a-razao-de-viver/03-verso-branca.jpg",
      "/images/products/a-razao-de-viver/04-frente-branca.jpg"
    ],
    "category": "camisetas",
    "sizes": [
      "P",
      "M",
      "G",
      "GG"
    ],
    "colors": [
      {
        "name": "Preto",
        "hex": "#0a0a0a"
      },
      {
        "name": "Branco",
        "hex": "#f4f1ea"
      }
    ],
    "featured": true,
    "accent": "cyan",
    "story": "Camiseta oversized da coleção FlowJesus+, nos tamanhos P, M, G e GG. Uma cruz ilustrada aparece no centro da frase “The cross is the reason I’m alive”. A arte expressa a cruz como razão de viver."
  },
  {
    "id": "flow-andamos-por-fe",
    "slug": "andamos-por-fe",
    "name": "Andamos por Fé",
    "description": "Camiseta oversized FlowJesus+. Mensagem de fé nas costas e “Flua em Cristo” no peito.",
    "price": 99,
    "images": [
      "/images/products/andamos-por-fe/01-verso-branca.jpg",
      "/images/products/andamos-por-fe/02-frente-branca.jpg",
      "/images/products/andamos-por-fe/03-verso-preta.jpg",
      "/images/products/andamos-por-fe/04-frente-preta.jpg"
    ],
    "category": "camisetas",
    "sizes": [
      "P",
      "M",
      "G",
      "GG"
    ],
    "colors": [
      {
        "name": "Branco",
        "hex": "#f4f1ea"
      },
      {
        "name": "Preto",
        "hex": "#0a0a0a"
      }
    ],
    "featured": true,
    "accent": "yellow",
    "story": "Camiseta oversized da coleção FlowJesus+, nos tamanhos P, M, G e GG. A composição vertical traz “Nós andamos por fé e não pelo que vemos”, com a referência 2 Co 5:7. O detalhe frontal reúne a marca FlowJesus+ e “Flua em Cristo”.",
    "biblicalReference": "2 Coríntios 5:7"
  },
  {
    "id": "flow-bom-perfume-de-cristo",
    "slug": "bom-perfume-de-cristo",
    "name": "Bom Perfume de Cristo",
    "description": "Camiseta oversized FlowJesus+. Estampa de perfume com uma mensagem de amor, perdão, salvação e graça.",
    "price": 99,
    "images": [
      "/images/products/bom-perfume-de-cristo/01-verso-preta.jpg",
      "/images/products/bom-perfume-de-cristo/02-frente-preta.jpg",
      "/images/products/bom-perfume-de-cristo/03-verso-branca.jpg",
      "/images/products/bom-perfume-de-cristo/04-frente-branca.jpg"
    ],
    "category": "camisetas",
    "sizes": [
      "P",
      "M",
      "G",
      "GG"
    ],
    "colors": [
      {
        "name": "Preto",
        "hex": "#0a0a0a"
      },
      {
        "name": "Branco",
        "hex": "#f4f1ea"
      }
    ],
    "featured": true,
    "accent": "pink",
    "story": "Camiseta oversized da coleção FlowJesus+, nos tamanhos P, M, G e GG. A arte combina um frasco de perfume e a frase “Somos o bom perfume de Cristo”. Vermelho e amarelo destacam as palavras amor, perdão, salvação e graça."
  },
  {
    "id": "flow-walk-by-faith",
    "slug": "walk-by-faith",
    "name": "Caminhe pela Fé",
    "description": "Camiseta oversized FlowJesus+. Óculos ilustrados com a frase “Walk by faith, not by sight”.",
    "price": 99,
    "images": [
      "/images/products/walk-by-faith/01-verso-preta.jpg",
      "/images/products/walk-by-faith/02-frente-preta.jpg",
      "/images/products/walk-by-faith/03-verso-branca.jpg",
      "/images/products/walk-by-faith/04-frente-branca.jpg"
    ],
    "category": "camisetas",
    "sizes": [
      "P",
      "M",
      "G",
      "GG"
    ],
    "colors": [
      {
        "name": "Preto",
        "hex": "#0a0a0a"
      },
      {
        "name": "Branco",
        "hex": "#f4f1ea"
      }
    ],
    "featured": true,
    "accent": "cyan",
    "story": "Camiseta oversized da coleção FlowJesus+, nos tamanhos P, M, G e GG. A estampa nas costas distribui a mensagem “Walk by faith, not by sight” entre as lentes de um par de óculos. Uma composição que convida a caminhar pela fé."
  },
  {
    "id": "flow-deus",
    "slug": "deus",
    "name": "Deus",
    "description": "Camiseta oversized FlowJesus+. Tipografia GOD em uma composição em forma de cruz.",
    "price": 99,
    "images": [
      "/images/products/deus/01-verso-branca.jpg",
      "/images/products/deus/02-frente-branca.jpg",
      "/images/products/deus/03-verso-preta.jpg",
      "/images/products/deus/04-frente-preta.jpg"
    ],
    "category": "camisetas",
    "sizes": [
      "P",
      "M",
      "G",
      "GG"
    ],
    "colors": [
      {
        "name": "Branco",
        "hex": "#f4f1ea"
      },
      {
        "name": "Preto",
        "hex": "#0a0a0a"
      }
    ],
    "featured": true,
    "accent": "yellow",
    "story": "Camiseta oversized da coleção FlowJesus+, nos tamanhos P, M, G e GG. As letras de GOD se encontram na horizontal e na vertical, formando uma cruz nas costas. A arte usa contraste entre preto e branco."
  },
  {
    "id": "flow-esse-nome-tem-poder",
    "slug": "esse-nome-tem-poder",
    "name": "Esse Nome Tem Poder",
    "description": "Camiseta oversized FlowJesus+. Emblema com “Jesus Cristo — esse nome tem poder”.",
    "price": 99,
    "images": [
      "/images/products/esse-nome-tem-poder/01-verso-branca.jpg",
      "/images/products/esse-nome-tem-poder/02-frente-branca.jpg",
      "/images/products/esse-nome-tem-poder/03-verso-preta.jpg",
      "/images/products/esse-nome-tem-poder/04-frente-preta.jpg"
    ],
    "category": "camisetas",
    "sizes": [
      "P",
      "M",
      "G",
      "GG"
    ],
    "colors": [
      {
        "name": "Branco",
        "hex": "#f4f1ea"
      },
      {
        "name": "Preto",
        "hex": "#0a0a0a"
      }
    ],
    "featured": false,
    "accent": "pink",
    "story": "Camiseta oversized da coleção FlowJesus+, nos tamanhos P, M, G e GG. Um emblema contornado em laranja destaca o nome Jesus Cristo e a mensagem “Esse nome tem poder”. A composição ocupa as costas da camiseta."
  },
  {
    "id": "flow-jesus-e-o-heroi",
    "slug": "jesus-e-o-heroi",
    "name": "Jesus é o Herói",
    "description": "Camiseta oversized FlowJesus+. Cruz vermelha e lettering “Jesus is the hero”.",
    "price": 99,
    "images": [
      "/images/products/jesus-e-o-heroi/01-verso-preta.jpg",
      "/images/products/jesus-e-o-heroi/02-frente-preta.jpg",
      "/images/products/jesus-e-o-heroi/03-verso-branca.jpg",
      "/images/products/jesus-e-o-heroi/04-frente-branca.jpg"
    ],
    "category": "camisetas",
    "sizes": [
      "P",
      "M",
      "G",
      "GG"
    ],
    "colors": [
      {
        "name": "Preto",
        "hex": "#0a0a0a"
      },
      {
        "name": "Branco",
        "hex": "#f4f1ea"
      }
    ],
    "featured": false,
    "accent": "cyan",
    "story": "Camiseta oversized da coleção FlowJesus+, nos tamanhos P, M, G e GG. A estampa combina uma cruz vermelha com a frase “Jesus is the hero” em letras com efeito de pincelada. Uma declaração de fé centrada em Jesus."
  },
  {
    "id": "flow-leao-de-juda",
    "slug": "leao-de-juda",
    "name": "Leão de Judá",
    "description": "Camiseta oversized FlowJesus+. Ilustração de leão e rosto humano com olhos em destaque.",
    "price": 99,
    "images": [
      "/images/products/leao-de-juda/01-verso-preta.jpg",
      "/images/products/leao-de-juda/02-frente-preta.jpg",
      "/images/products/leao-de-juda/03-verso-branca.jpg",
      "/images/products/leao-de-juda/04-frente-branca.jpg"
    ],
    "category": "camisetas",
    "sizes": [
      "P",
      "M",
      "G",
      "GG"
    ],
    "colors": [
      {
        "name": "Preto",
        "hex": "#0a0a0a"
      },
      {
        "name": "Branco",
        "hex": "#f4f1ea"
      }
    ],
    "featured": false,
    "accent": "yellow",
    "story": "Camiseta oversized da coleção FlowJesus+, nos tamanhos P, M, G e GG. A arte das costas une um rosto humano à figura de um leão. Traços em preto e branco e olhos destacados compõem a identidade desta estampa."
  },
  {
    "id": "flow-maranata",
    "slug": "maranata",
    "name": "Maranata",
    "description": "Camiseta oversized FlowJesus+. Estampa “Maranatha — Come Lord Jesus”.",
    "price": 99,
    "images": [
      "/images/products/maranata/01-verso-preta.jpg",
      "/images/products/maranata/02-frente-preta.jpg",
      "/images/products/maranata/03-verso-branca.jpg",
      "/images/products/maranata/04-frente-branca.jpg"
    ],
    "category": "camisetas",
    "sizes": [
      "P",
      "M",
      "G",
      "GG"
    ],
    "colors": [
      {
        "name": "Preto",
        "hex": "#0a0a0a"
      },
      {
        "name": "Branco",
        "hex": "#f4f1ea"
      }
    ],
    "featured": false,
    "accent": "pink",
    "story": "Camiseta oversized da coleção FlowJesus+, nos tamanhos P, M, G e GG. A frase “Maranatha — Come Lord Jesus” aparece nas costas em letras curvas e contrastantes. A mensagem expressa o convite “Vem, Senhor Jesus”."
  },
  {
    "id": "flow-rei-dos-reis",
    "slug": "rei-dos-reis",
    "name": "Rei dos Reis",
    "description": "Camiseta oversized FlowJesus+. Leão e rosto de Jesus em uma composição com coroa.",
    "price": 99,
    "images": [
      "/images/products/rei-dos-reis/01-verso-preta.jpg",
      "/images/products/rei-dos-reis/02-frente-preta.jpg",
      "/images/products/rei-dos-reis/03-verso-branca.jpg",
      "/images/products/rei-dos-reis/04-frente-branca.jpg"
    ],
    "category": "camisetas",
    "sizes": [
      "P",
      "M",
      "G",
      "GG"
    ],
    "colors": [
      {
        "name": "Preto",
        "hex": "#0a0a0a"
      },
      {
        "name": "Branco",
        "hex": "#f4f1ea"
      }
    ],
    "featured": false,
    "accent": "cyan",
    "story": "Camiseta oversized da coleção FlowJesus+, nos tamanhos P, M, G e GG. A composição une leão, rosto de Jesus e coroa. Na camiseta preta, a arte é colorida; na branca, aparece em traços monocromáticos."
  },
  {
    "id": "flow-true-story",
    "slug": "true-story",
    "name": "True Story",
    "description": "Camiseta oversized FlowJesus+. Cruz e coroa de espinhos na estampa “True Story”.",
    "price": 99,
    "images": [
      "/images/products/true-story/01-verso-preta.jpg",
      "/images/products/true-story/02-frente-preta.jpg",
      "/images/products/true-story/03-verso-branca.jpg",
      "/images/products/true-story/04-frente-branca.jpg"
    ],
    "category": "camisetas",
    "sizes": [
      "P",
      "M",
      "G",
      "GG"
    ],
    "colors": [
      {
        "name": "Preto",
        "hex": "#0a0a0a"
      },
      {
        "name": "Branco",
        "hex": "#f4f1ea"
      }
    ],
    "featured": false,
    "accent": "yellow",
    "story": "Camiseta oversized da coleção FlowJesus+, nos tamanhos P, M, G e GG. O lettering “True Story” envolve uma coroa de espinhos com uma cruz no centro. A composição nas costas reúne os símbolos da mensagem cristã."
  },
  {
    "id": "flow-tudo-e-possivel",
    "slug": "tudo-e-possivel",
    "name": "Tudo é Possível",
    "description": "Camiseta oversized FlowJesus+. Estampa “With God all things are possible”, com Mateus 19:26.",
    "price": 99,
    "images": [
      "/images/products/tudo-e-possivel/01-verso-branca.jpg",
      "/images/products/tudo-e-possivel/02-frente-branca.jpg"
    ],
    "category": "camisetas",
    "sizes": [
      "P",
      "M",
      "G",
      "GG"
    ],
    "colors": [
      {
        "name": "Branco",
        "hex": "#f4f1ea"
      }
    ],
    "featured": false,
    "accent": "pink",
    "story": "Camiseta oversized da coleção FlowJesus+, nos tamanhos P, M, G e GG. Letras arredondadas e elementos gráficos formam a frase “With God all things are possible”. A referência a Mateus 19:26 aparece na base da estampa. Disponível nas fotos somente em branco.",
    "biblicalReference": "Mateus 19:26"
  },
  {
    "id": "flow-jesus-e-o-caminho",
    "slug": "jesus-e-o-caminho",
    "name": "Jesus é o Caminho",
    "description": "Camiseta FlowJesus+. Estampa circular nas costas com a frase “Jesus é o caminho”, uma cruz, uma mão e um coração.",
    "price": 99,
    "images": [
      "/images/products/jesus-e-o-caminho/01-montagem-preta.jpg",
      "/images/products/jesus-e-o-caminho/02-montagem-branca.jpg"
    ],
    "category": "camisetas",
    "sizes": [
      "P",
      "M",
      "G",
      "GG"
    ],
    "colors": [
      {
        "name": "Preto",
        "hex": "#0a0a0a"
      },
      {
        "name": "Branco",
        "hex": "#f4f1ea"
      }
    ],
    "featured": false,
    "accent": "cyan",
    "story": "Estampa circular nas costas com a frase “Jesus é o caminho”, uma cruz, uma mão e um coração."
  },
  {
    "id": "flow-you-are-the-salt-of-the-earth",
    "slug": "you-are-the-salt-of-the-earth",
    "name": "You Are the Salt of the Earth",
    "description": "Camiseta FlowJesus+. Estampa nas costas em formato de saleiro com a frase “You are the salt of the earth” e a referência Mateus 5:13.",
    "price": 99,
    "images": [
      "/images/products/you-are-the-salt-of-the-earth/01-montagem-preta.jpg",
      "/images/products/you-are-the-salt-of-the-earth/02-montagem-branca.jpg"
    ],
    "category": "camisetas",
    "sizes": [
      "P",
      "M",
      "G",
      "GG"
    ],
    "colors": [
      {
        "name": "Preto",
        "hex": "#0a0a0a"
      },
      {
        "name": "Branco",
        "hex": "#f4f1ea"
      }
    ],
    "featured": false,
    "accent": "cyan",
    "story": "Estampa nas costas em formato de saleiro com a frase “You are the salt of the earth” e a referência Mateus 5:13.",
    "biblicalReference": "Mateus 5:13"
  },
  {
    "id": "flow-deus-esta-no-controle",
    "slug": "deus-esta-no-controle",
    "name": "Deus Está no Controle",
    "description": "Camiseta FlowJesus+. Estampa nas costas com a frase “Deus está no controle” e um controle de videogame ilustrado.",
    "price": 99,
    "images": [
      "/images/products/deus-esta-no-controle/01-montagem-preta.jpg",
      "/images/products/deus-esta-no-controle/02-montagem-branca.jpg"
    ],
    "category": "camisetas",
    "sizes": [
      "P",
      "M",
      "G",
      "GG"
    ],
    "colors": [
      {
        "name": "Preto",
        "hex": "#0a0a0a"
      },
      {
        "name": "Branco",
        "hex": "#f4f1ea"
      }
    ],
    "featured": false,
    "accent": "cyan",
    "story": "Estampa nas costas com a frase “Deus está no controle” e um controle de videogame ilustrado."
  },
  {
    "id": "flow-jesus-is-my-king",
    "slug": "jesus-is-my-king",
    "name": "Jesus Is My King",
    "description": "Camiseta FlowJesus+. Estampa nas costas com a frase “Jesus is my King” em vermelho, amarelo e azul.",
    "price": 99,
    "images": [
      "/images/products/jesus-is-my-king/01-montagem-preta-e-branca.jpg"
    ],
    "category": "camisetas",
    "sizes": [
      "P",
      "M",
      "G",
      "GG"
    ],
    "colors": [
      {
        "name": "Preto",
        "hex": "#0a0a0a"
      },
      {
        "name": "Branco",
        "hex": "#f4f1ea"
      }
    ],
    "featured": false,
    "accent": "cyan",
    "story": "Estampa nas costas com a frase “Jesus is my King” em vermelho, amarelo e azul.",
    "sharedColorImages": true
  },
  {
    "id": "flow-ele-nos-amou-primeiro",
    "slug": "ele-nos-amou-primeiro",
    "name": "Ele Nos Amou Primeiro",
    "description": "Camiseta FlowJesus+. Cruz com rosas vermelhas e a mensagem “Nós amamos porque Ele nos amou primeiro” nas costas.",
    "price": 99,
    "images": [
      "/images/products/ele-nos-amou-primeiro/01-montagem-preta.jpg",
      "/images/products/ele-nos-amou-primeiro/02-montagem-branca.jpg"
    ],
    "category": "camisetas",
    "sizes": [
      "P",
      "M",
      "G",
      "GG"
    ],
    "colors": [
      {
        "name": "Preto",
        "hex": "#0a0a0a"
      },
      {
        "name": "Branco",
        "hex": "#f4f1ea"
      }
    ],
    "featured": false,
    "accent": "pink",
    "story": "Cruz com rosas vermelhas e a mensagem “Nós amamos porque Ele nos amou primeiro” nas costas.",
    "biblicalReference": "1 João 4:19"
  },
  {
    "id": "flow-tudo-posso-naquele-que-me-fortalece",
    "slug": "tudo-posso-naquele-que-me-fortalece",
    "name": "Tudo Posso Naquele Que Me Fortalece",
    "description": "Camiseta FlowJesus+. Ilustração de Jesus acolhendo um jovem nas costas, com referência a Filipenses 4:13 na foto do produto.",
    "price": 99,
    "images": [
      "/images/products/tudo-posso-naquele-que-me-fortalece/01-montagem-preta.jpg",
      "/images/products/tudo-posso-naquele-que-me-fortalece/02-montagem-branca.jpg"
    ],
    "category": "camisetas",
    "sizes": [
      "P",
      "M",
      "G",
      "GG"
    ],
    "colors": [
      {
        "name": "Preto",
        "hex": "#0a0a0a"
      },
      {
        "name": "Branco",
        "hex": "#f4f1ea"
      }
    ],
    "featured": false,
    "accent": "yellow",
    "story": "Ilustração de Jesus acolhendo um jovem nas costas, com referência a Filipenses 4:13 na foto do produto.",
    "biblicalReference": "Filipenses 4:13"
  }
];

export function getProductImages(product: Product, color: string) {
  if (!product.colors.some((entry) => entry.name === color)) return [];
  if (product.sharedColorImages) return product.images;
  const suffix = color === "Preto" ? "-preta.jpg" : color === "Branco" ? "-branca.jpg" : "";
  return suffix ? product.images.filter((src) => src.endsWith(suffix)) : [];
}

export const categories = [
  { key: "todos", label: "TODOS" },
  { key: "camisetas", label: "CAMISETAS" },
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
