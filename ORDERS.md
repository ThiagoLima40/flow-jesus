# Registro de pedidos e confirmação de pagamentos

O fluxo `/api/orders/checkout` salva o pedido **antes** de solicitar um pagamento. O webhook `/api/mercadopago/webhook` consulta o Mercado Pago e confirma o estado financeiro no D1. Durante a transição, `/api/mercadopago/checkout` mantém temporariamente o contrato antigo, sem registro de pedido, para atender páginas já publicadas. Não implementa e-mail de venda, painel administrativo ou emissão de etiqueta.

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
| `paid_at` | Data de aprovação retornada pela API; preservada em estornos e repetições |

Os valores dos itens representam o preço original da compra. Os descontos são separados para preservar tanto a conferência do total quanto os dados para preparação da camiseta. No Checkout Pro continua sendo usado o rateio de desconto já existente nas linhas enviadas ao Mercado Pago.

`other` registra a categoria escolhida no site, não afirma que houve pagamento com cartão. O webhook confere o pagamento consultando o provedor. Gerar a preferência ou o Pix não altera o pedido para `pago`.

## Validações e falhas do novo fluxo

- Contato, limites de comprimento, e-mail, telefone com DDD, endereço completo, UF brasileira e CEP são obrigatórios e validados no servidor. O CEP de entrega deve ser o mesmo usado na cotação. A validação não comprova que uma rua/número existe fisicamente.
- Produtos e variações vêm do catálogo; quantidades são inteiras de 1 a 100 e há limite de 50 linhas. Preços, descontos e total são recalculados. Dados forjados de preço, data, status ou nome do frete não sobrescrevem os valores do servidor.
- O pedido completo é gravado por um único INSERT atômico antes de qualquer chamada de criação de cobrança. Se o binding, a tabela, a gravação ou a trava estiverem indisponíveis, o pagamento não é solicitado.
- Uma chave aleatória identifica a tentativa; o servidor associa a ela um hash dos dados validados. Reutilizar a mesma chave com dados diferentes retorna conflito. Uma restrição UNIQUE e uma atualização condicional impedem duas chamadas concorrentes de iniciar o pagamento do mesmo pedido.
- `payment_setup_status` é um controle técnico separado do status financeiro: `not_started` → `creating` → `ready`; falhas incertas ficam em `review_required`. Somente uma resposta válida e a gravação da referência liberam o redirecionamento.
- A repetição da mesma tentativa já concluída retorna o mesmo número e link. Não recalcula um frete já aceito nem cria outra cobrança. Outra compra ou dados alterados geram outra tentativa; não há deduplicação global de clientes/carrinhos.
- Os dois meios enviam `external_reference = order_number`. O Pix usa esse mesmo número como chave de idempotência. A trava local protege também o Checkout Pro, sem depender de garantias de idempotência da API de preferências.
- Se o provedor aceitar a cobrança, mas a resposta ou a gravação seguinte falhar, os dados da compra continuam no D1. O sistema bloqueia nova cobrança automática para essa tentativa e apresenta o número do pedido para suporte. O webhook pode reconciliar `creating`/`review_required` pela referência do pedido. Se nenhuma notificação chegar, é preciso conferir manualmente o provedor: não existe liberação automática por tempo, pois isso poderia duplicar pagamentos.

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

## Webhook de pagamento

Rota: **POST `/api/mercadopago/webhook`**. URL a cadastrar no painel Mercado Pago, em Webhooks → modo de produção:

`https://www.flowjesus.com/api/mercadopago/webhook`

Eventos suportados: **Pagamentos (`payment`)** para a integração atual via Payments/Preferences e **Order (Mercado Pago) (`order`)** para recursos da Orders API. Selecionar apenas Order não substitui o evento payment da integração atual. A criação do checkout continua usando `/v1/payments` (Pix) e `/checkout/preferences` (outros meios); esta mudança não migra a criação para a Orders API.

O cadastro no painel mantém a criação atual de Pix e preferências sem mudanças de payload. A Vercel encaminha a query original e os headers `x-signature`/`x-request-id` ao mesmo caminho no Worker. Não encaminha corpo, cookies ou credenciais; o Worker valida a assinatura HMAC-SHA256 usando o `data.id` da query, normalizado em minúsculas no manifesto. IDs numéricos são pagamentos; IDs `ORD...` são orders. Tipos incompatíveis com o ID ou não suportados retornam 400. Sem `type`, o tipo é inferido do formato do ID assinado. GET não é implementado. Não há autenticação por URL secreta ou por status enviado pelo cliente.

Depois da assinatura, consulta `GET /v1/payments/{id}` com o token existente. O processamento usa exclusivamente os campos dessa resposta: exige pagamento de produção, ID correspondente, referência do pedido, valor integral exato, moeda e conta recebedora correspondente ao `GET /users/me`. Pix deve continuar sendo Pix. No Checkout Pro, consulta também `/merchant_orders/{id}` quando informado e confere preferência, referência, recebedor e associação do pagamento. Sem a preferência verificável, não confirma Checkout Pro. Não acessa URLs recebidas no corpo.

| Estado Mercado Pago | `orders.status` |
| --- | --- |
| `pending` | `aguardando pagamento` |
| `approved` | `pago` |
| `rejected` | `cancelado` |
| `cancelled` | `cancelado` |
| `refunded` | `estornado` |

`mercado_pago_status` conserva a distinção entre rejeição e cancelamento. Cada atualização aceita define `payment_setup_status = ready`, salva o ID de pagamento, preserva/completa a preferência quando aplicável e atualiza `updated_at`. Pix direto não exige preferência. `paid_at` usa `date_approved` na aprovação, sem substituir a primeira data; um estorno recebido primeiro também recupera essa data se ela estiver disponível.

A migração `0002_payment_confirmation.sql` acrescenta `mercado_pago_status` e `mercado_pago_updated_at`. A data de atualização do provedor e uma atualização SQL condicional impedem sobrescritas concorrentes e eventos antigos. Repetições não alteram nem `updated_at`. A assinatura não tem limite de idade para permitir reentregas: cada repetição consulta novamente a API e passa pelos mesmos controles. Um pedido pago não volta a pendente/cancelado; estornado é terminal. Uma tentativa aprovada ou já estornada pode substituir uma tentativa sem sucesso da mesma preferência; outra tentativa não sobrescreve um pedido já pago/estornado. Múltiplos pagamentos efetivamente aprovados exigem conciliação manual; este modelo mantém um pagamento por pedido.

Conflitos de validação retornam 409, assinatura inválida retorna 401; ausência de configuração, falhas da API/D1 e concorrência retornam 503 para permitir nova entrega. Respostas não expõem payloads nem mensagens internas. Pagamentos legados sem referência `FJ-...` são reconhecidos sem criar ou modificar pedidos. Estados adicionais de payment, chargebacks e estornos parciais não ganham um novo mapeamento nesta implementação.

### Compatibilidade com Order

`order` consulta exclusivamente `GET /v1/orders/{ORD...}`. Confere ID, tipo online, referência, valor em centavos, moeda (ou país BR quando a API não informa moeda), `user_id` contra `/users/me` e recebedor quando presente. Recusa `live_mode: false` e contas com tag `test_user`. Os dados do corpo da notificação não determinam nenhum estado financeiro. A consulta da API com o token da conta é obrigatória.

| Estado Orders API | Estado no D1 |
| --- | --- |
| `created`, `processing`, `action_required` | `aguardando pagamento` |
| `processed` com `status_detail: accredited`, transação acreditada e total integral pago | `pago` |
| `failed`, `canceled`, `expired` | `cancelado` |
| `refunded`, ou `processed` com detalhe `refunded`, com reembolsos processados somando o total | `estornado` |

A migração adicional `0003_order_notifications.sql` cria `mercado_pago_order_id` (índice único), `mercado_pago_order_status` e `mercado_pago_order_updated_at`. O ID `ORD...` nunca ocupa a coluna de pagamento/preferência; o ID `PAY...` é salvo como pagamento, sem enviá-lo à Payments API. Preferências existentes são preservadas e precisam coincidir quando informadas. Uma Order não pode sobrescrever um pedido associado a outro pagamento, preferência ou Order. Versões e atualizações condicionais protegem contra repetição, regressão e concorrência.

Quando Orders API não fornece `date_approved`, `paid_at` usa `last_updated_date` do estado acreditado consultado; representa a data da confirmação desse estado, não necessariamente o instante exato do pagamento. Uma data já gravada é preservada no estorno. Se o primeiro evento recebido for estorno sem data de aprovação, `paid_at` continua nulo.

O modelo atual representa um pagamento integral por pedido: múltiplas transações, estornos parciais ou estados desconhecidos de Order retornam 409 sem alteração financeira e exigem conciliação manual. Uma Order válida sem transações pode registrar apenas o estado pendente/cancelado; nunca aprovação. Orders sem pedido FlowJesus não criam pedidos automaticamente.

### Ativação futura — não executada

1. Aplicar **somente na etapa autorizada de publicação** as migrações pendentes `0002_payment_confirmation.sql` e `0003_order_notifications.sql` no D1 de pedidos, nessa ordem, com o histórico `flowjesus_order_migrations`.
2. O cadastro de `MERCADOPAGO_WEBHOOK_SECRET` no Worker já foi confirmado pelo Wrangler em etapa anterior. Preservar esse secret, `MERCADOPAGO_ACCESS_TOKEN` e o binding `ORDERS_DB`; não é necessário recriar o secret para esta correção.
3. Publicar Worker primeiro e Vercel depois, quando autorizado. Cadastrar a URL de produção acima no painel da aplicação que cria os pagamentos: manter `payment` para o checkout atual e habilitar `order` se houver recursos da Orders API. Conferir se há `notification_url` individual em pagamentos antigos que sobreponha a configuração do painel.
4. Validar entregas e atualização do D1. Testes automatizados usam respostas simuladas com `live_mode: true` e D1 local, nunca o banco ou pagamentos reais. O simulador do painel com pagamento fictício não comprova a conciliação: a API precisa retornar um pagamento real da conta, com referência e valor correspondentes.

A rota legada permanece para não alterar o checkout existente. Seus pagamentos sem pedido não podem ser conciliados automaticamente; a retirada dessa compatibilidade continua sendo uma tarefa separada.

Testes do webhook: `node --test tests/payment-webhook.test.cjs`. Cobrem assinatura, proxy Vercel, cinco estados, referências/valor/moeda/recebedor, concorrência, reentregas, ordem dos eventos, corrida com checkout e falhas sem vazamento de dados.

Referências: [Webhooks e assinatura](https://www.mercadopago.com.br/developers/pt/docs/checkout-bricks/additional-content/your-integrations/notifications/webhooks), [merchant orders](https://www.mercadopago.com.br/developers/pt/reference/online-payments/checkout-pro-preferences/merchant-orders/get-merchant-order/get).

Referências Orders API: [notificações](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro-orders/notifications?scope=prod), [consulta por ID](https://www.mercadopago.com.br/developers/pt/reference/online-payments/checkout-pro/get-order/get), [reembolso](https://www.mercadopago.com.br/developers/en/reference/online-payments/checkout-api/refund-order/post).

Referências oficiais consultadas: [binding D1](https://developers.cloudflare.com/d1/worker-api/), [migrações D1](https://developers.cloudflare.com/d1/reference/migrations/), [preferências e external_reference](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/checkout-customization/preferences), [duração de funções Vercel](https://vercel.com/docs/functions/configuring-functions/duration).
