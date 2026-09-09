# Publicar manualmente no Cloudflare Free

Não é necessário Render, disco persistente, domínio personalizado ou alteração de DNS. O nome do Worker está definido como `flowjesus-melhor-envio`; a conta Cloudflare define o subdomínio final de `workers.dev`.

## 1. Preparar conta e ferramentas

No painel Cloudflare, abra **Workers & Pages** e configure/confira o subdomínio `workers.dev` da conta. Use Workers Free e D1 Free. Não conecte o domínio da loja. Node.js 22+ deve estar instalado no computador.

Na pasta `backend`:

```sh
npm ci
npx wrangler login
npx wrangler d1 create flowjesus-melhor-envio
```

Copie o `database_id` exibido para `d1_databases[0].database_id` em `wrangler.jsonc`, substituindo os zeros. O banco tem binding `DB`.

## 2. Primeiro deploy, sem OAuth ativo

```sh
npm run db:remote
npm run deploy
```

O modo inicial `MELHOR_ENVIO_SETUP_MODE="true"` já está configurado. Nesse modo, o backend abre sem Secrets e as rotas OAuth respondem 503. Isso permite descobrir a URL antes de criar o aplicativo. As migrations criam somente as tabelas deste banco D1.

Wrangler informa a URL real, por exemplo:

```text
https://flowjesus-melhor-envio.SUBDOMINIO-DA-SUA-CONTA.workers.dev
```

O texto `SUBDOMINIO-DA-SUA-CONTA` é um marcador, não um endereço pronto. **Abra a raiz da URL real:** o JSON mostra `environment_url` e `redirect_uri`, já completos e prontos para copiar. Isso evita pressupor um subdomínio que ainda não foi informado.

## 3. Cadastrar aplicativo no Melhor Envio

Para os primeiros testes, crie o aplicativo em **Sandbox**, pois `MELHOR_ENVIO_ENVIRONMENT="sandbox"` está configurado inicialmente.

| Campo do Melhor Envio | Valor exato a copiar da raiz do backend |
| --- | --- |
| URL do ambiente para testes | `environment_url` |
| URL de redirecionamento após autorização | `redirect_uri` |

O primeiro valor termina com `/`; o segundo termina com `/api/melhor-envio/callback`, sem barra final. Não use a URL da loja nem a URL da API do Melhor Envio nesses campos.

Em `wrangler.jsonc`, substitua `MELHOR_ENVIO_REDIRECT_URI` pelo mesmo `redirect_uri` cadastrado. Confira se `MELHOR_ENVIO_USER_AGENT` contém o e-mail técnico correto.

## 4. Configurar Secrets

Execute cada comando e cole o valor no prompt protegido:

```sh
npx wrangler secret put MELHOR_ENVIO_CLIENT_ID
npx wrangler secret put MELHOR_ENVIO_CLIENT_SECRET
npx wrangler secret put MELHOR_ENVIO_ADMIN_PASSWORD
npx wrangler secret put MELHOR_ENVIO_TOKEN_KEY
```

Client ID e Client Secret vêm do aplicativo cadastrado. Para os outros dois, gere **dois valores diferentes**, executando `openssl rand -base64 32` duas vezes. Guarde-os em um gerenciador de senhas. A chave deve decodificar exatamente 32 bytes; não a altere depois de salvar tokens sem planejar nova autorização. Não coloque nenhum desses quatro valores no Wrangler, GitHub, frontend ou chat.

## 5. Ativar e autorizar

Altere `MELHOR_ENVIO_SETUP_MODE` para `"false"` em `wrangler.jsonc` e execute:

```sh
npm run deploy
```

Abra a URL real seguida de `/api/melhor-envio/authorize`. Faça login com usuário `admin` e a senha administrativa definida no Secret. Autorize no Melhor Envio e aguarde a mensagem de sucesso. Abrir diretamente o callback sem autorização retorna 400 por segurança.

Verifique `/health` e, autenticado, `/api/melhor-envio/status`. O Cron diário faz a renovação; confirme seu registro em **Settings → Triggers**. Alterações em Cron Triggers podem levar alguns minutos para propagar.

## 6. Passar a usar a conta real

Cadastre um aplicativo no ambiente de produção do Melhor Envio usando as mesmas URLs desse Worker. Atualize os Secrets de Client ID/Secret com os valores de produção e altere `MELHOR_ENVIO_ENVIRONMENT` para `"production"`. Para essa troca, publique primeiro com modo inicial `"true"`, atualize os dois Secrets, depois publique com ambiente `"production"` e modo inicial `"false"`. Autorize novamente. Isso evita chamadas com credenciais de ambientes diferentes durante a transição.

Somente um ambiente fica ativo por Worker. Se precisar testar Sandbox paralelamente à produção, use outro Worker e outro D1; não reutilize o mesmo endereço em uma implantação de teste.

## Custo e limites

Não há plano pago requerido por esta configuração. O uso precisa permanecer dentro das cotas Workers Free e D1 Free, incluindo CPU por requisição; acompanhe o painel. O Cron faz apenas uma verificação por dia, e o banco guarda poucos registros. O empacotamento e os testes locais não equivalem a uma medição de CPU/cotas na conta publicada.

A publicação hospeda o OAuth e sua renovação. Não altera produtos, loja, checkout, domínio ou DNS e não ativa frete no frontend.

Fontes: https://developers.cloudflare.com/workers/platform/limits/ · https://developers.cloudflare.com/d1/platform/pricing/ · https://developers.cloudflare.com/workers/configuration/cron-triggers/
