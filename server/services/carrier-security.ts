import { createCipheriv, createDecipheriv, randomBytes, timingSafeEqual, createHmac, createPublicKey, verify } from 'node:crypto';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import https from 'node:https';
import http from 'node:http';

export type CarrierSecrets = { apiKey?: string; username?: string; password?: string; webhookSecret?: string };
function encryptionKey() {
  const key = Buffer.from(process.env.CARRIER_ENCRYPTION_KEY || '', 'base64');
  if (key.length !== 32) throw new Error('Configure CARRIER_ENCRYPTION_KEY (32 random bytes, base64) before saving live credentials.');
  return key;
}
export function encryptSecrets(value: CarrierSecrets) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()]);
  return ['v1', iv.toString('base64'), cipher.getAuthTag().toString('base64'), encrypted.toString('base64')].join('.');
}
export function decryptSecrets(value?: string | null): CarrierSecrets {
  if (!value) return {};
  const [version, iv, tag, body] = value.split('.');
  if (version !== 'v1') throw new Error('Unsupported credential encryption version');
  const cipher = createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(iv, 'base64'));
  cipher.setAuthTag(Buffer.from(tag, 'base64'));
  return JSON.parse(Buffer.concat([cipher.update(Buffer.from(body, 'base64')), cipher.final()]).toString('utf8'));
}
export function constantEqual(a: string, b: string) {
  const aa = Buffer.from(a), bb = Buffer.from(b);
  return aa.length === bb.length && aa.length > 0 && timingSafeEqual(aa, bb);
}
export function validateHmac(secret: string, timestamp: string, body: Buffer, signature: string, now = Date.now()) {
  if (!/^\d+$/.test(timestamp) || Math.abs(now / 1000 - Number(timestamp)) > 300) return false;
  const expected = createHmac('sha256', secret).update(timestamp + '.').update(body).digest('hex');
  return constantEqual(expected, signature);
}
export function validateTwilio(secret: string, url: string, params: Record<string, unknown>, signature: string) {
  let data = url;
  for (const key of Object.keys(params).sort()) {
    const values = Array.isArray(params[key]) ? [...new Set(params[key] as string[])].sort() : [params[key]];
    for (const value of values) data += key + String(value);
  }
  return constantEqual(createHmac('sha1', secret).update(data).digest('base64'), signature);
}
export function validateTelnyx(publicKey: string, timestamp: string, body: Buffer, signature: string) {
  if (!/^\d+$/.test(timestamp) || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  try {
    const raw = Buffer.from(publicKey, 'base64');
    if (raw.length !== 32) return false;
    const key = createPublicKey({key: Buffer.concat([Buffer.from('302a300506032b6570032100', 'hex'), raw]), format: 'der', type: 'spki'});
    return verify(null, Buffer.concat([Buffer.from(timestamp + '|'), body]), key, Buffer.from(signature, 'base64'));
  } catch { return false; }
}

export function isPublicAddress(address: string): boolean {
  if (isIP(address) === 4) {
    const [a, b] = address.split('.').map(Number);
    return !(a === 0 || a === 10 || a === 127 || a >= 224 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && [0, 168].includes(b)) || (a === 100 && b >= 64 && b <= 127) || (a === 198 && [18, 19].includes(b)));
  }
  // Permit global-unicast IPv6 only. IPv4-mapped and local addresses fail closed.
  return isIP(address) === 6 && /^[23][0-9a-f]{3}:/i.test(address) && !address.toLowerCase().startsWith('2001:db8:');
}
export async function resolveCarrierHost(host: string) {
  const normalized = host.replace(/^\[|\]$/g, '');
  const allowed = (process.env.CARRIER_ALLOWED_PRIVATE_HOSTS || '').split(',').map(s => s.trim()).includes(normalized);
  const addresses = isIP(normalized) ? [{address: normalized, family: isIP(normalized)}] : await lookup(normalized, {all: true});
  if (!addresses.length || (!allowed && addresses.some(a => !isPublicAddress(a.address)))) throw new Error('Carrier host resolves to a private or reserved network. Explicit server allowlisting is required.');
  return addresses[0];
}

/** Pin the checked DNS address, reject redirects, bound response size and time. */
export async function carrierRequest(urlString: string, method: string, headers: Record<string, string>, body?: string) {
  const url = new URL(urlString);
  if (url.username || url.password || url.hash) throw new Error('Credentials and fragments are not allowed in carrier URLs');
  if (url.protocol !== 'https:' && !(process.env.NODE_ENV === 'test' && url.protocol === 'http:')) throw new Error('HTTP carrier endpoints must use HTTPS');
  const address = await resolveCarrierHost(url.hostname);
  return new Promise<{status: number; body: string}>((resolve, reject) => {
    const transport = url.protocol === 'https:' ? https : http;
    const request = transport.request(url, {
      method, headers, rejectUnauthorized: true,
      lookup: ((_host: string, _options: unknown, callback: Function) => callback(null, address.address, address.family)) as any,
    }, response => {
      const chunks: Buffer[] = []; let size = 0;
      response.on('data', chunk => { size += chunk.length; if (size > 1024 * 1024) request.destroy(new Error('Carrier response exceeded 1MB')); else chunks.push(chunk); });
      response.on('end', () => { clearTimeout(timer); resolve({status: response.statusCode || 0, body: Buffer.concat(chunks).toString('utf8')}); });
      response.on('error', reject);
    });
    const timer = setTimeout(() => request.destroy(new Error('Carrier request timed out; delivery status may be unknown.')), 10000);
    request.on('error', error => { clearTimeout(timer); reject(error); });
    request.end(body);
  });
}
