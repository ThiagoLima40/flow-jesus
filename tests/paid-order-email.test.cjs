const {test, before, after} = require('node:test');
const assert = require('node:assert/strict');
const {randomUUID} = require('node:crypto');
const {load, databaseFixture, contact} = require('./helpers/orders.cjs');
const {OrderStore} = load('src/lib/order-store.ts');
const {notifyPaidOrder} = load('src/lib/paid-order-email.ts');
let fixture, counter = 90000;
before(async () => { fixture = await databaseFixture(); });
after(async () => { await fixture?.close(); });
const env = {RESEND_API_KEY: 'resend-private-key', CONTACT_FROM_EMAIL: 'Loja <contato@flowjesus.com>'};
const start = Date.parse('2026-09-26T15:00:00Z');
async function scenario(mode = 'delivery') {
  const input = contact();
  input.customer.phone = '11999998888';
  input.customer.name = '<script>alert("x")</script> & Cliente';
  const order = await new OrderStore(fixture.db).create(randomUUID(), 'hash', {
    ...input, items: [
      { productId: 'test1', name: 'Camiseta <Fé>', color: 'Preto', size: 'M', quantity: 2, unitPriceCents: 9900, subtotalCents: 19800 },
      { productId: 'test2', name: 'Camiseta Amor', color: 'Branco', size: 'GG', quantity: 1, unitPriceCents: 9900, subtotalCents: 9900 },
    ], subtotalCents: 29700, coupon: 'FLOW10', couponDiscountCents: 2970, pixDiscountCents: 1485,
    shipping: {mode, serviceId: mode === 'pickup' ? 0 : 1, name: mode === 'pickup' ? 'Retirada no local — Grátis' : 'PAC', company: mode === 'pickup' ? null : 'Correios', amountCents: mode === 'pickup' ? 0 : 2490},
    totalCents: 29700 - 2970 - 1485 + (mode === 'pickup' ? 0 : 2490), paymentMethod: 'pix',
  });
  const id = String(++counter);
  await fixture.db.prepare("UPDATE orders SET status = 'pago', paid_at = ?, mercado_pago_payment_id = ? WHERE order_number = ?")
    .bind('2026-09-26T14:59:10.000Z', id, order.order_number).run();
  const calls = [];
  let time = start;
  const send = async (url, options) => {calls.push({url, options, body: JSON.parse(options.body)}); return Response.json({id:'email-test-id'});};
  return {order, id, calls, send, setTime: value => {time=value;},
    notify: (fetchImpl = send, db = fixture.db, config = env) => notifyPaidOrder(db, config, {type:'payment',id},fetchImpl,()=>time),
    row: () => fixture.db.prepare('SELECT * FROM orders WHERE order_number = ?').bind(order.order_number).first(),
  };
}

for (const mode of ['delivery','pickup']) test(`${mode}: complete saved order, exact totals, timezone and safe HTML`, async () => {
  const s = await scenario(mode);
  await s.notify();
  const {body,options,url} = s.calls[0];
  assert.equal(url,'https://api.resend.com/emails');
  assert.equal(options.headers.Authorization,'Bearer resend-private-key');
  assert.equal(options.headers['Idempotency-Key'],`flowjesus-paid-order/${s.order.order_number}`);
  assert.equal(body.from,env.CONTACT_FROM_EMAIL);
  assert.deepEqual(body.to,['flowjesusoficial@gmail.com']);
  assert.equal(body.reply_to,'test@example.com');
  const text=body.text.replace(/\u00a0/g,' ');
  for(const part of [s.order.order_number, 'Cliente', '11999998888', 'test@example.com',
    'Camiseta <Fé>', 'Tamanho: M', 'Quantidade: 2', 'Tamanho: GG', 'Quantidade: 1',
    'Subtotal: R$ 297,00', 'Desconto do cupom (FLOW10): R$ 29,70', 'Desconto Pix: R$ 14,85',
    'Desconto total: R$ 44,55', 'Avenida Teste, 123 — Apto 4', 'Centro — São Paulo/SP',
    'CEP 01310-100 — BR', '26/09/2026', '11:59:10', 'America/Sao_Paulo']) assert(text.includes(part), part);
  if(mode==='pickup') {
    assert.match(body.subject,/RETIRADA NO LOCAL/);assert.match(body.html,/<h2>RETIRADA NO LOCAL<\/h2>/);
    assert.match(text,/Frete: R\$ 0,00/);assert.match(text,/Total: R\$ 252,45/);
    assert.doesNotMatch(text,/Transportadora:|Modalidade de frete:/);
  } else {
    assert.match(text,/Forma de recebimento: Entrega/);assert.match(text,/Transportadora: Correios/);
    assert.match(text,/Modalidade de frete: PAC/);assert.match(text,/Frete: R\$ 24,90/);assert.match(text,/Total: R\$ 277,35/);
  }
  assert.doesNotMatch(body.html,/<script>/);assert.match(body.html,/&lt;script&gt;/);assert.match(body.html,/&lt;Fé&gt;/);
  const row=await s.row();assert.equal(row.paid_email_status,'sent');assert.equal(row.paid_email_resend_id,'email-test-id');
  assert.equal(row.paid_email_sent_at,new Date(start).toISOString());
  s.setTime(start+40*24*3600000);await s.notify();assert.equal(s.calls.length,1);
});

test('sender keeps the contact default when CONTACT_FROM_EMAIL is absent', async()=>{
  const s=await scenario();await s.notify(s.send,fixture.db,{RESEND_API_KEY:env.RESEND_API_KEY});
  assert.equal(s.calls[0].body.from,'Contato FlowJesus <contato@flowjesus.com>');
});

test('unpaid, cancelled and refunded orders never send or claim an email', async()=>{
  for(const status of ['aguardando pagamento','cancelado','estornado']) {
    const s=await scenario();await fixture.db.prepare('UPDATE orders SET status = ? WHERE order_number = ?').bind(status,s.order.order_number).run();
    await s.notify();assert.equal(s.calls.length,0);assert.equal((await s.row()).paid_email_first_attempt_ms,null);
  }
});

test('unknown payment ID cannot notify another order',async()=>{
  const s=await scenario();await notifyPaidOrder(fixture.db,env,{type:'payment',id:'999999999'},s.send);
  assert.equal(s.calls.length,0);
});

test('concurrent handlers hold one lease and make one Resend request',async()=>{
  const s=await scenario();let reached,release;
  const entered=new Promise(resolve=>{reached=resolve;});const blocked=new Promise(resolve=>{release=resolve;});
  const first=s.notify(async(url,options)=>{reached();await blocked;return s.send(url,options);});
  await entered;await assert.rejects(s.notify(),/Paid order email unavailable/);
  release();await first;await s.notify();assert.equal(s.calls.length,1);
});

test('timeout after provider acceptance retries the exact frozen payload and same key',async()=>{
  const s=await scenario();let first;
  await assert.rejects(s.notify(async(url,options)=>{first={url,options};throw new Error('private response lost');}));
  const row=await s.row();assert.equal(row.status,'pago');assert.equal(row.paid_email_status,'pending');
  s.setTime(start+1000);
  await s.notify(async(url,options)=>{
    assert.equal(options.body,first.options.body);assert.equal(options.headers['Idempotency-Key'],first.options.headers['Idempotency-Key']);
    return s.send(url,options);
  },fixture.db,{...env,CONTACT_FROM_EMAIL:'Changed <changed@flowjesus.com>'});
  assert.equal(s.calls[0].body.from,env.CONTACT_FROM_EMAIL);assert.equal((await s.row()).paid_email_first_attempt_ms,start);
});

test('failed acknowledgement in D1 retries the same provider key without losing paid state',async()=>{
  const s=await scenario();let attempts=0;const keys=new Set();
  const provider=async(url,options)=>{attempts++;keys.add(options.headers['Idempotency-Key']);return s.send(url,options);};
  const db={prepare(sql){if(sql.includes("SET paid_email_status = 'sent'"))throw new Error('private write failure');return fixture.db.prepare(sql);}};
  await assert.rejects(s.notify(provider,db));assert.equal((await s.row()).status,'pago');
  await s.notify(provider);assert.equal(attempts,2);assert.equal(keys.size,1);assert.equal((await s.row()).paid_email_status,'sent');
});

test('expired lease recovers after interrupted process and unexpired lease never sends',async()=>{
  const s=await scenario();
  await fixture.db.prepare("UPDATE orders SET paid_email_status='sending', paid_email_first_attempt_ms=?, paid_email_lease_until_ms=?, paid_email_claim_token='old' WHERE order_number=?")
    .bind(start,start+60000,s.order.order_number).run();
  await assert.rejects(s.notify());s.setTime(start+60001);await s.notify();assert.equal(s.calls.length,1);
});

test('uncertain attempt outside the safety window is retained for review, never sent again',async()=>{
  const s=await scenario();await assert.rejects(s.notify(async()=>{throw new Error('timeout');}));
  s.setTime(start+23*3600000);await assert.rejects(s.notify());
  assert.equal((await s.row()).paid_email_status,'review_required');
  s.setTime(start+3*24*3600000);await assert.rejects(s.notify());assert.equal(s.calls.length,0);
});

test('missing credentials does not consume the retry window; later configuration can send',async()=>{
  const s=await scenario();await assert.rejects(s.notify(s.send,fixture.db,{}));
  assert.equal((await s.row()).paid_email_first_attempt_ms,null);
  s.setTime(start+3*24*3600000);await s.notify();assert.equal(s.calls.length,1);
});

test('provider rejection and malformed success remain retryable without exposing private details',async()=>{
  const s=await scenario();
  for(const response of [Response.json({secret:'private-value'},{status:429}),Response.json({secret:'private-value'},{status:403}),Response.json({}),new Response('private-invalid-json')]) {
    await assert.rejects(s.notify(async()=>response),error=>error.message==='Paid order email unavailable');
    assert.equal((await s.row()).paid_email_status,'pending');
  }
  await s.notify();assert.equal(s.calls.length,1);
});

test('financial order fields remain byte-for-byte unchanged by the email sender',async()=>{
  const s=await scenario();const before=await s.row();await s.notify();const after=await s.row();
  for(const key of Object.keys(before).filter(k=>!k.startsWith('paid_email_')))assert.deepEqual(after[key],before[key],key);
});

test('refund committed before the atomic claim prevents the email',async()=>{
  const s=await scenario();let changed=false;
  const db={prepare(sql){const stmt=fixture.db.prepare(sql);if(!sql.includes("SET paid_email_status = 'sending'"))return stmt;
    return {bind(...values){return {async run(){if(!changed){changed=true;await fixture.db.prepare("UPDATE orders SET status='estornado' WHERE order_number=?").bind(s.order.order_number).run();}return stmt.bind(...values).run();}};}};}};
  await assert.rejects(s.notify(s.send,db));assert.equal(s.calls.length,0);assert.equal((await s.row()).status,'estornado');
});
