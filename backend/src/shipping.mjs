import { getAccessToken, OAuthError } from './oauth.mjs';

const QUOTE_PATH = '/api/v2/me/shipment/calculate';
const postal = value => typeof value === 'string' && /^\d{8}$/.test(value.replace(/\D/g, '')) ? value.replace(/\D/g, '') : null;
const number = (value, min, max) => typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max ? value : null;

export function quoteInput(body, originPostalCode) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new OAuthError(400, 'Dados de cotação inválidos.');
  const to = postal(body.toPostalCode);
  const from = postal(originPostalCode);
  if (!to || !from) throw new OAuthError(400, 'CEP de origem ou destino inválido.');
  if (!Array.isArray(body.products) || body.products.length < 1 || body.products.length > 50) throw new OAuthError(400, 'Informe os produtos do carrinho.');
  const products = body.products.map((item, index) => {
    if (!item || typeof item !== 'object') throw new OAuthError(400, `Produto ${index + 1} inválido.`);
    const id = typeof item.id === 'string' && item.id.length > 0 && item.id.length <= 100 ? item.id : null;
    const width = number(item.width, 1, 105), height = number(item.height, 1, 105), length = number(item.length, 1, 105);
    const weight = number(item.weight, 0.01, 30), insuranceValue = number(item.insuranceValue, 0, 100000), quantity = number(item.quantity, 1, 100);
    if (!id || width === null || height === null || length === null || weight === null || insuranceValue === null || quantity === null || !Number.isInteger(quantity)) throw new OAuthError(400, `Dimensões ou quantidade inválidas no produto ${index + 1}.`);
    return { id, width, height, length, weight, insurance_value: Math.round(insuranceValue * 100) / 100, quantity };
  });
  return { from: { postal_code: from }, to: { postal_code: to }, products, options: { receipt: false, own_hand: false } };
}

export async function calculateQuote(store, cfg, body, fetchImpl = fetch) {
  const payload = quoteInput(body, cfg.originPostalCode);
  const token = await getAccessToken(store, cfg, fetchImpl);
  const response = await fetchImpl(`${cfg.baseUrl}${QUOTE_PATH}`, {
    method: 'POST', headers: { Accept: 'application/json', Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': cfg.userAgent },
    body: JSON.stringify(payload), signal: AbortSignal.timeout(15000), redirect: 'follow',
  });
  let value;
  try { value = await response.json(); } catch { throw new OAuthError(502, 'O Melhor Envio retornou uma resposta inválida.'); }
  if (!response.ok || !Array.isArray(value)) {
    const message = value && typeof value.message === 'string' ? value.message : 'Não foi possível calcular o frete.';
    throw new OAuthError(response.status === 401 || response.status === 403 ? 502 : 422, message.slice(0, 200));
  }
  return value.filter(item => item && typeof item === 'object' && !item.error && (item.custom_price ?? item.price) != null && (item.custom_delivery_time ?? item.delivery_time) != null).map(item => ({
    id: item.id, name: item.name, company: item.company?.name || null,
    price: Number(item.custom_price ?? item.price), delivery_time: Number(item.custom_delivery_time ?? item.delivery_time),
    delivery_range: item.custom_delivery_range ?? item.delivery_range ?? null,
  })).filter(item => Number.isSafeInteger(item.id) && typeof item.name === 'string' && Number.isFinite(item.price) && item.price >= 0 && Number.isFinite(item.delivery_time) && item.delivery_time >= 0);
}
