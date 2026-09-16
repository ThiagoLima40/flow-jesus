import { test } from 'node:test';
import assert from 'node:assert/strict';
import { quoteInput, calculateQuote } from '../src/shipping.mjs';
import { b64, encrypt } from '../src/crypto.mjs';

test('quote input maps cart products to official Melhor Envio product payload', () => {
  assert.deepEqual(quoteInput({ toPostalCode: '01310-100', products: [{ id: 'shirt', width: 25, height: 8, length: 30, weight: .3, insuranceValue: 99.9, quantity: 2 }] }, '01001000'), {
    from: { postal_code: '01001000' }, to: { postal_code: '01310100' },
    products: [{ id: 'shirt', width: 25, height: 8, length: 30, weight: .3, insurance_value: 99.9, quantity: 2 }], options: { receipt: false, own_hand: false },
  });
});

test('quote rejects invalid CEP and returns custom price and delivery time', async () => {
  assert.throws(() => quoteInput({ toPostalCode: '123', products: [] }, '01001000'));
  const key = b64(crypto.getRandomValues(new Uint8Array(32))); const cfg = { originPostalCode: '01001000', baseUrl: 'https://melhorenvio.com.br', tokenKey: key, connectionId: 'id', userAgent: 'FlowJesus' };
  const encrypted = await encrypt({ access_token: 'access', refresh_token: 'refresh' }, key, cfg.connectionId);
  const store = { read: async () => ({ status: 'connected', lock_owner: null, expires_at: Date.now() + 4 * 86400000, encrypted_tokens: encrypted }) };
  const response = await calculateQuote(store, cfg, { toPostalCode: '01310100', products: [{ id: 'shirt', width: 25, height: 8, length: 30, weight: .3, insuranceValue: 99, quantity: 1 }] }, async (url, options) => {
    if (url.endsWith('/shipment/calculate')) {
      assert.equal(options.method, 'POST'); const payload = JSON.parse(options.body); assert.equal(payload.products[0].quantity, 1);
      return Response.json([{ id: 1, name: 'PAC', price: '30.00', custom_price: '27.50', delivery_time: 6, custom_delivery_time: 5, company: { name: 'Correios' } }, { id: 2, name: 'Unavailable', price: null, delivery_time: null }, { id: 3, name: 'Error', error: 'Unavailable', price: '0', delivery_time: 0 }, { id: 4, name: 'Negative', price: '-1', delivery_time: 2 }]);
    }
    return Response.json({ access_token: 'x', refresh_token: 'y', token_type: 'Bearer', expires_in: 86400 });
  });
  assert.deepEqual(response, [{ id: 1, name: 'PAC', company: 'Correios', price: 27.5, delivery_time: 5, delivery_range: null }]);
});


test('provider errors and transport failures never escape as public credential-bearing messages', async () => {
  const key = b64(crypto.getRandomValues(new Uint8Array(32)));
  const cfg = { originPostalCode: '01001000', baseUrl: 'https://melhorenvio.com.br', tokenKey: key, connectionId: 'id', userAgent: 'FlowJesus' };
  const encrypted = await encrypt({ access_token: 'private-access', refresh_token: 'private-refresh' }, key, cfg.connectionId);
  const store = { read: async () => ({ status: 'connected', lock_owner: null, expires_at: Date.now() + 4 * 86400000, encrypted_tokens: encrypted }) };
  const input = { toPostalCode: '01310100', products: [{ id: 'shirt', width: 25, height: 8, length: 30, weight: .3, insuranceValue: 99, quantity: 1 }] };
  for (const provider of [
    async () => Response.json({ message: 'Bearer private-access', refresh_token: 'private-refresh', headers: { Authorization: 'private-header' } }, { status: 401 }),
    async () => Response.json({ message: 'client_secret=private-secret' }, { status: 422 }),
    async () => new Response('private-raw-body', { status: 500 }),
    async () => { throw new Error('private-transport-secret'); },
  ]) {
    await assert.rejects(calculateQuote(store, cfg, input, provider), error => {
      assert.doesNotMatch(error.message, /private-|Bearer|client_secret|Authorization/);
      assert.match(error.message, /Não foi possível calcular|resposta inválida/);
      return true;
    });
  }
});
