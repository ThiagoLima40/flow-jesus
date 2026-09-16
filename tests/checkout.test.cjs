const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

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
function setup(vercel = false, catalogOverride = catalog, shippingPrice = 24.9) {
  const calls = [];
  const { POST } = load('src/app/api/mercadopago/checkout/route.ts', {
    'next/server': { NextResponse: { json: (body, init) => Response.json(body, init) } },
    '@opennextjs/cloudflare': { getCloudflareContext: () => ({ env: { MERCADOPAGO_ACCESS_TOKEN: 'test-token' } }) },
    '@/data/products': catalogOverride,
    '@/lib/pricing': load('src/lib/pricing.ts', {}),
    '@/lib/pix-payment': { createPixPayment: (token, input) => load('src/lib/pix-payment.ts', {}, {
      crypto: require('node:crypto').webcrypto,
    }).createPixPayment(token, input, async (url, options) => {
      const body = JSON.parse(options.body);
      calls.push({ url, options, body });
      return Response.json({ payment_method_id: 'pix', currency_id: 'BRL', transaction_amount: body.transaction_amount,
        status: 'pending', status_detail: 'pending_waiting_transfer',
        point_of_interaction: { transaction_data: { qr_code: 'test-qr', ticket_url: 'https://www.mercadopago.com.br/payments/1/ticket' } },
      });
    }) },
  }, {
    process: { env: vercel ? { VERCEL: '1' } : {} },
    crypto: require('node:crypto').webcrypto,
    fetch: async (url, options) => {
      if (url.endsWith('/quote')) return Response.json({ services: [{ id: 1, price: shippingPrice }] });
      calls.push({ url, options, body: JSON.parse(options.body) });
      return Response.json(vercel ? { checkout_url: 'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=test' } :
        { init_point: 'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=test' });
    },
  });
  return { calls, post: (body) => POST(new Request('https://example.com/api/mercadopago/checkout', {
    method: 'POST', body: JSON.stringify(body),
  })) };
}

function order(qty, shipping, coupon = '') {
  const discountCents = coupon === 'FLOW10' ? qty * 990 : 0;
  return {
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
  assert.equal(calls[0].url, 'https://flow-jesus.flowjesusoficial.workers.dev/api/mercadopago/checkout');
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
  return { ...body, paymentMethod: 'pix', payerEmail: 'test@example.com',
    pixRequestId: '11111111-1111-4111-8111-111111111111',
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
    assert.equal(calls[0].body.payer.email, body.payerEmail);
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
    { paymentMethod: 'other' }, { paymentMethod: 'card' }, { payerEmail: '' },
    { payerEmail: 'not-an-email' }, { pixRequestId: undefined },
    { discountCents: 0, totalCents: 11166 },
    { discountCents: 558, totalCents: 10608 },
  ]) {
    const { post, calls } = setup(false, catalog, 12.66);
    assert.equal((await post({ ...body, ...change })).status, 400);
    assert.equal(calls.length, 0);
  }
});

test('other methods keep the exact existing preference payload with no PIX restrictions', async () => {
  const { post, calls } = setup();
  assert.equal((await post({ ...order(1, 2490), paymentMethod: 'other' })).status, 200);
  assert.deepEqual(Object.keys(calls[0].body), ['items']);
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
