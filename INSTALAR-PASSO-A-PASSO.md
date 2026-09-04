# 🚀 FLOW JESUS — Guia de Instalação (Linux, do zero)

Oi, Thiago! Este guia é bem passo a passo. Você **não precisa saber programar**
pra seguir. É só copiar e colar os comandos, um de cada vez.

> **O que é o "terminal"?** É aquela janela preta onde a gente digita comandos.
> No Ubuntu/Linux Mint você abre com o atalho **Ctrl + Alt + T**.
> Para **colar** no terminal use **Ctrl + Shift + V** (com o Shift!).

Sempre que aparecer um bloco assim:

```bash
algum comando aqui
```

...significa: digite (ou cole) essa linha no terminal e aperte **Enter**.

---

## ✅ Passo 1 — Instalar o Node.js (o "motor" do site)

O site precisa do **Node.js** pra funcionar. Vamos instalar a forma mais segura,
usando uma ferramenta chamada **nvm**.

**1.1** Cole esta linha e aperte Enter (ela baixa o instalador do nvm):

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
```

**1.2** **Feche o terminal e abra de novo** (importante!). Ou cole isto:

```bash
source ~/.bashrc
```

**1.3** Agora instale o Node.js versão 20:

```bash
nvm install 20
```

**1.4** Confira se deu certo. Cole:

```bash
node -v
```

Se aparecer algo como `v20.x.x`, **deu certo!** 🎉
Se der erro "comando não encontrado", feche o terminal, abra de novo e repita 1.3.

---

## ✅ Passo 2 — Descompactar o site

**2.1** O arquivo que você recebeu chama-se `flow-jesus.zip`. Provavelmente está na
pasta **Downloads**. Vamos até ela:

```bash
cd ~/Downloads
```

**2.2** Descompacte:

```bash
unzip flow-jesus.zip
```

> Se aparecer "unzip: comando não encontrado", instale antes com:
> `sudo apt install unzip` (vai pedir sua senha do computador — digite, ela fica
> invisível enquanto você digita, isso é normal).

**2.3** Entre na pasta do site:

```bash
cd flow-jesus
```

> A partir daqui, **sempre rode os comandos do site dentro desta pasta.**
> Se abrir um terminal novo, entre nela de novo com:
> `cd ~/Downloads/flow-jesus`

---

## ✅ Passo 3 — Instalar as peças do site

Só na primeira vez. Cole e aguarde (pode levar 1–3 minutos, é normal aparecer
bastante texto):

```bash
npm install
```

Quando o terminal "voltar" e você puder digitar de novo, terminou.

---

## ✅ Passo 4 — Ver o site no navegador

```bash
npm run dev
```

Vai aparecer algo assim:

```
▲ Next.js
- Local:  http://localhost:3000
```

**Abra o navegador** (Chrome/Firefox) e acesse:

👉 **http://localhost:3000**

Pronto, o site está rodando no seu computador! 🎉

> **Para PARAR o site:** volte no terminal e aperte **Ctrl + C**.
> **Para ligar de novo:** rode `npm run dev` outra vez (dentro da pasta do site).

---

## 🖼️ Passo 5 — Adicionar suas fotos (a parte que mais importa!)

Você **não precisa mexer em código**. É só colocar arquivos em pastas certas.
As pastas ficam dentro de `flow-jesus/public/images/`.

### 📸 Galeria (o mais fácil — arrasta e solta)

1. Abra o gerenciador de arquivos na pasta:
   `flow-jesus` → `public` → `images` → `gallery`
2. **Arraste suas fotos pra dentro dessa pasta.** Só isso.
3. Atualize a página `http://localhost:3000/galeria` no navegador.

**Dica de organização (opcional):** o começo do nome do arquivo escolhe a
categoria. Exemplos:

| Nome do arquivo             | Vai aparecer em |
| --------------------------- | --------------- |
| `treinos-praia.jpg`         | TREINOS         |
| `competicoes-final.jpg`     | COMPETIÇÕES     |
| `viagens-sp.jpg`            | VIAGENS         |
| `familia-natal.jpg`         | FAMÍLIA         |
| `qualquer-nome.jpg`         | FLOW JESUS      |

### 👕 Fotos dos produtos

1. Dentro de `public/images/products/`, **crie uma pasta com o nome do produto**
   (veja a lista de nomes no arquivo `public/images/README.md`).
   Exemplo: crie a pasta `reino`.
2. Coloque as fotos dentro dela. A **1ª foto** é a da frente; a **2ª** aparece
   quando o mouse passa por cima (o verso).

   ```
   public/images/products/reino/1-frente.jpg
   public/images/products/reino/2-verso.jpg
   ```
3. **Importante:** as fotos de produto entram quando o site inicia. Se o site
   estiver rodando, aperte **Ctrl + C** no terminal e rode `npm run dev` de novo.

> Enquanto não houver foto, o site mostra um quadro bonito escrito
> "SUBSTITUIR IMAGEM". Isso é de propósito — some sozinho quando a foto entra.

**Formato das fotos:** use `.jpg` ou `.webp`. Evite imagens gigantes (acima de
uns 3 MB) pra o site não ficar pesado.

---

## ❓ Deu algum problema?

- **"command not found: npm"** → o Node não foi instalado direito. Volte ao Passo 1,
  feche e reabra o terminal, e tente `nvm install 20` de novo.
- **"Port 3000 is already in use"** → o site já está aberto em outro terminal.
  Feche o outro, ou reinicie o computador e tente de novo.
- **A foto não apareceu** →
  - Galeria: atualize a página (F5). Confira se o arquivo é `.jpg`/`.png`/`.webp`.
  - Produto: parou e rodou `npm run dev` de novo? A pasta tem exatamente o nome
    (slug) do produto?
- **Travou / não sei o que fazer** → aperte **Ctrl + C** no terminal, feche tudo,
  e recomece do Passo 4. Nada quebra o site: as fotos ficam salvas nas pastas.

Qualquer dúvida, me chama. 🙏

---

### (Avançado — só quando o site for pro ar de verdade)

Para gerar a versão final otimizada e publicar em um servidor:

```bash
npm run build
npm start
```

Mas isso a gente vê junto na hora de colocar o site no ar. Por enquanto,
`npm run dev` já mostra tudo funcionando no seu computador.
