# Registro de pedidos — etapa 1

O novo fluxo `/api/orders/checkout` salva o pedido **antes** de solicitar um pagamento. Durante a transição, `/api/mercadopago/checkout` mantém temporariamente o contrato antigo, sem registro de pedido, para atender páginas já publicadas. Não implementa webhook, aprovação automática, e-mail de venda, painel administrativo ou emissão de etiqueta.

## Arquitetura e persistência

Fluxo novo: navegador → `/api/orders/checkout` na Vercel → mesma rota no Worker `flow-jesus` → D1 → Mercado Pago.

Fluxo legado temporário: navegador antigo → `/api/mercadopago/checkout` na Vercel → mesma rota no Worker → Mercado Pago, mantendo a cotação do Melhor Envio e as validações anteriores. Esse fluxo não depende do D1.

## Compatibilidade de transição

As rotas têm implementações separadas. A nova não importa a antiga, e o frontend novo chama exclusivamente `/api/orders/checkout`. Falta de dados, indisponibilidade do D1 ou erro do provedor no fluxo novo nunca provocam uma tentativa pelo fluxo legado. A rota antiga rejeita requisições que contenham `customer`, `address` ou `checkoutRequestId`, mesmo incompletos, para evitar que um pedido novo seja cobrado acidentalmente sem gravação.

O legado continua aceitando `items`, `shipping`, `coupon`, `discountCents`, `totalCents` e, para Pix, `paymentMethod`, `payerEmail` e `pixRequestId`. Para cartão/outros, `paymentMethod` continua opcional. A resposta continua sendo `{ checkout_url }`. O Pix legado está isolado em `src/lib/legacy-pix-payment.ts` e preserva exatamente o hash de idempotência usado antes da transição, inclusive para uma repetição iniciada antes da publicação do Worker.

Compras de clientes com páginas antigas abertas continuam utilizando o fluxo antigo mesmo após a atualização da Vercel. Elas preservam as limitações anteriores: não há pedido completo no D1 nem coleta do endereço completo. Somente compras pelo novo formulário ganham o novo registro. A compatibilidade não é um mecanismo de contingência do checkout novo e não deve permanecer indefinidamente: sua retirada exige uma etapa posterior, após confirmar a adoção da nova versão e tratar clientes antigos. Nenhuma rota foi desativada nesta preparação.

A Vercel já encaminhava o checkout ao Worker que mantém a credencial do Mercado Pago. Esse caminho foi preservado. O Worker passa a usar o binding `ORDERS_DB` para o D1 `flowjesus-melhor-envio`, já identificado na configuração existente do projeto. Não há banco em memória ou arquivo local em produção, nem nova credencial de banco na Vercel.

A tabela nova `orders` é independente das tabelas `oauth_states` e `oauth_connections`. A migração está em `migrations/orders/0001_orders.sql`; seu histórico usa `flowjesus_order_migrations`, separado do histórico de OAuth. O backend do Melhor Envio e suas migrações não foram alterados. Compartilhar o banco mantém a infraestrutura existente, mas também compartilha limites e acesso administrativo; separar os bancos é uma possível evolução operacional.

O acesso usa SQL parametrizado pelo binding de servidor. Não há rota pública de leitura ou listagem de pedidos. Nome, telefone, e-mail, endereço e itens não são devolvidos pelo checkout nem registrados nos logs. O navegador mantém os campos do formulário apenas em estado da página; a ajuda para repetição em `sessionStorage` guarda somente um identificador aleatório e um hash da tentativa, não o pedido.

## Dados salvos

| Campo | Origem / formato |
| --- | --- |
| `order_number` | `FJ-` + UUID gerado no servidor, chave primária |
| `customer_name`, `customer_email`, `customer_phone` | Contato validado; telefone normalizado para dígitos |
| `address_json` | Rua, número (aceita S/N), complemento opcional, bairro, cidade, UF, CEP e país BR |
| `items_json` | ID e nome do produto, cor, tamanho, quantidade, preço unitário e subtotal da linha em centavos |
| `subtotal_cents` | Soma dos preços do catálogo no servidor × quantidades |
| `coupon`, `coupon_discount_cents` | Cupom FLOW10 e desconto calculado no servidor |
| `pix_discount_cents` | Desconto Pix calculado sobre o subtotal, ou zero |
| `shipping_service_id`, `shipping_name`, `shipping_company` | Modalidade confirmada por nova cotação do Melhor Envio |
| `shipping_cents`, `total_cents`, `currency` | Frete confirmado e total calculado, em centavos de BRL |
| `payment_method` | Escolha do checkout: `pix` ou `other` (cartão e outros meios) |
| `status` | Inicialmente `aguardando pagamento` |
| `created_at`, `updated_at` | Data/hora ISO 8601 em UTC, geradas no servidor |
| `mercado_pago_payment_id`, `mercado_pago_preference_id` | ID do Pix ou da preferência, salvo após resposta válida do provedor |
| `paid_at` | Nulo nesta etapa; reservado para confirmação futura |

Os valores dos itens representam o preço original da compra. Os descontos são separados para preservar tanto a conferência do total quanto os dados para preparação da camiseta. No Checkout Pro continua sendo usado o rateio de desconto já existente nas linhas enviadas ao Mercado Pago.

`other` registra a categoria escolhida no site, não afirma que houve pagamento com cartão. O instrumento efetivamente utilizado será obtido na futura confirmação do provedor. Gerar a preferência ou o Pix não altera o pedido para `pago`.

## Validações e falhas do novo fluxo

- Contato, limites de comprimento, e-mail, telefone com DDD, endereço completo, UF brasileira e CEP são obrigatórios e validados no servidor. O CEP de entrega deve ser o mesmo usado na cotação. A validação não comprova que uma rua/número existe fisicamente.
- Produtos e variações vêm do catálogo; quantidades são inteiras de 1 a 100 e há limite de 50 linhas. Preços, descontos e total são recalculados. Dados forjados de preço, data, status ou nome do frete não sobrescrevem os valores do servidor.
- O pedido completo é gravado por um único INSERT atômico antes de qualquer chamada de criação de cobrança. Se o binding, a tabela, a gravação ou a trava estiverem indisponíveis, o pagamento não é solicitado.
- Uma chave aleatória identifica a tentativa; o servidor associa a ela um hash dos dados validados. Reutilizar a mesma chave com dados diferentes retorna conflito. Uma restrição UNIQUE e uma atualização condicional impedem duas chamadas concorrentes de iniciar o pagamento do mesmo pedido.
- `payment_setup_status` é um controle técnico separado do status financeiro: `not_started` → `creating` → `ready`; falhas incertas ficam em `review_required`. Somente uma resposta válida e a gravação da referência liberam o redirecionamento.
- A repetição da mesma tentativa já concluída retorna o mesmo número e link. Não recalcula um frete já aceito nem cria outra cobrança. Outra compra ou dados alterados geram outra tentativa; não há deduplicação global de clientes/carrinhos.
- Os dois meios enviam `external_reference = order_number`. O Pix usa esse mesmo número como chave de idempotência. A trava local protege também o Checkout Pro, sem depender de garantias de idempotência da API de preferências.
- Se o provedor aceitar a cobrança, mas a resposta ou a gravação seguinte falhar, os dados da compra continuam no D1. O sistema bloqueia nova cobrança automática para essa tentativa e apresenta o número do pedido para suporte. Sem webhook/reconciliação nesta etapa, é preciso conferir manualmente o Mercado Pago por `external_reference`. Uma interrupção do Worker pode deixar `creating`; não existe liberação automática por tempo, pois isso poderia duplicar pagamentos. Nunca redefina esse estado antes de conferir o provedor.

## Ativação futura do código — não executada nesta preparação

O banco já recebeu `0001_orders.sql` em uma etapa anterior autorizada. Esta preparação de compatibilidade não executa migrações nem publica código. A ordem de publicação passa a ser **Worker primeiro, Vercel depois**, pois o Worker de transição atende os dois contratos. Não publique a Vercel nova antes do Worker.

1. Confirme que o ID do D1 em `wrangler.json` corresponde ao banco pretendido. A configuração usa o ID já presente em `backend/wrangler.jsonc`. Para homologação, use Worker e D1 separados; não aponte testes para o banco real.
2. Confirme por leitura que a migração já aplicada e a tabela `orders` continuam presentes; não é necessária nova migração para esta compatibilidade.
3. Prepare o build isolado (`npm run build:worker`) e, somente na futura etapa autorizada, publique o Worker com `ORDERS_DB` e os secrets já existentes. A Vercel antiga continuará usando a rota antiga. Nenhum secret deve ser colocado no código ou nas variáveis públicas.
4. Confirme os bindings e valide os dois contratos no Worker antes de atualizar a Vercel. Os testes locais cobrem essa combinação, mas não equivalem a uma validação real do novo pacote publicado.
5. Publique o frontend/API na Vercel. O formulário novo e sua API usam `/api/orders/checkout`. Se essa rota não existir, o fluxo novo falha sem recorrer ao legado. As duas APIs têm limite de 60 segundos para acomodar as chamadas externas.
6. Valide o registro e as referências no ambiente publicado, sem autorizar pagamento. A reversão apenas da Vercel para a versão antiga continua compatível com este Worker. Evite reverter o Worker para uma versão sem `/api/orders/checkout` enquanto houver clientes novos utilizando essa rota.

Em desenvolvimento, Next.js puro sem binding retorna indisponibilidade para o checkout novo. Use o runtime Worker com D1 local e a migração local para ensaios; não há fallback do novo fluxo para arquivo, memória ou cobrança sem pedido. O comportamento independente de D1 é exclusivo da rota legada temporária.

## Verificação local

Na raiz: `node --test tests/*.test.cjs`, `npm run typecheck`, `npm run lint`.
No backend: `npm test`.

Os testes de checkout exercitam o SQL no D1 emulado via Miniflare (fornecido pela instalação do Wrangler), com pagamentos e fretes simulados. O emulador precisa abrir portas locais. Nenhum teste usa o banco remoto ou cria cobrança real.

`tests/legacy-checkout.test.cjs` repete as validações do contrato anteriormente publicado e testa Vercel antiga → Worker de transição, independência de D1, preservação da chave Pix e rejeição de dados do fluxo novo. `tests/checkout.test.cjs` cobre o novo registro, falhas, concorrência e ausência de fallback para a rota antiga. `tests/security.test.cjs` verifica os logs do fluxo novo e o isolamento de secrets no build.

Na preparação de compatibilidade, passaram 65/65 testes relevantes e 18/18 do backend, além de typecheck e lint. A primeira rodada paralela apresentou uma falha de armazenamento no teste de segurança com D1 emulado; o teste passou isoladamente e a suíte relevante inteira passou na reexecução sequencial:

```sh
node --test --test-concurrency=1 tests/checkout.test.cjs tests/legacy-checkout.test.cjs tests/pix-payment.test.cjs tests/security.test.cjs tests/contact.test.cjs
```

A suíte completa da raiz tem três falhas preexistentes em `tests/catalog.test.cjs`: espera 17 produtos/57 fotos e quatro referências bíblicas, enquanto os dados atuais contêm 19 produtos/61 fotos e seis referências. Catálogo, imagens e esse teste não foram modificados nesta etapa.

## Próxima etapa

O futuro webhook poderá localizar o pedido pelo `external_reference`/`order_number` e pelos IDs indexados, conferir o pagamento na API, comparar moeda/valor e então atualizar `status`, `paid_at` e `updated_at`. A migração já aceita `pago`, `cancelado` e `estornado`, mas nenhuma rotina desta etapa atribui esses estados financeiros.

Referências oficiais consultadas: [binding D1](https://developers.cloudflare.com/d1/worker-api/), [migrações D1](https://developers.cloudflare.com/d1/reference/migrations/), [preferências e external_reference](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/checkout-customization/preferences), [duração de funções Vercel](https://vercel.com/docs/functions/configuring-functions/duration).
