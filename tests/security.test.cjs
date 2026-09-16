const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const ts = require('typescript');
function load(file, dependencies = {}, globals = {}) {
  const exports = {};
  new Function('exports', 'require', ...Object.keys(globals), ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText)(exports, name => dependencies[name], ...Object.values(globals));
  return exports;
}

test('Mercado Pago logs contain only fixed events, endpoints and numeric status for every failure', async () => {
  for (const failure of [
    () => Response.json({ access_token: 'private-access', refresh_token: 'private-refresh', nested: { apiKey: 'private-key' }, message: 'Bearer private-header' }, { status: 400, statusText: 'private-status', headers: { 'x-request-id': 'private-id' } }),
    () => new Response('private-raw-response', { status: 502 }),
    () => { throw new Error('private-exception-token'); },
    () => new Response('private-json-error', { status: 200 }),
  ]) {
    for (const pix of [false, true]) {
      const logs = [];
      const { POST } = load('src/app/api/mercadopago/checkout/route.ts', {
        'next/server': { NextResponse: { json: (value, init) => Response.json(value, init) } },
        '@opennextjs/cloudflare': { getCloudflareContext: () => ({ env: { MERCADOPAGO_ACCESS_TOKEN: 'private-binding' } }) },
        '@/data/products': load('src/data/products.ts'), '@/lib/pricing': load('src/lib/pricing.ts'),
        '@/lib/pix-payment': { createPixPayment: () => { throw new Error('private-pix-error'); } },
      }, { process: { env: {} }, crypto: require('node:crypto').webcrypto,
        console: { error: (...args) => logs.push(args) },
        fetch: async url => url.endsWith('/quote') ? Response.json({ services: [{ id: 2, price: 12.66 }] }) : failure(),
      });
      const response = await POST(new Request('https://example.com/api/mercadopago/checkout', { method: 'POST', body: JSON.stringify({
        items: [{ productId: 'flow-70x7', size: 'M', color: 'Preto', qty: 1 }],
        shipping: { amountCents: 1266, serviceId: 2, postalCode: '01310100' }, coupon: '', discountCents: pix ? 495 : 0, totalCents: pix ? 10671 : 11166,
        ...(pix ? { paymentMethod: 'pix', payerEmail: 'audit@example.com', pixRequestId: '11111111-1111-4111-8111-111111111111' } : {}),
      }) }));
      assert.equal(response.status, 502);
      assert.equal(logs.length, 1);
      assert.doesNotMatch(JSON.stringify(logs) + await response.text(), /private-|audit@example/);
      assert.deepEqual(Object.keys(logs[0][1]).sort(), logs[0][1].status ? ['endpoint', 'status'] : ['endpoint']);
    }
  }
});

test('Worker staging omits secret files and environment, rejects nonempty embedded env, preserves source secrets', async () => {
  const { prepareBuild, buildEnvironment, verifyBuild } = await import('../scripts/build-worker.mjs');
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'flow-security-test-'));
  try {
    const source = path.join(fixture, 'source'), stage = path.join(fixture, 'stage');
    fs.mkdirSync(source); fs.mkdirSync(stage);
    for (const name of ['src', 'public', 'scripts', 'node_modules']) fs.mkdirSync(path.join(source, name));
    for (const name of ['package.json', 'package-lock.json', 'next.config.mjs', 'open-next.config.ts', 'tsconfig.json', 'tailwind.config.ts', 'postcss.config.mjs', '.eslintrc.json', 'wrangler.json']) fs.writeFileSync(path.join(source, name), '{}');
    for (const name of ['.env.local', '.env.production', '.dev.vars', 'src/.env', 'public/private.key']) fs.writeFileSync(path.join(source, name), 'private-test-secret');
    fs.writeFileSync(path.join(source, 'src/app.ts'), 'safe source');
    fs.symlinkSync(path.join(source, '.env.local'), path.join(source, 'public/leak.txt'));
    prepareBuild(source, stage);
    for (const name of ['.env.local', '.env.production', '.dev.vars', 'src/.env', 'public/private.key', 'public/leak.txt']) assert.equal(fs.existsSync(path.join(stage, name)), false);
    assert.equal(fs.readFileSync(path.join(source, '.env.local'), 'utf8'), 'private-test-secret');
    assert.equal(fs.readFileSync(path.join(stage, 'src/app.ts'), 'utf8'), 'safe source');
    const env = buildEnvironment({ PATH: '/bin', MERCADOPAGO_ACCESS_TOKEN: 'private-access', NEXT_PUBLIC_SECRET: 'private-public', CLOUDFLARE_API_TOKEN: 'private-cloudflare' });
    assert.doesNotMatch(JSON.stringify(env), /private-/);
    fs.mkdirSync(path.join(stage, 'env'));
    const file = path.join(stage, 'env/next-env.mjs');
    fs.writeFileSync(file, 'export const production = {"TOKEN":"private-test"};');
    assert.throws(() => verifyBuild(stage), /rejected/);
    fs.writeFileSync(file, ['production', 'development', 'test'].map(mode => `export const ${mode} = {};`).join('\n'));
    verifyBuild(stage);
  } finally { fs.rmSync(fixture, { recursive: true, force: true }); }
});

