const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { createHmac, randomUUID } = require('node:crypto');
const { load, databaseFixture, contact } = require('./helpers/orders.cjs');
const { OrderStore } = load('src/lib/order-store.ts');
const lib = load('src/lib/payment-webhook.ts');
const emailLib = load('src/lib/paid-order-email.ts');
const orderLib = load('src/lib/order-webhook.ts', { './payment-webhook': lib });
let fixture, counter = 1000;
before(async () => { fixture = await databaseFixture(); });
after(async () => { await fixture?.close(); });

function signed(paymentId, changes = {}) {
  const requestId = changes.requestId || randomUUID();
  const ts = changes.ts || '1742505638683'; // Old signatures remain safe to retry.
  const signature = createHmac('sha256', 'webhook-test-secret')
    .update(`id:${paymentId.toLowerCase()};request-id:${requestId};ts:${ts};`).digest('hex');
  return new Request(`https://www.flowjesus.com/api/mercadopago/webhook?data.id=${paymentId}&type=${changes.type || 'payment'}${changes.query || ''}`, {
    method: 'POST', headers: { 'x-request-id': requestId, 'x-signature': `ts=${ts},v1=${signature}`, ...changes.headers },
    body: changes.body || '{"status":"approved","data":{"id":"untrusted"}}',
  });
}
function route(env, fetchImpl, vercel = false) {
  return load('src/app/api/mercadopago/webhook/route.ts', {
    '@opennextjs/cloudflare': { getCloudflareContext: () => ({ env }) },
    '@/lib/payment-webhook': {
      ...lib, reconcilePayment: (db, token, paymentId) => lib.reconcilePayment(db, token, paymentId, fetchImpl),
    },
    '@/lib/paid-order-email': { notifyPaidOrder: (db, env, resource) => emailLib.notifyPaidOrder(db, env, resource, fetchImpl) },
    '@/lib/order-webhook': { reconcileOrder: (db, token, resourceId) => orderLib.reconcileOrder(db, token, resourceId, fetchImpl) },
  }, { process: { env: { VERCEL: vercel ? '1' : '0' } }, fetch: fetchImpl });
}
async function scenario(method = 'pix', state = 'pending', attach = true) {
  const store = new OrderStore(fixture.db);
  const number = String(++counter);
  const input = contact();
  const order = await store.create(randomUUID(), 'hash', {
    ...input, items: [{ productId: 'test', name: 'Test', color: 'Preto', size: 'M', quantity: 1, unitPriceCents: 10000, subtotalCents: 10000 }],
    subtotalCents: 10000, coupon: '', couponDiscountCents: 0, pixDiscountCents: 0,
    shipping: { serviceId: 1, name: 'PAC', company: 'Correios', amountCents: 1000 }, totalCents: 11000, paymentMethod: method,
  });
  await store.claim(order.order_number);
  const preference = `preference-${number}`;
  if (attach) await store.attachPayment(order.order_number, {
    kind: method === 'pix' ? 'payment' : 'preference', id: method === 'pix' ? number : preference, url: 'https://www.mercadopago.com.br/test',
  });
  const payment = {
    id: Number(number), live_mode: true, external_reference: order.order_number, transaction_amount: 110,
    currency_id: 'BRL', collector_id: 987, payment_method_id: method === 'pix' ? 'pix' : 'visa', status: state,
    date_last_updated: '2026-09-24T12:00:00Z', date_approved: state === 'approved' || state === 'refunded' ? '2026-09-24T11:59:00Z' : null,
    ...(method === 'other' ? { order: { id: 456, type: 'mercadopago' } } : {}),
  };
  const merchant = { id: 456, preference_id: preference, collector: { id: 987 }, external_reference: order.order_number, payments: [{ id: Number(number) }] };
  const account = { id: 987 };
  const calls = [];
  const emails = [];
  const fetchImpl = async (url, options) => {
    if (url === 'https://api.resend.com/emails') {
      assert.equal((await fixture.db.prepare('SELECT status FROM orders WHERE order_number = ?').bind(order.order_number).first()).status, 'pago');
      assert.equal(options.headers.Authorization, 'Bearer resend-test-key');
      emails.push({ url, options, body: JSON.parse(options.body) });
      return Response.json({ id: `email-${number}` });
    }
    calls.push({ url, options });
    assert.equal(options.headers.Authorization, 'Bearer access-test-token');
    assert.equal(options.redirect, 'error');
    assert(!options.method || options.method === 'GET');
    if (url === `https://api.mercadopago.com/v1/payments/${number}`) return Response.json(payment);
    if (url === 'https://api.mercadopago.com/users/me') return Response.json(account);
    if (url === 'https://api.mercadopago.com/merchant_orders/456') return Response.json(merchant);
    throw new Error('Unexpected API request');
  };
  const env = { ORDERS_DB: fixture.db, MERCADOPAGO_ACCESS_TOKEN: 'access-test-token', MERCADOPAGO_WEBHOOK_SECRET: 'webhook-test-secret', RESEND_API_KEY: 'resend-test-key' };
  return { number, order, payment, merchant, account, calls, emails, env, store, preference, fetchImpl,
    post: () => route(env, fetchImpl).POST(signed(number)),
    row: () => fixture.db.prepare('SELECT * FROM orders WHERE order_number = ?').bind(order.order_number).first(),
  };
}

test('signature rejects absent/forged signatures, changed ID/request ID, duplicate query and malformed timestamps', async () => {
  assert.equal(await lib.verifyPaymentSignature(signed('123'), 'webhook-test-secret'), '123');
  for (const request of [
    signed('123', { headers: { 'x-signature': '' } }),
    signed('123', { headers: { 'x-request-id': 'different' } }),
    signed('123', { query: '&data.id=456' }), signed('123', { ts: 'bad' }),
    new Request(signed('123').url.replace('123', '456'), signed('123')),
  ]) assert.equal(await lib.verifyPaymentSignature(request, 'webhook-test-secret'), null);
  assert.equal(await lib.verifyPaymentSignature(signed('123'), 'wrong-secret'), null);
});

test('route fails closed without secrets and does not fetch or write on an invalid signature', async () => {
  const s = await scenario();
  const before = await s.row();
  assert.equal((await route({ ...s.env, MERCADOPAGO_WEBHOOK_SECRET: '' }, s.fetchImpl).POST(signed(s.number))).status, 503);
  assert.equal((await route(s.env, s.fetchImpl).POST(signed(s.number, { headers: { 'x-signature': 'forged' } }))).status, 401);
  assert.equal(s.calls.length, 0);
  assert.deepEqual(await s.row(), before);
  assert.equal(route(s.env, s.fetchImpl).GET, undefined);
});

for (const [provider, expected] of Object.entries({ pending: 'aguardando pagamento', approved: 'pago', rejected: 'cancelado', cancelled: 'cancelado', refunded: 'estornado' })) {
  test(`${provider}: authoritative API state is persisted and duplicate notifications are no-ops`, async () => {
    const s = await scenario('pix', provider);
    assert.equal((await s.post()).status, 200);
    const row = await s.row();
    assert.equal(row.status, expected);
    assert.equal(row.payment_setup_status, 'ready');
    assert.equal(row.mercado_pago_payment_id, s.number);
    assert.equal(row.mercado_pago_preference_id, null);
    assert.equal(row.mercado_pago_status, provider);
    assert.equal(row.mercado_pago_updated_at, '2026-09-24T12:00:00.000Z');
    assert.equal(row.paid_at, ['approved', 'refunded'].includes(provider) ? '2026-09-24T11:59:00.000Z' : null);
    assert.equal((await s.post()).status, 200);
    assert.deepEqual(await s.row(), row);
    assert.equal(s.calls.filter(c => c.url.includes('/v1/payments/')).length, 2);
  });
}

test('Checkout Pro validates merchant order and preserves preference while recording the payment ID', async () => {
  const s = await scenario('other', 'approved');
  assert.equal((await s.post()).status, 200);
  const row = await s.row();
  assert.equal(row.status, 'pago');
  assert.equal(row.mercado_pago_payment_id, s.number);
  assert.equal(row.mercado_pago_preference_id, s.preference);
});

test('mismatched payment fields never alter D1', async () => {
  const s = await scenario('pix', 'approved');
  const original = { ...s.payment }, row = await s.row();
  for (const invalid of [
    { id: 1 }, { live_mode: false }, { transaction_amount: 109.99 }, { transaction_amount: '110' },
    { currency_id: 'USD' }, { collector_id: 123 }, { collector_id: null }, { payment_method_id: 'visa' },
    { date_last_updated: null }, { date_approved: null }, { date_approved: '2026-09-25T00:00:00Z' },
    { external_reference: 'FJ-00000000-0000-4000-8000-000000000000' },
  ]) {
    Object.assign(s.payment, original, invalid);
    assert([409, 503].includes((await s.post()).status));
    assert.deepEqual(await s.row(), row);
  }
});

test('a payment cannot be reassigned to another stored Pix order', async () => {
  const a = await scenario('pix', 'approved'), b = await scenario('pix', 'pending');
  a.payment.external_reference = b.order.order_number;
  const before = await b.row();
  assert.equal((await a.post()).status, 409);
  assert.deepEqual(await b.row(), before);
});

test('merchant preference, account, reference and payment membership must all match', async () => {
  const s = await scenario('other', 'approved');
  const original = { ...s.merchant }, row = await s.row();
  for (const invalid of [{ preference_id: 'foreign' }, { collector: { id: 1 } }, { external_reference: 'foreign' }, { payments: [] }, { id: 99 }]) {
    Object.assign(s.merchant, original, invalid);
    assert.equal((await s.post()).status, 409);
    assert.deepEqual(await s.row(), row);
  }
});

test('stale and regressive snapshots cannot revert paid/refunded orders; refund preserves paid_at', async () => {
  const s = await scenario('pix', 'approved');
  await s.post();
  const paid = await s.row();
  Object.assign(s.payment, { status: 'pending', date_last_updated: '2026-09-24T11:00:00Z', date_approved: null });
  assert.equal((await s.post()).status, 200);
  assert.deepEqual(await s.row(), paid);
  s.payment.date_last_updated = '2026-09-24T13:00:00Z';
  assert.equal((await s.post()).status, 200);
  assert.deepEqual(await s.row(), paid);
  s.payment.status = 'refunded';
  assert.equal((await s.post()).status, 200);
  const refunded = await s.row();
  assert.equal(refunded.status, 'estornado');
  assert.equal(refunded.paid_at, paid.paid_at);
  Object.assign(s.payment, { status: 'approved', date_last_updated: '2026-09-24T14:00:00Z', date_approved: paid.paid_at });
  assert.equal((await s.post()).status, 200);
  assert.deepEqual(await s.row(), refunded);
});

test('approved Checkout Pro attempt can replace a failed one but another attempt cannot replace a paid order', async () => {
  const s = await scenario('other', 'approved');
  await fixture.db.prepare("UPDATE orders SET mercado_pago_payment_id = '12', status = 'cancelado' WHERE order_number = ?").bind(s.order.order_number).run();
  assert.equal((await s.post()).status, 200);
  assert.equal((await s.row()).mercado_pago_payment_id, s.number);
  await fixture.db.prepare("UPDATE orders SET mercado_pago_payment_id = '13' WHERE order_number = ?").bind(s.order.order_number).run();
  const paid = await s.row();
  assert.equal((await s.post()).status, 200);
  assert.deepEqual(await s.row(), paid);
});

test('refund of a successful Pro attempt recovers even when its approval notification was missed', async () => {
  const s = await scenario('other', 'refunded');
  await fixture.db.prepare("UPDATE orders SET mercado_pago_payment_id = '14', status = 'cancelado' WHERE order_number = ?").bind(s.order.order_number).run();
  assert.equal((await s.post()).status, 200);
  const row = await s.row();
  assert.equal(row.status, 'estornado');
  assert.equal(row.mercado_pago_payment_id, s.number);
  assert.equal(row.paid_at, '2026-09-24T11:59:00.000Z');
});

for (const method of ['pix', 'other']) test(`webhook before checkout attachment recovers ${method} without erasing financial fields`, async () => {
  const s = await scenario(method, 'approved', false);
  await s.store.requireReview(s.order.order_number);
  assert.equal((await s.post()).status, 200);
  const paid = await s.row();
  await s.store.attachPayment(s.order.order_number, { kind: method === 'pix' ? 'payment' : 'preference', id: method === 'pix' ? s.number : s.preference, url: 'https://www.mercadopago.com.br/recovered' });
  const row = await s.row();
  assert.equal(row.status, 'pago');
  assert.equal(row.paid_at, paid.paid_at);
  assert.equal(row.mercado_pago_payment_id, s.number);
  assert.equal(row.mercado_pago_preference_id, method === 'pix' ? null : s.preference);
});

test('concurrent notifications converge after retry without duplicate or lost data', async () => {
  const s = await scenario('pix', 'approved');
  const results = await Promise.all([s.post(), s.post(), s.post()]);
  assert(results.every(r => [200, 503].includes(r.status)));
  assert(results.some(r => r.status === 200));
  const row = await s.row();
  assert.equal(row.status, 'pago');
  assert.equal((await s.post()).status, 200);
  assert.deepEqual(await s.row(), row);
});

test('a slow pending handler cannot overwrite a concurrently committed approval', async () => {
  const s = await scenario('pix', 'pending');
  let release, reached;
  const blocked = new Promise(resolve => { release = resolve; });
  const waiting = new Promise(resolve => { reached = resolve; });
  const delayedFetch = async (url, options) => {
    if (url.endsWith('/users/me')) { reached(); await blocked; }
    return s.fetchImpl(url, options);
  };
  const slow = route(s.env, delayedFetch).POST(signed(s.number));
  await waiting;
  Object.assign(s.payment, { status: 'approved', date_last_updated: '2026-09-24T13:00:00Z', date_approved: '2026-09-24T12:59:00Z' });
  assert.equal((await s.post()).status, 200);
  release();
  assert.equal((await slow).status, 503);
  assert.equal((await s.row()).status, 'pago');
  assert.equal((await s.post()).status, 200);
});

test('failed D1 update keeps the order untouched and a later notification recovers it', async () => {
  const s = await scenario('pix', 'approved');
  const before = await s.row();
  const db = { prepare(sql) {
    if (sql.startsWith('UPDATE orders')) throw new Error('private-write-error');
    return fixture.db.prepare(sql);
  } };
  assert.equal((await route({ ...s.env, ORDERS_DB: db }, s.fetchImpl).POST(signed(s.number))).status, 503);
  assert.deepEqual(await s.row(), before);
  assert.equal((await s.post()).status, 200);
  assert.equal((await s.row()).status, 'pago');
});

test('provider and D1 failures request a retry and never expose credentials or exception details', async () => {
  const s = await scenario('pix', 'approved');
  const row = await s.row();
  for (const fetchImpl of [async () => { throw new Error('private-token'); }, async () => Response.json({ secret: 'private-token' }, { status: 500 }), async () => new Response('invalid-json')]) {
    const response = await route(s.env, fetchImpl).POST(signed(s.number));
    assert.equal(response.status, 503);
    assert.equal(await response.text(), '{"received":false}');
    assert.deepEqual(await s.row(), row);
  }
  const brokenDb = { prepare: () => { throw new Error('private-database'); } };
  const response = await route({ ...s.env, ORDERS_DB: brokenDb }, s.fetchImpl).POST(signed(s.number));
  assert.equal(response.status, 503);
  assert.equal(await response.text(), '{"received":false}');
});

test('legacy/unhandled payments are acknowledged without writing orders', async () => {
  const s = await scenario();
  const row = await s.row();
  s.payment.status = 'in_process';
  assert.equal((await s.post()).status, 200);
  s.payment.external_reference = 'legacy-reference';
  assert.equal((await s.post()).status, 200);
  assert.deepEqual(await s.row(), row);
});

test('Vercel proxy preserves signed query/headers, discards body, and propagates retry status safely', async () => {
  const request = signed('123');
  for (const status of [200, 401, 409, 503]) {
    const handler = route({}, async (url, options) => {
      assert.equal(url, 'https://flow-jesus.flowjesusoficial.workers.dev/api/mercadopago/webhook?data.id=123&type=payment');
      assert.equal(options.headers['x-signature'], request.headers.get('x-signature'));
      assert.equal(options.headers['x-request-id'], request.headers.get('x-request-id'));
      assert.equal(options.body, undefined);
      return new Response('private-provider-details', { status });
    }, true);
    const response = await handler.POST(request);
    assert.equal(response.status, status);
    assert(! (await response.text()).includes('private'));
  }
});

async function orderScenario(state = 'processed') {
  const s = await scenario('pix', 'pending', false);
  const orderId = `ORD${s.number.padStart(26, '0')}`;
  const paymentId = `PAY${s.number.padStart(26, '0')}`;
  const remote = {
    id: orderId, type: 'online', external_reference: s.order.order_number,
    user_id: '987', currency: 'BRL', country_code: 'BR', total_amount: '110.00', total_paid_amount: '110.00',
    status: state, status_detail: state === 'processed' ? 'accredited' : state,
    last_updated_date: '2026-09-24T12:00:00.123456789Z',
    transactions: { payments: [{ id: paymentId, amount: '110.00', status: 'processed', status_detail: 'accredited', payment_method: { id: 'pix' } }],
      refunds: [{ id: 'REF-test', transaction_id: paymentId, amount: '110.00', status: 'processed' }] },
  };
  const fetchImpl = async (url, options) => {
    if (url === 'https://api.resend.com/emails') return s.fetchImpl(url, options);
    assert.equal(options.headers.Authorization, 'Bearer access-test-token');
    assert.equal(options.redirect, 'error');
    assert(!options.method || options.method === 'GET');
    if (url === `https://api.mercadopago.com/v1/orders/${orderId}`) return Response.json(remote);
    if (url === 'https://api.mercadopago.com/users/me') return Response.json(s.account);
    throw new Error('Unexpected URL; Orders IDs must never reach Payments API');
  };
  return { ...s, remote, orderId, paymentId, fetchImpl,
    post: () => route(s.env, fetchImpl).POST(signed(orderId, { type: 'order' })) };
}

test('Order signatures normalize alphanumeric IDs to lowercase and retain the API ID', async () => {
  const resource = 'ORD01JQ4S4KY8HWQ6NA5PXB65B3D3';
  assert.equal(await lib.verifyPaymentSignature(signed(resource, { type: 'order' }), 'webhook-test-secret'), resource);
  assert.equal(await lib.verifyPaymentSignature(signed(resource.toLowerCase(), { type: 'order' }), 'webhook-test-secret'), resource);
});

for (const [state, status] of Object.entries({ created: 'aguardando pagamento', processing: 'aguardando pagamento', action_required: 'aguardando pagamento', processed: 'pago', failed: 'cancelado', canceled: 'cancelado', expired: 'cancelado', refunded: 'estornado' })) {
  test(`Order ${state}: authoritative API reconciliation and duplicate delivery`, async () => {
    const s = await orderScenario(state);
    assert.equal((await s.post()).status, 200);
    const row = await s.row();
    assert.equal(row.status, status);
    assert.equal(row.mercado_pago_order_id, s.orderId);
    assert.equal(row.mercado_pago_payment_id, s.paymentId);
    assert.equal(row.mercado_pago_preference_id, null);
    assert.equal(row.payment_setup_status, 'ready');
    assert.equal(row.paid_at, status === 'pago' ? '2026-09-24T12:00:00.123Z' : null);
    assert.equal((await s.post()).status, 200);
    assert.deepEqual(await s.row(), row);
  });
}

test('Order validates receiver, amount, currency, production account and full accreditation', async () => {
  const s = await orderScenario();
  const original = structuredClone(s.remote), row = await s.row();
  for (const change of [{ id: 'wrong' }, { user_id: '1' }, { total_amount: '1.10' }, { total_amount: 110 },
    { currency: 'USD' }, { total_paid_amount: '50.00' }, { status_detail: 'pending' }, { live_mode: false },
    { country_code: 'AR' }, { transactions: { payments: [] } }, { last_updated_date: 'invalid' },
    { transactions: { payments: [original.transactions.payments[0], original.transactions.payments[0]] } }]) {
    Object.assign(s.remote, original, change);
    assert.equal((await s.post()).status, 409);
    assert.deepEqual(await s.row(), row);
  }
  Object.assign(s.remote, original);
  s.account.tags = ['test_user'];
  assert.equal((await s.post()).status, 409);
  assert.deepEqual(await s.row(), row);
});

test('Order cannot overwrite a Payments API ID or an unrelated preference', async () => {
  const s = await orderScenario();
  await s.store.attachPayment(s.order.order_number, { kind: 'payment', id: s.number, url: 'https://www.mercadopago.com.br/test' });
  const row = await s.row();
  assert.equal((await s.post()).status, 409);
  assert.deepEqual(await s.row(), row);
  const other = await orderScenario();
  await other.store.attachPayment(other.order.order_number, { kind: 'preference', id: 'foreign-pref', url: 'https://www.mercadopago.com.br/test' });
  assert.equal((await other.post()).status, 409);
});

test('Order accepts full refunded detail, preserves paid_at, rejects partial refunds and stale regressions', async () => {
  const s = await orderScenario();
  await s.post();
  const paid = await s.row();
  s.remote.status_detail = 'refunded';
  s.remote.last_updated_date = '2026-09-24T13:00:00Z';
  s.remote.transactions.refunds[0].amount = '50.00';
  assert.equal((await s.post()).status, 409);
  assert.deepEqual(await s.row(), paid);
  s.remote.transactions.refunds[0].amount = '110.00';
  assert.equal((await s.post()).status, 200);
  const refunded = await s.row();
  assert.equal(refunded.status, 'estornado');
  assert.equal(refunded.paid_at, paid.paid_at);
  s.remote.status = 'processing';
  s.remote.last_updated_date = '2026-09-24T11:00:00Z';
  assert.equal((await s.post()).status, 200);
  assert.deepEqual(await s.row(), refunded);
});

test('Order concurrent notifications converge and provider failures return retryable errors', async () => {
  const s = await orderScenario();
  const responses = await Promise.all([s.post(), s.post()]);
  assert(responses.every(response => [200, 503].includes(response.status)));
  assert.equal((await s.post()).status, 200);
  assert.equal((await s.row()).status, 'pago');
  const response = await route(s.env, async () => { throw new Error('private-provider-data'); }).POST(signed(s.orderId, { type: 'order' }));
  assert.equal(response.status, 503);
  assert.equal(await response.text(), '{"received":false}');
});

test('Vercel forwards an Order to the Worker with the original signature and processes it end to end', async () => {
  const s = await orderScenario();
  const worker = route(s.env, s.fetchImpl);
  const proxy = route({}, async (url, options) => worker.POST(new Request(url, options)), true);
  assert.equal((await proxy.POST(signed(s.orderId, { type: 'order' }))).status, 200);
  assert.equal((await s.row()).status, 'pago');
  assert.equal((await worker.POST(signed(s.orderId, { type: 'payment' }))).status, 400);
  assert.equal((await worker.POST(signed('123', { type: 'order' }))).status, 400);
});

test('Order updates within the same millisecond retain provider precision', async () => {
  const s = await orderScenario('processing');
  assert.equal((await s.post()).status, 200);
  s.remote.status = 'processed';
  s.remote.status_detail = 'accredited';
  s.remote.last_updated_date = '2026-09-24T12:00:00.123456790Z';
  assert.equal((await s.post()).status, 200);
  const row = await s.row();
  assert.equal(row.status, 'pago');
  assert.equal(row.mercado_pago_order_updated_at, s.remote.last_updated_date);
});

for (const method of ['pix', 'other']) test(`paid ${method} webhook sends one email across repeated and concurrent deliveries`, async () => {
  const s = await scenario(method, 'approved');
  await Promise.all([s.post(), s.post(), s.post()]);
  assert.equal((await s.post()).status, 200);
  assert.equal(s.emails.length, 1);
  const row = await s.row();
  assert.equal(row.paid_email_status, 'sent');
  assert.equal(row.paid_email_resend_id, `email-${s.number}`);
  assert.deepEqual(s.emails[0].body.to, ['flowjesusoficial@gmail.com']);
  assert.match(s.emails[0].body.text, /Transportadora: Correios/);
});

test('Order webhook sends once and Vercel retries do not duplicate the email', async () => {
  const s = await orderScenario();
  const worker = route(s.env, s.fetchImpl);
  const proxy = route({}, async (url, options) => worker.POST(new Request(url, options)), true);
  for (let i = 0; i < 3; i++) assert.equal((await proxy.POST(signed(s.orderId, {type: 'order'}))).status, 200);
  assert.equal(s.emails.length, 1);
});

test('email failure returns retryable 503 after saving paid state and retry recovers unchanged payment', async () => {
  const s = await scenario('pix', 'approved');
  const failed = route(s.env, async (url, options) => url === 'https://api.resend.com/emails'
    ? Response.json({ error: 'private-email-credential' }, {status: 500}) : s.fetchImpl(url, options));
  const response = await failed.POST(signed(s.number));
  assert.equal(response.status, 503);
  assert.equal(await response.text(), '{"received":false}');
  const row = await s.row();
  assert.equal(row.status, 'pago');
  assert.equal(row.paid_email_status, 'pending');
  assert.equal((await s.post()).status, 200);
  assert.equal(s.emails.length, 1);
  assert.equal((await s.row()).paid_at, row.paid_at);
  assert.equal((await s.row()).updated_at, row.updated_at);
});

for (const provider of ['pending', 'rejected', 'cancelled', 'refunded']) test(`${provider} webhook never sends paid email`, async () => {
  const s = await scenario('pix', provider);
  assert.equal((await s.post()).status, 200);
  assert.equal(s.emails.length, 0);
});

test('missing Resend key preserves the confirmation and leaves email pending for retry', async () => {
  const s = await scenario('pix', 'approved');
  assert.equal((await route({...s.env, RESEND_API_KEY: undefined}, s.fetchImpl).POST(signed(s.number))).status, 503);
  assert.equal((await s.row()).status, 'pago');
  assert.equal((await s.row()).paid_email_first_attempt_ms, null);
  assert.equal(s.emails.length, 0);
  assert.equal((await s.post()).status, 200);
});

test('Checkout Pro paid with Pix links the existing preference and sends one complete administrative email', async () => {
  const s = await scenario('other', 'approved');
  // Mirrors a buyer choosing Pix inside Checkout Pro, rather than direct Pix.
  s.payment.payment_method_id = 'pix';
  assert.equal((await s.row()).mercado_pago_payment_id, null);
  const worker = route(s.env, s.fetchImpl);
  const proxy = route({}, (url, options) => worker.POST(new Request(url, options)), true);
  for (let i = 0; i < 3; i++) assert.equal((await proxy.POST(signed(s.number))).status, 200);
  const row = await s.row();
  assert.equal(row.status, 'pago');
  assert.equal(row.paid_at, '2026-09-24T11:59:00.000Z');
  assert.equal(row.mercado_pago_payment_id, s.number);
  assert.equal(row.mercado_pago_preference_id, s.preference);
  assert.equal(row.paid_email_status, 'sent');
  assert.equal(s.emails.length, 1);
  assert.deepEqual(s.emails[0].body.to, ['flowjesusoficial@gmail.com']);
  for (const text of ['PRODUTOS', 'Test', 'Cor: Preto', 'Tamanho: M', 'Quantidade: 1',
    'Cliente: Cliente Teste', 'Frete: R$ 10,00', 'Total: R$ 110,00']) {
    assert(s.emails[0].body.text.replace(/\u00a0/g, ' ').includes(text), text);
  }
});

test('diagnostics identify Resend HTTP rejection and retry without logging private bodies or credentials', async context => {
  const entries = [];
  context.mock.method(console, 'info', (...entry) => entries.push(entry));
  const s = await scenario('pix', 'approved');
  const failed = route(s.env, async (url, options) => url === 'https://api.resend.com/emails'
    ? Response.json({message: 'private-provider-body'}, {status: 403}) : s.fetchImpl(url, options));
  assert.equal((await failed.POST(signed(s.number))).status, 503);
  assert(entries.some(([tag, data]) => tag === 'flowjesus_payment' && data.stage === 'order_updated' && data.status === 'pago'));
  assert(entries.some(([tag, data]) => tag === 'flowjesus_paid_email' && data.event === 'resend_response' && data.status === 403));
  assert(entries.some(([tag, data]) => tag === 'flowjesus_paid_email' && data.event === 'attempt_failed_pending'));
  const failedOrder = await s.row();
  assert.equal(failedOrder.status, 'pago');
  assert.equal(failedOrder.paid_email_status, 'pending');
  assert.equal((await s.post()).status, 200);
  assert.equal((await s.post()).status, 200);
  assert.equal(s.emails.length, 1);
  assert(entries.some(([tag, data]) => tag === 'flowjesus_paid_email' && data.event === 'sent_recorded'));
  assert(entries.some(([tag, data]) => tag === 'flowjesus_paid_email' && data.event === 'skipped_already_sent'));
  assert.doesNotMatch(JSON.stringify(entries), /private-|access-test-token|webhook-test-secret|resend-test-key|test@example.com|Cliente Teste|Avenida Teste/);
});
