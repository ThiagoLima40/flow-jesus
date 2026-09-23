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

## Checkout e pedidos

O checkout usa Mercado Pago e cotação pelo Melhor Envio. A estrutura de pedidos
registra contato, endereço, itens e valores no D1 antes de iniciar o pagamento,
mantendo a Vercel como frontend/API e o Worker como responsável pela persistência.
A ativação depende da nova migração e da publicação coordenada do Worker e da Vercel;
essas ações não fazem parte da implementação local. Veja [ORDERS.md](ORDERS.md)
para arquitetura, campos, tratamento de falhas, testes e preparação para webhook.

## Substituir imagens

Preencha os caminhos nos arquivos de `src/data/*` — o placeholder some sozinho.
Detalhes em `public/images/README.md`.


### Secrets no build do Worker

Use `npm run build:worker`. O script compila em uma pasta temporária sem arquivos `.env`/`.dev.vars`, sem chaves locais e sem credenciais herdadas do processo. O ambiente gerado pelo OpenNext precisa estar vazio para o pacote ser aceito. Os secrets de produção continuam nos bindings do Cloudflare. Não execute o OpenNext diretamente: use o script isolado para evitar incorporar arquivos de ambiente.
