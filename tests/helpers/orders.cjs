const fs = require('node:fs');
const ts = require('typescript');
const { Miniflare } = require('miniflare');
const { webcrypto, randomUUID } = require('node:crypto');

function load(file, dependencies = {}, globals = {}) {
  const exports = {};
  new Function('exports', 'require', 'crypto', ...Object.keys(globals), ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText)(exports, name => dependencies[name], webcrypto, ...Object.values(globals));
  return exports;
}
async function databaseFixture() {
  const mf = new Miniflare({ modules: true, script: 'export default { fetch() { return new Response("test"); } }',
    compatibilityDate: '2024-12-01', d1Databases: ['ORDERS_DB'] });
  try {
    const db = await mf.getD1Database('ORDERS_DB');
    for (const sql of fs.readFileSync('migrations/orders/0001_orders.sql', 'utf8').split(';').filter(s => s.trim())) await db.prepare(sql).run();
    return { db, close: () => mf.dispose() };
  } catch (error) { await mf.dispose(); throw error; }
}
function contact() {
  return {
    customer: { name: 'Cliente Teste', email: 'test@example.com', phone: '(11) 99999-8888' },
    address: { street: 'Avenida Teste', number: '123', complement: 'Apto 4', neighborhood: 'Centro', city: 'São Paulo', state: 'SP', postalCode: '01310100', country: 'BR' },
    checkoutRequestId: randomUUID(), paymentMethod: 'other',
  };
}
module.exports = { load, databaseFixture, contact };
