const encoder = new TextEncoder();
export const random = () => Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, '0')).join('');
export const b64 = bytes => btoa(String.fromCharCode(...bytes));
export const unb64 = value => Uint8Array.from(atob(value), c => c.charCodeAt(0));
export async function hash(value) {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value))), b => b.toString(16).padStart(2, '0')).join('');
}
export async function equal(a, b) {
  const [left, right] = await Promise.all([hash(a), hash(b)]);
  let difference = 0;
  for (let i = 0; i < left.length; i++) difference |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return difference === 0;
}
async function key(secret) {
  const bytes = unb64(secret);
  if (bytes.length !== 32) throw new Error('Invalid encryption key');
  return crypto.subtle.importKey('raw', bytes, 'AES-GCM', false, ['encrypt', 'decrypt']);
}
export async function encrypt(value, secret, connectionId) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: encoder.encode(connectionId) }, await key(secret), encoder.encode(JSON.stringify(value)));
  return JSON.stringify({ v: 1, iv: b64(iv), data: b64(new Uint8Array(ciphertext)) });
}
export async function decrypt(payload, secret, connectionId) {
  const value = JSON.parse(payload);
  if (value.v !== 1) throw new Error('Invalid ciphertext version');
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(value.iv), additionalData: encoder.encode(connectionId) }, await key(secret), unb64(value.data));
  return JSON.parse(new TextDecoder().decode(plaintext));
}
