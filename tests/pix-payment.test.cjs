const { test } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const fs = require('node:fs');
function load(file) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020} }).outputText;
  new Function('exports', 'crypto', code)(exports, require('node:crypto').webcrypto);
  return exports;
}
const { pixDiscountCents, productPixPrice } = load('src/lib/pricing.ts');
const { createPixPayment } = load('src/lib/pix-payment.ts');
const input = {amountCents:10671,email:'test@example.com',requestId:'11111111-1111-4111-8111-111111111111',order:{items:[{productId:'flow-70x7',qty:1}],shipping:{amountCents:1266}}};
const valid = {transaction_amount:106.71,currency_id:'BRL',payment_method_id:'pix',status:'pending',status_detail:'pending_waiting_transfer',point_of_interaction:{transaction_data:{qr_code:'test',ticket_url:'https://www.mercadopago.com.br/payments/123/ticket'}}};

test('99 BRL is 94.05 on PIX; rounding happens once on the full subtotal', () => {
  assert.equal(productPixPrice(99),94.05);
  assert.equal(pixDiscountCents(0),0);
  assert.equal(pixDiscountCents(9990 * 3),1499);
  assert.notEqual(pixDiscountCents(9990 * 3),pixDiscountCents(9990) * 3);
  for (let cents=0;cents<100000;cents+=7) {
    const discount=pixDiscountCents(cents);
    assert(Number.isSafeInteger(discount));
    assert(Math.abs(discount - cents * .05) <= .500001);
  }
});

test('PIX payment total is exact and retries reuse an order-bound idempotency key', async () => {
  const calls=[];
  const fetchImpl=async(url,options)=>{calls.push({url,...options,body:JSON.parse(options.body)});return Response.json(valid)};
  assert.equal(await createPixPayment('secret-test',input,fetchImpl),valid.point_of_interaction.transaction_data.ticket_url);
  await createPixPayment('secret-test',input,fetchImpl);
  assert.equal(calls[0].headers['X-Idempotency-Key'],calls[1].headers['X-Idempotency-Key']);
  assert.equal(calls[0].body.transaction_amount,106.71);
  assert.equal(calls[0].body.payment_method_id,'pix');
  assert.equal(calls[0].url,'https://api.mercadopago.com/v1/payments');
  assert(!JSON.stringify(calls[0].body).includes('secret-test'));
  for (const change of [{email:'other@example.com'},{order:{items:[{productId:'other',qty:1}]}},{requestId:'new-attempt'}]) {
    await createPixPayment('secret-test',{...input,...change},fetchImpl);
    assert.notEqual(calls.at(-1).headers['X-Idempotency-Key'],calls[0].headers['X-Idempotency-Key']);
  }
});

test('PIX rejects mismatched amounts, other payment methods, missing QR, unsafe URLs and terminal states', async () => {
  for(const change of [
    {transaction_amount:99},{transaction_amount:'106.71'},{payment_method_id:'visa'}, {currency_id:'USD'},
    {status:'rejected'},{status:'approved'}, {status_detail:'accredited'},
    {point_of_interaction:null},
    {point_of_interaction:{transaction_data:{qr_code:'',ticket_url:valid.point_of_interaction.transaction_data.ticket_url}}},
    {point_of_interaction:{transaction_data:{qr_code:'test',ticket_url:'https://mercadopago.com.br.evil.example/pay'}}},
  ]) await assert.rejects(()=>createPixPayment('secret-test',input,async()=>Response.json({...valid,...change})),/confirmar o Pix/);
});

test('PIX API errors never expose the response, payer data or credentials',async()=>{
  await assert.rejects(()=>createPixPayment('secret-test',input,async()=>Response.json({message:'secret-test test@example.com'},{status:400})),error=>{
    assert.equal(error.message,'Não foi possível gerar o Pix. Tente novamente.');return true;
  });
});
