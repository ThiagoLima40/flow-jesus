# FLOW JESUS

Streetwear cristão · **Vista a fé. Viva o propósito.**
Marca e movimento de Isaque Lima — fé, jiu-jítsu, música, lifestyle e propósito.

Site construído com Next.js (App Router) + TypeScript + Tailwind + Framer Motion.

## Rodando

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # build de produção
npm run lint
npm run typecheck
```

## Rotas

`/` · `/colecao` · `/produto/[slug]` · `/historia` · `/flow-play` · `/flow-bjj`
`/galeria` · `/sobre` · `/contato` · `/carrinho` · `/checkout` · 404 personalizada

## Arquitetura

```
src/
  app/            # rotas (App Router), layout, sitemap, robots, not-found
  components/
    layout/       # Header, Footer, MobileMenu
    ui/           # Button, Badge, GraffitiTitle, Graphics (SVG da marca), StreetImage…
    home/         # seções da HOME
    shop/         # ProductCard, CollectionBrowser, ProductDetail, Cart/Checkout
    story/        # StoryTimeline, AchievementCard
    music/        # AudioPlayer, MiniPlayer (player global persistente)
    bjj/          # BjjClient (vídeos + modal)
    gallery/      # GalleryClient (masonry + lightbox)
    contact/      # ContactClient (form + FAQ)
  context/        # CartContext (localStorage) · PlayerContext (player global)
  data/           # products, tracks, videos, gallery, achievements, testimonials, navigation, site
public/images/    # ver images/README.md — como trocar placeholders por fotos reais
```

## Design system

- Fundo `#050505`, destaques **amarelo** `#FFC400`, **pink** `#FF006E`, **ciano** `#00D9FF`.
- Tipografia: brush (títulos) + Anton (labels) + Inter (texto).
- Sistema gráfico próprio em SVG: coroas, cruzes, smiley-cross, mão da paz, leão,
  pinceladas, spray e texturas de ruído — em `components/ui/Graphics.tsx` e `globals.css`.
- Tokens em `tailwind.config.ts` + `globals.css`.

## Pronto para o futuro

Dados isolados em `src/data/*` e contextos desacoplados — plugar CMS, API de
estoque, gateway de pagamento e pedidos exige apenas trocar a fonte de dados.
O checkout **não processa pagamento real** nem armazena dados de cartão (estrutura
preparada para integração).

## Substituir imagens

Preencha os caminhos nos arquivos de `src/data/*` — o placeholder some sozinho.
Detalhes em `public/images/README.md`.
