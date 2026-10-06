const {test, before, beforeEach, after} = require('node:test');
const assert = require('node:assert/strict');
const {randomUUID} = require('node:crypto');
const {load, databaseFixture, contact} = require('./helpers/orders.cjs');
const {OrderStore} = load('src/lib/order-store.ts');
const payment = load('src/lib/payment-webhook.ts');
const order = load('src/lib/order-webhook.ts', {'./payment-webhook': payment});
const email = load('src/lib/paid-order-email.ts');
const {recoverPayments} = load('src/lib/payment-recovery.ts', {
  './payment-webhook': payment, './order-webhook': order, './paid-order-email': email,
});
let fixture, counter = 200000;
const start = Date.parse('2026-10-06T00:00:00Z');
before(async () => {fixture = await databaseFixture();});
beforeEach(async () => {await fixture.db.prepare('DELETE FROM orders').run();});
after(async () => {await fixture?.close();});
async function scenario(method = 'pix', state = 'approved') {
  const store = new OrderStore(fixture.db);
  const saved = await store.create(randomUUID(), 'hash', {
    ...contact(), items: [{productId:'test', name:'Camiseta Teste', color:'Preto', size:'M', quantity:1, unitPriceCents:9900, subtotalCents:9900}],
    subtotalCents:9900, coupon:'FLOW10', couponDiscountCents:990, pixDiscountCents:495,
    shipping:{mode:'pickup', serviceId:0, name:'Retirada no local — Grátis', company:null, amountCents:0},
    totalCents:8415, paymentMethod:method,
  });
  const id = String(++counter), preference = `pref-${id}`;
  await store.claim(saved.order_number);
  await store.attachPayment(saved.order_number, {kind:method === 'pix' ? 'payment' : 'preference', id:method === 'pix' ? id : preference, url:'https://www.mercadopago.com.br/test'});
  await fixture.db.prepare('UPDATE orders SET created_at = ? WHERE order_number = ?').bind('2026-10-03T17:36:33.092Z', saved.order_number).run();
  const remote = {id:Number(id), live_mode:true, external_reference:saved.order_number, transaction_amount:84.15,
    currency_id:'BRL', collector_id:987, payment_method_id:'pix', status:state,
    date_last_updated:'2026-10-03T17:37:16Z', date_approved:state === 'approved' ? '2026-10-03T17:37:12Z' : null,
    ...(method === 'other' ? {order:{id:456, type:'mercadopago'}} : {}),
  };
  const sends = [], calls = [];
  let time = start, rejectEmail = false;
  const env = {ORDERS_DB:fixture.db, MERCADOPAGO_ACCESS_TOKEN:'test-token', RESEND_API_KEY:'test-email', ORDER_RECOVERY_START_AT:'2026-10-03T00:00:00Z'};
  const fetchImpl = async (url, options) => {
    calls.push(url);
    if (url === 'https://api.resend.com/emails') {
      assert.equal((await row()).status, 'pago');
      if (rejectEmail) return Response.json({}, {status:503});
      sends.push(JSON.parse(options.body));
      assert.equal(options.headers['Idempotency-Key'], `flowjesus-paid-order/${saved.order_number}`);
      return Response.json({id:'resend-test'});
    }
    assert.equal(options.headers.Authorization, 'Bearer test-token');
    assert(!options.method || options.method === 'GET');
    if (url.includes('/payments/search?')) {
      assert.equal(new URL(url).searchParams.get('external_reference'), saved.order_number);
      return Response.json({results:[remote]});
    }
    if (url.endsWith(`/v1/payments/${id}`)) return Response.json(remote);
    if (url.endsWith('/users/me')) return Response.json({id:987});
    if (url.endsWith('/merchant_orders/456')) return Response.json({id:456, preference_id:preference, collector:{id:987}, external_reference:saved.order_number, payments:[{id:Number(id)}]});
    throw new Error('Unexpected request');
  };
  const row = () => fixture.db.prepare('SELECT * FROM orders WHERE order_number = ?').bind(saved.order_number).first();
  return {saved, id, remote, sends, calls, env, fetchImpl, row,
    run: (fetcher = fetchImpl) => recoverPayments(env, fetcher, () => time),
    advance: () => {time += 120000;}, failEmail: value => {rejectEmail = value;}};
}
for (const method of ['pix','other']) test(`${method}: missing webhook recovers paid order and complete email exactly once`, async () => {
  const s = await scenario(method);
  await Promise.all([s.run(), s.run()]);
  s.advance(); await s.run();
  const row = await s.row();
  assert.equal(row.status, 'pago'); assert.equal(row.paid_at, '2026-10-03T17:37:12.000Z');
  assert.equal(row.paid_email_status, 'sent'); assert.equal(s.sends.length, 1);
  assert.deepEqual(s.sends[0].to, ['flowjesusoficial@gmail.com']);
  const text = s.sends[0].text.replace(/\u00a0/g,' ');
  for (const part of ['Camiseta Teste','Cor: Preto','Tamanho: M','Quantidade: 1','Cliente: Cliente Teste','Frete: R$ 0,00','Total: R$ 84,15']) assert(text.includes(part),part);
  // A later real webhook shares the same durable deduplication.
  await payment.reconcilePayment(fixture.db, 'test-token', s.id, s.fetchImpl);
  await email.notifyPaidOrder(fixture.db, s.env, {type:'payment',id:s.id},s.fetchImpl);
  assert.equal(s.sends.length, 1);
});
test('Resend failure keeps payment paid and next cron retries without webhook delivery', async () => {
  const s = await scenario(); s.failEmail(true); await s.run();
  assert.equal((await s.row()).status,'pago'); assert.equal((await s.row()).paid_email_status,'pending');
  s.failEmail(false); s.advance(); await s.run();
  assert.equal((await s.row()).paid_email_status,'sent'); assert.equal(s.sends.length,1);
});
test('pending or mismatched provider state never sends an email', async () => {
  const s = await scenario('pix','pending'); await s.run();
  assert.equal((await s.row()).status,'aguardando pagamento'); assert.equal(s.sends.length,0);
  s.remote.status='approved'; s.remote.date_approved='2026-10-03T17:37:12Z'; s.remote.transaction_amount=1;
  s.advance(); await s.run(); assert.equal((await s.row()).status,'aguardando pagamento'); assert.equal(s.sends.length,0);
});
test('older purchases and uncertain emails are excluded from automatic recovery', async () => {
  const s = await scenario();
  await fixture.db.prepare("UPDATE orders SET created_at = '2026-09-29T00:00:00Z'").run();
  await s.run(); assert.equal(s.calls.length,0);
  await fixture.db.prepare("UPDATE orders SET created_at = '2026-10-03T00:00:00Z', paid_email_status = 'review_required'").run();
  s.advance(); await s.run(); assert.equal(s.calls.length,0);
});
test('an expired email idempotency window is never resent', async () => {
  const s = await scenario();
  await fixture.db.prepare('UPDATE orders SET paid_email_first_attempt_ms = ?').bind(start-24*3600000).run();
  await s.run(); assert.equal((await s.row()).status,'pago');
  assert.equal((await s.row()).paid_email_status,'review_required'); assert.equal(s.sends.length,0);
});
test('search ambiguity and search failures never confirm or send', async () => {
  const s = await scenario('other');
  await s.run(async (url, options) => url.includes('/search?') ? Response.json({results:[s.remote,s.remote]}) : s.fetchImpl(url, options));
  assert.equal((await s.row()).status,'aguardando pagamento'); assert.equal(s.sends.length,0);
  s.advance(); await s.run(async () => new Response('',{status:503}));
  assert.equal((await s.row()).status,'aguardando pagamento');
});
test('bounded batches rotate past failed checks without starving other orders', async () => {
  for(let i=0;i<6;i++) await scenario();
  const env={ORDERS_DB:fixture.db,MERCADOPAGO_ACCESS_TOKEN:'test',ORDER_RECOVERY_START_AT:'2026-10-03T00:00:00Z'};
  const called = [];
  const fetcher = async url => {called.push(url); throw new Error('offline');};
  await recoverPayments(env,fetcher,()=>start);
  assert.equal(called.length,5);
  await recoverPayments(env,fetcher,()=>start);
  assert.equal(new Set(called).size,6);
});
