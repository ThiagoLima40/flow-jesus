# Imagens — FLOW JESUS

Enquanto as fotos reais não são adicionadas, o site usa **placeholders premium**
(SVG street com a marca d'água `SUBSTITUIR IMAGEM`). Não há fotos de banco aleatórias.

## Como trocar por imagens reais

Todo lugar que mostra imagem usa o componente `StreetImage`. Basta preencher o
caminho no dado correspondente — o placeholder some automaticamente:

| Onde                | Arquivo de dados               | Campo         |
| ------------------- | ------------------------------ | ------------- |
| Produtos (loja)     | `src/data/products.ts`         | `images: []`  |
| Faixas (Flow Play)  | `src/data/tracks.ts`           | `src`         |
| Vídeos (Flow BJJ)   | `src/data/videos.ts`           | `youtubeId`   |
| Galeria             | `src/data/gallery.ts`          | `src`         |

Exemplo (produto):

```ts
images: ["/images/products/reino-frente.jpg", "/images/products/reino-verso.jpg"],
```

## Galeria = arrasta-e-solta (sem editar código)

A **galeria** é automática. Basta soltar as fotos em `public/images/gallery/`
e elas aparecem no site sozinhas — não precisa mexer em `gallery.ts`.

Opcional: o começo do nome do arquivo define a categoria (o texto antes do
primeiro `-` ou `_`):

| Nome do arquivo               | Vai pra categoria |
| ----------------------------- | ----------------- |
| `treinos-praia.jpg`           | TREINOS           |
| `competicoes-final_01.webp`   | COMPETIÇÕES       |
| `viagens-sp.jpg`              | VIAGENS           |
| `familia-natal.jpg`           | FAMÍLIA           |
| `foto-qualquer.jpg`           | FLOW JESUS (padrão) |

Sem foto na pasta, a galeria mostra os placeholders premium.

## Produtos = pasta com o nome do produto (sem editar código)

Cada produto tem um "slug" (nome curto na URL). Para colocar as fotos:

1. Crie uma pasta com o slug dentro de `public/images/products/`
2. Solte as fotos dentro dela — a **1ª** é a frente, a **2ª** é o verso (hover)
3. Inicie o site (as fotos entram na vitrine, na página do produto e no carrinho)

```
public/images/products/reino/1-frente.jpg
public/images/products/reino/2-verso.jpg
```

Slugs disponíveis: `graca-que-salva`, `reino`, `essencial`, `fe-que-move`,
`nada-alem-da-graca`, `ele-vive`, `basic-flow`, `moletom-cristo-no-centro`,
`moletom-propósito`, `gorro-reino`, `ecobag-flow`, `camiseta-joao-316`.

> As fotos de produto são lidas quando o site inicia. Se adicionar fotos com o
> site já rodando, pare (Ctrl+C) e rode `npm run dev` de novo.

## Estrutura de pastas

- `brand/`     — logos, wordmark, arte-manifesto
- `products/`  — fotos de produtos (frente + verso)
- `isaque/`    — fotos do atleta (kimono, retrato, história)
- `bjj/`       — thumbnails de vídeos, tatame
- `gallery/`   — momentos (treinos, competições, viagens, família)
- `graphics/`  — stickers, coroas, cruzes extras (PNG/SVG)
- `textures/`  — grain, paper, spray (se quiser trocar as texturas em CSS)

Recomendado: exportar em `.webp`/`.avif`. O `next/image` já otimiza no build.
