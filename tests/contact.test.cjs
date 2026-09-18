const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

function loadRoute(env, send) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync('src/app/api/contact/route.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  new Function('exports', 'require', 'process', 'fetch', 'AbortSignal', code)(
    exports,
    name => name === 'next/server'
      ? { NextResponse: { json: (value, init) => Response.json(value, init) } }
      : { getCloudflareContext: () => { throw new Error('No Cloudflare context'); } },
    { env }, send, AbortSignal,
  );
  return exports.POST;
}

const valid = { name: 'Maria', email: 'maria@example.com', subject: 'Dúvida', message: 'Olá!' };
const request = body => new Request('https://flowjesus.com.br/api/contact', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
});

test('contact rejects invalid fields and missing credentials without sending', async () => {
  let calls = 0;
  const send = async () => { calls++; return Response.json({ id: '123' }); };
  const POST = loadRoute({}, send);
  for (const body of [{ ...valid, email: 'invalid' }, { ...valid, message: '   ' }, { ...valid, subject: 'x'.repeat(151) }]) {
    assert.equal((await POST(request(body))).status, 400);
  }
  assert.equal((await POST(request(valid))).status, 503);
  assert.equal(calls, 0);
});

test('contact sends validated fields only to the official mailbox and handles provider failure', async () => {
  let sent;
  const POST = loadRoute({ RESEND_API_KEY: 'private-test-key', CONTACT_FROM_EMAIL: 'Contato <contato@example.com>' },
    async (url, options) => { sent = { url, options }; return Response.json({ id: '123' }); });
  assert.equal((await POST(request(valid))).status, 200);
  assert.equal(sent.url, 'https://api.resend.com/emails');
  assert.equal(sent.options.headers.Authorization, 'Bearer private-test-key');
  assert.deepEqual(JSON.parse(sent.options.body).to, ['flowjesusoficial@gmail.com']);
  assert.equal(JSON.parse(sent.options.body).reply_to, valid.email);

  const failing = loadRoute({ RESEND_API_KEY: 'private-test-key', CONTACT_FROM_EMAIL: 'contato@example.com' },
    async () => Response.json({ error: 'private-provider-error' }, { status: 403 }));
  const response = await failing(request(valid));
  assert.equal(response.status, 502);
  assert.doesNotMatch(await response.text(), /private-/);
});

test('contact uses the verified domain when only RESEND_API_KEY is configured', async () => {
  let sent;
  const POST = loadRoute({ RESEND_API_KEY: 'private-test-key' },
    async (_url, options) => { sent = JSON.parse(options.body); return Response.json({ id: '123' }); });
  assert.equal((await POST(request(valid))).status, 200);
  assert.equal(sent.from, 'Contato FlowJesus <contato@flowjesus.com>');
  assert.deepEqual(sent.to, ['flowjesusoficial@gmail.com']);
});
