const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const { databaseFixture, contact } = require('./helpers/orders.cjs');
let fixture, paymentId = 100;
before(async () => { fixture = await databaseFixture(); });
after(async () => { await fixture?.close(); });

function load(file, dependencies, globals = {}) {
  const compiled = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  const exports = {};
  new Function('exports', 'require', ...Object.keys(globals), compiled.outputText)(
    exports, (name) => dependencies[name], ...Object.values(globals),
  );
  return exports;
}

const catalog = load('src/data/products.ts', {});
function setup(vercel = false, catalogOverride = catalog, shippingPrice = 24.9, overrides = {}) {
  const calls = [];
  const { POST } = load('src/app/api/orders/checkout/route.ts', {
    'next/server': { NextResponse: { json: (body, init) => Response.json(body, init) } },
    '@opennextjs/cloudflare': { getCloudflareContext: () => ({ env: { MERCADOPAGO_ACCESS_TOKEN: 'test-token', ORDERS_DB: 'db' in overrides ? overrides.db : fixture.db } }) },
    '@/data/products': catalogOverride,
    '@/lib/order-input': load('src/lib/order-input.ts', {}),
    '@/lib/order-store': load('src/lib/order-store.ts', {}, { crypto: require('node:crypto').webcrypto }),
    '@/lib/pricing': load('src/lib/pricing.ts', {}),
    '@/lib/pix-payment': { createPixPayment: (token, input) => load('src/lib/pix-payment.ts', {}, {
      crypto: require('node:crypto').webcrypto,
    }).createPixPayment(token, input, async (url, options) => {
      const body = JSON.parse(options.body);
      calls.push({ url, options, body });
      if (overrides.onPayment) await overrides.onPayment(body);
      return Response.json({ id: ++paymentId, payment_method_id: 'pix', currency_id: 'BRL', transaction_amount: body.transaction_amount,
        status: 'pending', status_detail: 'pending_waiting_transfer',
        point_of_interaction: { transaction_data: { qr_code: 'test-qr', ticket_url: 'https://www.mercadopago.com.br/payments/1/ticket' } },
      });
    }) },
  }, {
    process: { env: vercel ? { VERCEL: '1' } : {} },
    crypto: require('node:crypto').webcrypto,
    fetch: async (url, options) => {
      if (url.endsWith('/quote')) return Response.json({ services: [{ id: 1, price: shippingPrice, name: 'PAC', company: 'Correios' }] });
      calls.push({ url, options, body: JSON.parse(options.body) });
      if (overrides.onPayment) await overrides.onPayment(JSON.parse(options.body));
      return Response.json(vercel ? (overrides.proxyResponse ?? { order_number: 'FJ-test', checkout_url: 'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=test' }) :
        { id: `preference-${++paymentId}`, init_point: 'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=test' });
    },
  });
  return { calls, post: (body) => POST(new Request('https://example.com/api/orders/checkout', {
    method: 'POST', body: JSON.stringify(body),
  })) };
}

function order(qty, shipping, coupon = '') {
  const discountCents = coupon === 'FLOW10' ? qty * 990 : 0;
  return {
    ...contact(),
    items: [{ productId: 'flow-70x7', size: 'M', color: 'Preto', qty }],
    shipping: { amountCents: shipping, serviceId: 1, postalCode: '01310100' }, coupon, discountCents,
    totalCents: qty * 9900 - discountCents + shipping,
  };
}

for (const [qty, shipping, coupon] of [[1, 2490, ''], [2, 1737, 'FLOW10'], [3, 0, 'FLOW10'], [1, 3490, '']]) {
  test(`preference matches cart: qty=${qty}, shipping=${shipping}, coupon=${coupon}`, async () => {
    const { post, calls } = setup(false, catalog, shipping / 100);
    const body = order(qty, shipping, coupon);
    const response = await post(body);
    assert.equal(response.status, 200);
    assert.match((await response.json()).checkout_url, /^https:\/\/www.mercadopago.com.br\//);
    const items = calls[0].body.items;
    assert.equal(items.reduce((sum, item) => sum + Math.round(item.unit_price * 100) * item.quantity, 0), body.totalCents);
    assert.equal(items.filter(item => item.id === 'flow-70x7').reduce((sum, item) => sum + item.quantity, 0), qty);
    assert.equal(calls[0].options.headers.Authorization, 'Bearer test-token');
  });
}

test('rounding preserves exact cents across quantities and different products', async () => {
  const modified = { products: catalog.products.map((p, i) => ({ ...p, price: i === 0 ? 99.99 : 79.93 })) };
  const { post, calls } = setup(false, modified, 17.83);
  const body = order(3, 1783, 'FLOW10');
  body.items.push({ productId: modified.products[1].id, size: 'P', color: 'Preto', qty: 2 });
  const subtotal = 9999 * 3 + 7993 * 2;
  body.discountCents = Math.round(subtotal / 10);
  body.totalCents = subtotal - body.discountCents + 1783;
  assert.equal((await post(body)).status, 200);
  assert.equal(calls[0].body.items.reduce((sum, item) => sum + Math.round(item.unit_price * 100) * item.quantity, 0), body.totalCents);
});

test('rejects invalid totals, discounts, shipping and products before calling Mercado Pago', async () => {
  for (const change of [
    { totalCents: 1 }, { discountCents: 9900 }, { coupon: 'FREE' },
    { shipping: { amountCents: -1 } }, { shipping: { amountCents: 1.5 } },
    { items: [{ productId: 'missing', size: 'M', color: 'Preto', qty: 1 }] },
  ]) {
    const { post, calls } = setup();
    assert.equal((await post({ ...order(1, 2490), ...change })).status, 400);
    assert.equal(calls.length, 0);
  }
});

test('Vercel forwards the cart to the existing Worker without credentials', async () => {
  const { post, calls } = setup(true);
  const body = order(2, 1737, 'FLOW10');
  assert.equal((await post(body)).status, 200);
  assert.equal(calls[0].url, 'https://flow-jesus.flowjesusoficial.workers.dev/api/orders/checkout');
  assert.deepEqual(calls[0].body, body);
  assert.equal(calls[0].options.headers.Authorization, undefined);
});

test('rejects legacy fixed shipping checkout requests', async () => {
  const { post } = setup();
  assert.equal((await post({ items: order(1, 0).items, shipping: 'normal' })).status, 400);
});

 test('rejects changed prices and unavailable services before payment', async () => {
  for (const shipping of [ { amountCents: 100, serviceId: 1, postalCode: '01310100' }, { amountCents: 2490, serviceId: 99, postalCode: '01310100' } ]) {
    const { post, calls } = setup();
    const body = order(1, shipping.amountCents);
    body.shipping = shipping;
    assert.equal((await post(body)).status, 409);
    assert.equal(calls.length, 0);
  }
});

function pixOrder(qty, shipping, coupon = '') {
  const body = order(qty, shipping, coupon);
  const pixDiscount = Math.round(qty * 9900 / 20);
  return { ...body, paymentMethod: 'pix',
    discountCents: body.discountCents + pixDiscount, totalCents: body.totalCents - pixDiscount };
}

for (const [qty, shipping, coupon] of [[1, 1266, ''], [2, 1737, ''], [100, 5000, ''], [3, 0, 'FLOW10']]) {
  test(`PIX charges discounted products plus full shipping: ${qty}, ${shipping}, ${coupon}`, async () => {
    const { post, calls } = setup(false, catalog, shipping / 100);
    const body = pixOrder(qty, shipping, coupon);
    assert.equal((await post(body)).status, 200);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, 'https://api.mercadopago.com/v1/payments');
    assert.equal(calls[0].body.payment_method_id, 'pix');
    assert.equal(Math.round(calls[0].body.transaction_amount * 100), body.totalCents);
    assert.equal(calls[0].body.payer.email, body.customer.email);
  });
}

test('PIX mixed products round the subtotal once, not the unit discount', async () => {
  const modified = { products: catalog.products.map((p, i) => ({ ...p, price: i === 0 ? 99.99 : 79.93 })) };
  const { post, calls } = setup(false, modified, 12.66);
  const body = pixOrder(3, 1266);
  body.items.push({ productId: modified.products[1].id, size: 'P', color: 'Preto', qty: 2 });
  const subtotal = 9999 * 3 + 7993 * 2;
  body.discountCents = Math.round(subtotal / 20);
  body.totalCents = subtotal - body.discountCents + 1266;
  assert.equal((await post(body)).status, 200);
  assert.equal(Math.round(calls[0].body.transaction_amount * 100), body.totalCents);
});

test('rejects forged PIX discounts, discount on freight, missing payer and invalid method', async () => {
  const body = pixOrder(1, 1266);
  for (const change of [
    { paymentMethod: 'other' }, { paymentMethod: 'card' }, { customer: { ...body.customer, email: '' } },
    { customer: { ...body.customer, email: 'not-an-email' } }, { checkoutRequestId: undefined },
    { discountCents: 0, totalCents: 11166 },
    { discountCents: 558, totalCents: 10608 },
  ]) {
    const { post, calls } = setup(false, catalog, 12.66);
    assert.equal((await post({ ...body, ...change })).status, 400);
    assert.equal(calls.length, 0);
  }
});

test('other methods preserve items and freight while linking the order without PIX restrictions', async () => {
  const { post, calls } = setup();
  assert.equal((await post({ ...order(1, 2490), paymentMethod: 'other' })).status, 200);
  assert.deepEqual(Object.keys(calls[0].body), ['items', 'external_reference', 'payer']);
  assert.equal(calls[0].body.items[0].unit_price, 99);
  assert.equal(calls[0].body.items[1].unit_price, 24.9);
});

test('PIX discount works across every catalog product and different quantities', async () => {
  for (const product of catalog.products) {
    for (const qty of [1, 2, 7, 100]) {
      const { post, calls } = setup(false, catalog, 12.66);
      const subtotal = Math.round(product.price * 100) * qty;
      const discount = Math.round(subtotal / 20);
      const body = { ...pixOrder(1, 1266),
        items: [{productId: product.id, size: product.sizes[0], color: product.colors[0].name, qty}],
        discountCents: discount, totalCents: subtotal - discount + 1266,
      };
      assert.equal((await post(body)).status, 200, `${product.id} x ${qty}`);
      assert.equal(Math.round(calls[0].body.transaction_amount * 100), body.totalCents);
    }
  }
});

test('PIX preserves the full verified freight with the existing coupon', async () => {
  const { post, calls } = setup(false, catalog, 12.66);
  assert.equal((await post(pixOrder(1, 1266, 'FLOW10'))).status, 200);
  // R$99 - R$9.90 coupon - R$4.95 PIX + R$12.66 freight.
  assert.equal(calls[0].body.transaction_amount, 96.81);
});

test('PIX cannot be generated when Melhor Envio changes the selected freight', async () => {
  const { post, calls } = setup(false, catalog, 15);
  assert.equal((await post(pixOrder(1, 1266))).status, 409);
  assert.equal(calls.length, 0);
});

test('Vercel forwards all PIX fields and the exact total to the Worker', async () => {
  const { post, calls } = setup(true);
  const body = pixOrder(1, 1266);
  assert.equal((await post(body)).status, 200);
  assert.deepEqual(calls[0].body, body);
  assert.equal(calls[0].body.totalCents, 10671);
  assert.equal(calls[0].options.headers.Authorization, undefined);
});

test('complete order is committed before any Mercado Pago request, for both payment flows', async () => {
  for (const pix of [false, true]) {
    const body = pix ? pixOrder(2, 2490, 'FLOW10') : order(2, 2490, 'FLOW10');
    let savedBeforePayment;
    const { post, calls } = setup(false, catalog, 24.9, { onPayment: async payload => {
      savedBeforePayment = await fixture.db.prepare('SELECT * FROM orders WHERE order_number = ?').bind(payload.external_reference).first();
      assert(savedBeforePayment, 'order must be committed before external request');
      assert.equal(savedBeforePayment.payment_setup_status, 'creating');
      assert.equal(savedBeforePayment.status, 'aguardando pagamento');
    } });
    const response = await post(body);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    const result = await response.json();
    const row = await fixture.db.prepare('SELECT * FROM orders WHERE order_number = ?').bind(result.order_number).first();
    assert.match(row.order_number, /^FJ-[A-F0-9-]{36}$/);
    assert.equal(row.customer_name, body.customer.name);
    assert.equal(row.customer_email, body.customer.email);
    assert.equal(row.customer_phone, '11999998888');
    assert.deepEqual(JSON.parse(row.address_json), body.address);
    const product = catalog.products.find(p => p.id === body.items[0].productId);
    assert.deepEqual(JSON.parse(row.items_json), [{productId:product.id,name:product.name,color:'Preto',size:'M',quantity:2,unitPriceCents:9900,subtotalCents:19800}]);
    assert.equal(row.subtotal_cents, 19800);
    assert.equal(row.coupon_discount_cents, 1980);
    assert.equal(row.pix_discount_cents, pix ? 990 : 0);
    assert.equal(row.shipping_service_id, 1);
    assert.equal(row.shipping_name, 'PAC');
    assert.equal(row.shipping_company, 'Correios');
    assert.equal(row.shipping_cents, 2490);
    assert.equal(row.total_cents, body.totalCents);
    assert.equal(row.payment_method, pix ? 'pix' : 'other');
    assert.equal(row.status, 'aguardando pagamento');
    assert.equal(row.paid_at, null);
    assert.equal(new Date(row.created_at).toISOString(), row.created_at);
    assert.equal(row.created_at, savedBeforePayment.created_at);
    assert.equal(row.payment_setup_status, 'ready');
    assert.equal(row.checkout_url, result.checkout_url);
    assert(row[pix ? 'mercado_pago_payment_id' : 'mercado_pago_preference_id']);
    assert.equal(calls[0].body.external_reference, row.order_number);
    assert.deepEqual(Object.keys(result).sort(), ['checkout_url', 'order_number']);
  }
});

test('missing binding, missing schema, failed insert and failed claim never create a payment', async () => {
  for (const db of [undefined,
    {prepare() { throw new Error('private-storage-error'); }},
    {prepare(sql) { if (sql.startsWith('INSERT')) throw new Error('private-insert-error'); return fixture.db.prepare(sql); }},
    {prepare(sql) { if (sql.includes("SET payment_setup_status = 'creating'")) throw new Error('private-claim-error'); return fixture.db.prepare(sql); }},
  ]) {
    const {post, calls} = setup(false, catalog, 24.9, {db});
    const response = await post(order(1, 2490));
    assert.equal(response.status, 503);
    assert.equal(calls.length, 0);
    assert.doesNotMatch(await response.text(), /private-/);
  }
});

test('malformed contact, incomplete address and a mismatched shipping CEP cannot create an order', async () => {
  const body = order(1, 2490);
  const changes = [
    {customer:undefined}, {address:undefined}, {checkoutRequestId:'invalid'}, {paymentMethod:undefined},
    ...[{name:''},{name:'x'.repeat(121)},{email:'bad'},{phone:'123'},{phone:'abcdefghijk'},{name:'Test\nInjected'}].map(change => ({customer:{...body.customer,...change}})),
    ...['street','number','neighborhood','city','state','postalCode'].map(key => ({address:{...body.address,[key]:''}})),
    {address:{...body.address,state:'ZZ'}}, {address:{...body.address,country:'US'}},
    {address:{...body.address,postalCode:'22222222'}},
    {items:[{...body.items[0],size:'XXXL'}]}, {items:[{...body.items[0],color:'missing'}]},
    {items:[{...body.items[0],qty:1.5}]}, {items:[{...body.items[0],qty:0}]},
  ];
  for (const change of changes) {
    const {post,calls} = setup();
    assert.equal((await post({...body,...change})).status, 400, JSON.stringify(change));
    assert.equal(calls.length, 0);
  }
  assert.equal(await fixture.db.prepare('SELECT * FROM orders WHERE checkout_key = ?').bind(body.checkoutRequestId).first(), null);
});

test('client prices, shipping names, status and creation time cannot override authoritative values', async () => {
  const body = order(1, 2490);
  body.items[0].unitPriceCents = 1;
  body.shipping.name = 'Forged shipping';
  body.status = 'pago'; body.created_at = '1999-01-01'; body.order_number = 'FJ-forged';
  const {post} = setup();
  const response = await post(body);
  assert.equal(response.status, 200);
  const result = await response.json();
  const row = await fixture.db.prepare('SELECT * FROM orders WHERE order_number = ?').bind(result.order_number).first();
  assert.equal(row.status, 'aguardando pagamento');
  assert.equal(row.shipping_name, 'PAC');
  assert.equal(JSON.parse(row.items_json)[0].unitPriceCents, 9900);
  assert.notEqual(row.order_number, body.order_number);
  assert.notEqual(row.created_at, body.created_at);
});

test('retries across independent handler instances return the same order without a new charge or quote', async () => {
  for (const pix of [false,true]) {
    const body = pix ? pixOrder(1,2490) : order(1,2490);
    const first = setup();
    const original = await (await first.post(body)).json();
    const retry = setup(false,catalog,99.99);
    const response = await retry.post(body);
    assert.equal(response.status,200);
    assert.deepEqual(await response.json(),original);
    assert.equal(retry.calls.length,0);
    assert.equal((await fixture.db.prepare('SELECT COUNT(*) AS n FROM orders WHERE checkout_key = ?').bind(body.checkoutRequestId).first()).n,1);
    assert.equal((await retry.post({...body,customer:{...body.customer,name:'Different person'}})).status,409);
  }
});

test('concurrent requests persist one order and only one request may initiate payment', async () => {
  const body = order(1,2490);
  const a = setup(), b = setup();
  const responses = await Promise.all([a.post(body), b.post(body)]);
  assert(responses.some(r => r.status === 200));
  assert(responses.every(r => [200,409].includes(r.status)));
  assert.equal(a.calls.length+b.calls.length,1);
  const rows = await fixture.db.prepare('SELECT COUNT(*) AS n FROM orders WHERE checkout_key = ?').bind(body.checkoutRequestId).first();
  assert.equal(rows.n,1);
});

test('uncertain provider result preserves the order and blocks automatic duplicate payment', async () => {
  const body = order(1,2490);
  const {post,calls} = setup(false,catalog,24.9,{onPayment:async()=>{throw new Error('private-timeout');}});
  const response = await post(body);
  assert.equal(response.status,502);
  const result = await response.json();
  assert(result.order_number);
  assert.doesNotMatch(JSON.stringify(result), /private-/);
  const row = await fixture.db.prepare('SELECT * FROM orders WHERE order_number = ?').bind(result.order_number).first();
  assert.equal(row.status,'aguardando pagamento');
  assert.equal(row.payment_setup_status,'review_required');
  assert.equal((await post(body)).status,409);
  assert.equal(calls.length,1);
});

test('failure to save payment reference never redirects and does not erase the saved order', async () => {
  const body = pixOrder(1,2490);
  const db = {prepare(sql) {
    if(sql.includes('SET mercado_pago_payment_id')) throw new Error('private-write-failure');
    return fixture.db.prepare(sql);
  }};
  const {post,calls} = setup(false,catalog,24.9,{db});
  const response = await post(body);
  assert.equal(response.status,502);
  const result = await response.json();
  assert.equal(result.checkout_url,undefined);
  const row = await fixture.db.prepare('SELECT * FROM orders WHERE order_number = ?').bind(result.order_number).first();
  assert.equal(row.total_cents,body.totalCents);
  assert.equal(row.payment_setup_status,'review_required');
  assert.equal((await setup().post(body)).status,409);
  assert.equal(calls.length,1);
});

test('an already paid order cannot return a payment URL', async () => {
  const body = order(1,2490);
  const {post,calls} = setup();
  const original = await (await post(body)).json();
  await fixture.db.prepare("UPDATE orders SET status = 'pago' WHERE order_number = ?").bind(original.order_number).run();
  const response = await post(body);
  assert.equal(response.status,409);
  assert.equal((await response.json()).checkout_url,undefined);
  assert.equal(calls.length,1);
});

test('Vercel refuses a success response without a persisted order contract', async () => {
  const {post} = setup(true,catalog,24.9,{proxyResponse:{checkout_url:'https://www.mercadopago.com.br/checkout/test'}});
  assert.equal((await post(order(1,2490))).status,502);
});

test('new endpoint rejects the old Vercel payload instead of falling back to an unrecorded payment', async () => {
  for (const pix of [false,true]) {
    const body = pix ? pixOrder(1,2490) : order(1,2490);
    delete body.customer; delete body.address; delete body.checkoutRequestId;
    if (pix) { body.payerEmail='test@example.com'; body.pixRequestId=require('node:crypto').randomUUID(); }
    else delete body.paymentMethod;
    const {post,calls}=setup();
    assert.equal((await post(body)).status,400);
    assert.equal(calls.length,0);
  }
});

test('new Vercel never switches to the legacy route when the order service fails', async () => {
  const {post,calls}=setup(true,catalog,24.9,{proxyResponse:{error:'Order storage unavailable'}});
  assert.equal((await post(order(1,2490))).status,502);
  assert.equal(calls.length,1);
  assert.equal(calls[0].url,'https://flow-jesus.flowjesusoficial.workers.dev/api/orders/checkout');
});
