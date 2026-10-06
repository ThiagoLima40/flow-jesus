const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {randomUUID} = require('node:crypto');
const {Miniflare} = require('miniflare');
const {buildSync} = require('esbuild');
const {load, contact} = require('./helpers/orders.cjs');
const {OrderStore} = load('src/lib/order-store.ts');

test('native Worker fetch confirms payment and sends once; redirects are never followed', async () => {
  const script = buildSync({stdin:{contents:`
    import { reconcilePayment } from './src/lib/payment-webhook.ts';
    import { notifyPaidOrder } from './src/lib/paid-order-email.ts';
    export default { async fetch(request, env) {
      try {
        await reconcilePayment(env.DB, 'mp-test', '182217674858');
        await notifyPaidOrder(env.DB, {RESEND_API_KEY:'email-test'}, {type:'payment',id:'182217674858'});
        return new Response('ok');
      } catch { return new Response('failed', {status:503}); }
    }};
  `,resolveDir:process.cwd()},bundle:true,format:'esm',platform:'neutral',write:false}).outputFiles[0].text;
  let reference, redirectPayment = false, redirectEmail = false, emails = 0;
  const mf = new Miniflare({modules:true,script,compatibilityDate:'2026-09-08',d1Databases:['DB'],
    outboundService: async request => {
      const url = new URL(request.url);
      assert(['api.mercadopago.com','api.resend.com'].includes(url.hostname), 'credentials must not follow redirects');
      if(url.pathname === '/v1/payments/182217674858') {
        if(redirectPayment) return new Response('',{status:302,headers:{Location:'https://untrusted.example/payment'}});
        return Response.json({id:182217674858,live_mode:true,external_reference:reference,transaction_amount:84.15,
          currency_id:'BRL',collector_id:987,payment_method_id:'pix',status:'approved',
          date_approved:'2026-10-03T17:37:12Z',date_last_updated:'2026-10-03T17:37:16Z'});
      }
      if(url.pathname === '/users/me') return Response.json({id:987});
      if(url.hostname === 'api.resend.com') {
        if(redirectEmail) return new Response('',{status:302,headers:{Location:'https://untrusted.example/email'}});
        const payload=await request.json();
        assert.deepEqual(payload.to,['flowjesusoficial@gmail.com']);
        assert.equal(request.headers.get('Idempotency-Key'),`flowjesus-paid-order/${reference}`);
        emails++; return Response.json({id:'runtime-email'});
      }
      throw new Error('Unexpected outbound request');
    },
  });
  try {
    const db=await mf.getD1Database('DB');
    for(const file of fs.readdirSync('migrations/orders').filter(f=>f.endsWith('.sql')).sort()) {
      for(const sql of fs.readFileSync(`migrations/orders/${file}`,'utf8').split(';').filter(s=>s.trim())) await db.prepare(sql).run();
    }
    const store=new OrderStore(db);
    const saved=await store.create(randomUUID(),'hash',{
      ...contact(),items:[{productId:'test',name:'Teste',color:'Preto',size:'M',quantity:1,unitPriceCents:9900,subtotalCents:9900}],
      subtotalCents:9900,coupon:'FLOW10',couponDiscountCents:990,pixDiscountCents:495,
      shipping:{mode:'pickup',serviceId:0,name:'Retirada no local',company:null,amountCents:0},totalCents:8415,paymentMethod:'pix',
    });
    reference=saved.order_number;
    await store.claim(reference);
    await store.attachPayment(reference,{kind:'payment',id:'182217674858',url:'https://www.mercadopago.com.br/test'});
    const row=()=>db.prepare('SELECT * FROM orders WHERE order_number = ?').bind(reference).first();
    redirectPayment=true;
    assert.equal((await mf.dispatchFetch('https://test')).status,503);
    assert.equal((await row()).status,'aguardando pagamento'); assert.equal(emails,0);
    redirectPayment=false; redirectEmail=true;
    assert.equal((await mf.dispatchFetch('https://test')).status,503);
    assert.equal((await row()).status,'pago'); assert.equal((await row()).paid_email_status,'pending');
    redirectEmail=false;
    for(let i=0;i<2;i++) assert.equal((await mf.dispatchFetch('https://test')).status,200);
    assert.equal((await row()).paid_email_status,'sent'); assert.equal(emails,1);
  } finally {await mf.dispose();}
});
