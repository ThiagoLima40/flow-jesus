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
