# Recuperação de confirmação e e-mail

O pagamento `182217674858`, de R$ 84,15, corresponde ao pedido
`FJ-499FDF17-0809-4EAC-A608-72D74C1C5AF4`. A consulta à API confirmou
`approved`, produção, BRL, referência e recebedor, com aprovação em
03/10/2026 às 14:37:12 de Brasília. O D1 ainda estava `aguardando pagamento`,
sem `paid_at` e sem primeira tentativa de e-mail. O fluxo dependia somente
do webhook e não recuperava confirmações perdidas. O motivo exato da falha
da notificação original não pôde ser determinado pelos logs históricos disponíveis.

A primeira execução em produção revelou também falha anterior à consulta do
pedido. Ela foi reproduzida no runtime nativo do Worker: `redirect: "error"`
gera `TypeError: Invalid redirect value`. As consultas financeiras e o envio
usavam essa opção. Foram corrigidos para `redirect: "manual"`, com rejeição de
respostas não 2xx já existente, sem seguir redirecionamentos nem encaminhar
credenciais a outro destino. O novo teste nativo cobre confirmação, envio,
repetição e respostas 302; os mocks Node anteriores não detectavam a incompatibilidade.

O Worker passa a executar `recoverPayments` a cada dois minutos. A migration
`0006_payment_recovery.sql` acrescenta apenas um checkpoint para distribuir
as verificações entre pedidos, inclusive diante de falhas do provedor.
Cada execução trata até cinco pedidos. A configuração `ORDER_RECOVERY_START_AT`
limita a recuperação a pedidos criados desde 03/10/2026, abrangendo a compra
de referência e as próximas compras, sem iniciar envios de compras anteriores.

O cron consulta o pagamento salvo ou procura o pagamento aprovado pela
referência do pedido. Reutiliza as validações financeiras completas do webhook:
valor, moeda, referência, recebedor, produção e preferência quando aplicável.
O estado pago continua armazenado como `pago` no esquema existente (equivalente
a `paid`), e `paid_at` vem do provedor. Nenhum estado enviado pelo navegador
ou por uma notificação não autenticada pode confirmar o pedido.

O envio existente para `flowjesusoficial@gmail.com` preserva produto, cor,
tamanho, quantidade, cliente, frete, total e demais dados salvos da compra.
Cron e webhook compartilham a mesma trava, payload congelado e chave de
idempotência. `sent` impede novos envios permanentemente; tentativas incertas
após 23 horas passam a `review_required`, sem reenvio automático. Falhas de
e-mail não desfazem o pagamento. A confirmação do Resend significa aceitação,
não comprovação de entrega na caixa de entrada.

Validação local:

```sh
node --test --test-concurrency=1 tests/payment-worker-runtime.test.cjs tests/payment-recovery.test.cjs tests/payment-webhook.test.cjs tests/paid-order-email.test.cjs
npm run typecheck
npm run lint
npm run build:worker
```

Na próxima compra real, conferir no D1 `status = 'pago'`, `paid_at` preenchido,
`paid_email_status = 'sent'` e um único `paid_email_resend_id`. Conferir o e-mail
na caixa de entrada/spam e sua correspondência com o pedido. Com os serviços
disponíveis e até cinco pendências, a recuperação ocorre no próximo ciclo
de dois minutos mesmo sem retorno do comprador ao site. Em caso de falha,
consultar os eventos `flowjesus_payment_recovery` e `flowjesus_paid_email`.

Referências: [Cron do Cloudflare](https://developers.cloudflare.com/workers/configuration/cron-triggers/)
e [consulta de pagamentos](https://www.mercadopago.com.br/developers/en/reference/online-payments/subscriptions/search-payments/get).
