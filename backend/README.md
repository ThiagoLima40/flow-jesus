# FlowJesus — Melhor Envio em Cloudflare Workers + D1

Backend independente, preparado para Workers Free e D1 Free. Não usa Express, servidor permanente, Render nem disco local. A implementação usa as APIs nativas de Request/Response e Web Crypto, sem dependências de execução. A loja Next.js permanece inalterada.

Siga [DEPLOY.md](DEPLOY.md) para publicar manualmente. Nenhum comando de instalação ou teste faz deploy. `npm run deploy` e `npm run db:remote` são ações explícitas de publicação.

## Rotas

- `GET /`: identifica o backend e informa as duas URLs completas para o cadastro.
- `GET /health`: verifica acesso ao D1; não confirma autorização da conta.
- `GET /api/melhor-envio/authorize`: inicia OAuth; exige HTTP Basic (`admin` + Secret administrativo).
- `GET /api/melhor-envio/callback`: valida cookie/estado e troca o código por tokens.
- `GET /api/melhor-envio/status`: status e datas de validade, somente para administrador.
- `POST /api/melhor-envio/refresh`: renova se necessário; exige HTTP Basic e `X-FlowJesus-Admin: 1`. Se houver Origin, deve coincidir com o backend.

Nenhuma rota retorna access token, refresh token, Client Secret ou chave de criptografia. CORS não é habilitado; o frontend não participa do OAuth.

## Armazenamento e renovação

Tokens são cifrados com AES-256-GCM e IV aleatório, vinculados à conta/aplicativo e ambiente. A chave de 32 bytes fica em Cloudflare Secrets, separada do banco. Sandbox e produção têm registros separados. Trocar Client ID também separa as conexões.

O estado OAuth e o identificador do navegador são aleatórios; apenas seus hashes são guardados no D1 por dez minutos. O estado é consumido atomicamente via DELETE RETURNING, vinculado ao cookie Secure/HttpOnly/SameSite=Lax. Não há sessões em memória dependentes de uma instância.

Um Cron Trigger roda diariamente às 04:17 UTC. Renova quando faltam até três dias para expirar o access token, inclusive quando a loja não tem acessos. Ambos os tokens são substituídos juntos em uma gravação atômica no D1. O refresh token tem validade de 45 dias segundo a documentação do Melhor Envio.

Uma trava atômica no D1 impede renovações concorrentes. A gravação exige o identificador do proprietário da trava, para que execuções antigas não sobrescrevam tokens novos. Se a execução morrer, a trava expirada força nova autorização, sem reapresentar automaticamente o refresh token. Timeout, resposta inválida ou falha ao gravar após uma troca também deixam o status `reauthorize`: não existe transação distribuída entre Melhor Envio e D1 que garanta recuperar um token rotacionado cuja resposta foi perdida.

Erros ao ler/descriptografar antes da chamada externa preservam os dados e não consomem o refresh token. A chave deve permanecer estável. Para recuperar chave perdida, configure uma nova chave e autorize novamente; os tokens anteriores não são recuperáveis sem a chave antiga.

`getAccessToken` é uma função interna para futuras chamadas de frete e faz a verificação/renovação antes de retornar o token ao código do servidor. Frete no checkout não faz parte desta entrega.

## Desenvolvimento e testes

```sh
npm ci
npm test
npm run check
```

Os testes usam o runtime local Miniflare e D1 real emulado, com respostas simuladas do Melhor Envio. Não acessam conta real, banco remoto ou produtos. O dry-run verifica o empacotamento sem publicar. Para servir localmente: `npm run db:local` e `npm run dev`; o modo inicial permite testar `/health`. OAuth ativo requer a origem HTTPS exata cadastrada; o tutorial de publicação resolve essa etapa com workers.dev.

Não versione `.dev.vars`, `.env`, chaves, tokens ou arquivos de estado `.wrangler/`. Logs de requisições automáticos estão desativados no Wrangler para evitar guardar a query do callback. Os únicos logs emitidos pelo código são mensagens estáticas de falha na renovação. Para operação, confira a execução do Cron e `/api/melhor-envio/status`.

Referências: [Workers](https://developers.cloudflare.com/workers/), [D1](https://developers.cloudflare.com/d1/), [OAuth Melhor Envio](https://docs.melhorenvio.com.br/reference/fluxo-de-autoriza%C3%A7%C3%A3o), [renovação](https://docs.melhorenvio.com.br/reference/solicitacao-do-token).
