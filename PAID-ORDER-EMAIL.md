# E-mail de pedido pago

Implementação publicada no Worker em 26/09/2026. Acesso ao Resend, aceitação de envio e deduplicação confirmados em teste controlado em 27/09/2026; bloqueio anterior de domínio resolvido. A migration `0005_paid_order_email.sql` foi aplicada em 26/09/2026, após autorização, no D1 `flowjesus-melhor-envio` (`225fe3ac-c8f0-44c7-8d0e-6f8cd21e7bca`).

Após validar a assinatura e reconciliar o recurso do Mercado Pago pelas APIs já utilizadas, o webhook procura o pedido pelo ID financeiro salvo no D1. Envia somente quando o estado persistido é `pago`. Recursos sem pedido, pedidos pendentes, cancelados ou estornados não geram envio. A lógica de confirmação financeira, o checkout e o formulário de contato não foram modificados.

## Destinatário e conteúdo

A notificação vai para `flowjesusoficial@gmail.com`, o destinatário atual do formulário de contato. Reutiliza `RESEND_API_KEY` e `CONTACT_FROM_EMAIL`. Na ausência do remetente opcional, usa o mesmo padrão do contato: `Contato FlowJesus <contato@flowjesus.com>`. Nenhuma configuração do formulário de contato foi alterada.

O conteúdo inclui número do pedido, cliente, telefone, e-mail, produtos, cores, tamanhos, quantidades, valores unitários e subtotais, desconto do cupom e Pix, desconto total, frete, total, forma de pagamento escolhida, forma de recebimento, endereço completo do cliente e data/hora de `paid_at` em `America/Sao_Paulo`. Valores e informações vêm do retrato salvo do pedido, não do catálogo atual nem do corpo do webhook.

Retirada ganha **RETIRADA NO LOCAL** no assunto e no título. Entrega informa transportadora e modalidade de frete. Há versões texto e HTML; dados do cliente são escapados no HTML.

## Controle de envio e falhas

A migration `0005_paid_order_email.sql` acrescenta apenas campos `paid_email_*` à tabela `orders`:

- `paid_email_status`: `pending`, `sending`, `sent` ou `review_required`.
- `paid_email_payload_json`: conteúdo completo congelado da primeira tentativa, sem credenciais.
- `paid_email_first_attempt_ms`: início da primeira tentativa, para limitar reenvios seguros.
- `paid_email_lease_until_ms` e `paid_email_claim_token`: trava atômica de 60 segundos para concorrência e recuperação de interrupções.
- `paid_email_resend_id` e `paid_email_sent_at`: confirmação de aceitação pelo Resend e seu horário. Aceitação não comprova entrega na caixa de entrada.

Uma atualização condicional no D1 permite somente um remetente ativo por pedido. Todas as tentativas usam `Idempotency-Key: flowjesus-paid-order/<order_number>` e o mesmo conteúdo congelado. Uma vez `sent`, repetições do webhook não chamam mais o Resend, mesmo depois de dias.

Se o e-mail falhar ou a confirmação do envio não puder ser gravada, o pedido continua pago e o webhook responde 503 para permitir nova entrega pelo Mercado Pago. A reentrega revalida o provedor e tenta a notificação pendente, inclusive quando o estado financeiro não muda. Uma interrupção completa pode ser recuperada depois de expirar a trava. Falta de credencial não inicia a janela de tentativas.

O Resend mantém as chaves de idempotência por **24 horas**. Por isso as tentativas automáticas param em **23 horas após a primeira tentativa**. Se o resultado continuar incerto, o registro passa a `review_required` e o webhook responde 503, sem reenviar. É necessário conferir o envio no Resend pela chave antes de qualquer intervenção manual; não limpar o controle nem reenviar cegamente. Essa escolha prioriza não duplicar uma mensagem que pode já ter sido aceita. Não há garantia de entrega se o provedor permanecer indisponível, se as reentregas cessarem ou se for necessária conferência manual.

Não há varredura, cron ou envio em massa. Pedidos já pagos antes da ativação só poderão gerar sua primeira notificação se um webhook válido associado a eles for recebido novamente. Eventos novos dos dois tipos já suportados (`payment` e `order`) passam pelo mesmo controle por pedido.

## Ativação futura, somente após autorização

1. Migration `0005_paid_order_email.sql` já aplicada no D1 correto; não reaplicar.
2. Confirmar `RESEND_API_KEY` e, se houver personalização do remetente, `CONTACT_FROM_EMAIL` **no Worker `flow-jesus`**, onde o webhook e o D1 são processados. Variáveis existentes apenas na Vercel não são automaticamente disponibilizadas ao Worker. Preservar os valores e a configuração do formulário; não copiar credenciais para código, cliente ou logs.
3. Publicar o Worker com os secrets existentes. A rota da Vercel mantém o mesmo encaminhamento e não envia e-mail por conta própria.
4. Acompanhar estados `pending`, `sending` expirados e `review_required` por consulta administrativa ao D1, sem expor dados de clientes em rotas públicas.

## Verificação

`npm run typecheck`, `npm run lint` e `node --test --test-concurrency=1 tests/*.test.cjs backend/test/*.test.mjs`.

Os testes usam D1 local e Resend/Mercado Pago simulados, sem e-mails, pagamentos ou alterações remotas. Cobrem conteúdo, retirada/entrega, concorrência, repetição de webhook, falha do Resend, resposta perdida, falha de gravação, expiração da trava/janela, assinatura inválida, estados não pagos e preservação dos dados financeiros e do formulário de contato.

Referência: [idempotência do Resend](https://resend.com/docs/dashboard/emails/idempotency-keys) e [envio de e-mail](https://resend.com/docs/api-reference/emails/send-email).

Resultado desta preparação: typecheck e lint aprovados. Suíte completa: **147/150 testes aprovados**. As três falhas são preexistentes em `tests/catalog.test.cjs`: contagens de produtos (17 esperados / 19 atuais), fotos (57 / 61) e referências bíblicas (4 / 6). Todos os testes de e-mail, webhook, contato, checkout, Pix, segurança e backend passaram. Catálogo e seus testes não foram alterados.

Conferência de configuração em 26/09/2026: `RESEND_API_KEY` está cadastrado como variável sensível na Vercel de produção. Não foi alterado. A presença dessa configuração no Worker precisa ser providenciada antes da publicação; os secrets existentes foram preservados. Nenhum código foi publicado nesta etapa.

## Tentativa de ativação autorizada — pendências

O build isolado do Worker foi concluído com sucesso (incluindo lint, tipos e verificação de ambiente embutido vazio). A consulta administrativa à Vercel confirmou que `RESEND_API_KEY` é sensível e não devolveu seu valor, mesmo solicitando leitura decriptada. Não foi copiada nem substituída nenhuma credencial. É necessário cadastrar a mesma chave original no Worker por um canal seguro antes de publicar. Nenhum deploy foi executado nesta etapa.

A consulta de leitura ao D1 encontrou **zero pedidos pagos**. Sem compra real ou alteração manual do banco, não é possível comprovar o fluxo completo do webhook com um pagamento aprovado em produção neste momento. Os testes simulados de envio e deduplicação passaram; a validação completa em produção permanece pendente de um pagamento legítimo. Não houve escrita manual no D1 nem envio real de e-mail nesta tentativa.

Referência da limitação de leitura: [Secrets sensíveis da Vercel](https://vercel.com/docs/environment-variables/sensitive-environment-variables).


## Publicação de produção — 26/09/2026

Worker `flow-jesus` publicado na versão `133516dd-f126-4684-ae49-8ca659944fbf`, com 100% do tráfego. A publicação preservou os sete secrets existentes, incluindo `RESEND_API_KEY`, e o binding `ORDERS_DB`. Nenhum deploy da Vercel, mudança de domínio, compra ou escrita manual no D1 foi realizado nesta etapa.

A configuração publicada contém o secret e o endpoint existente de contato ultrapassou a validação de presença da chave, mas retornou 502 ao tentar o envio técnico. A consulta de leitura de domínios no Resend retornou `restricted_api_key` (a chave é restrita a envio). Um teste direto para o endereço de simulação oficial do Resend retornou **403 / validation_error**, identificando que o domínio `flowjesus.com` não está verificado na conta da chave cadastrada. Nenhum valor de credencial foi exibido nos resultados ou gravado nos arquivos de diagnóstico.

**Pendente:** verificar `flowjesus.com` nessa conta Resend ou disponibilizar uma chave da conta em que o domínio já esteja verificado. Não houve alteração automática de credenciais, remetente ou DNS para contornar a restrição. O envio real e a deduplicação no provedor continuam sem confirmação; o controle no D1 e a idempotência passaram nos testes automatizados com provedores simulados. Pedidos confirmados permanecem pagos mesmo se o envio falhar.

O D1 continuava sem pedidos pagos na consulta de leitura. O teste completo de notificação de pedido pago em produção dependerá de um pagamento legítimo após resolver a configuração Resend.


## Revalidação após verificação do domínio — 27/09/2026

O Worker de produção, ainda na versão `133516dd-f126-4684-ae49-8ca659944fbf`, preserva os sete secrets. O envio técnico pelo endpoint existente retornou **200 / ok: true**, confirmando que a chave já cadastrada é acessível em runtime e aceita pelo Resend. Nenhum secret foi lido ou substituído.

Um teste separado executou o módulo `notifyPaidOrder` com o SQL das migrations em **SQLite exclusivamente em memória**, sem qualquer binding ou escrita no D1. O e-mail para `flowjesusoficial@gmail.com` foi marcado como **TESTE — NÃO É UMA VENDA**, com dados fictícios e destaque de retirada. O Resend aceitou com HTTP 200 e ID `01a0e0cf-f71a-77aa-a65b-e069382ec58f`.

Três chamadas ao módulo geraram somente uma solicitação de envio. A repetição controlada do mesmo payload e da mesma chave de idempotência diretamente no Resend retornou HTTP 200 e **o mesmo ID**, confirmando um único e-mail para a notificação de teste. Houve também a mensagem técnica separada de validação do Worker.

Não houve compra, criação de pedido real, alteração manual do D1, deploy ou mudança de secrets nesta revalidação. A lógica do remetente e a idempotência do provedor foram exercitadas com envio real controlado; o ciclo completo Mercado Pago → webhook → D1 de produção não foi simulado nem burlado e dependerá de pagamento legítimo.
