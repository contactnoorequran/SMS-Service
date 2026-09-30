import { SavedConnection } from './carrier-store';
import { carrierRequest } from './carrier-security';
export function authHeaders(c: SavedConnection) {
  const {config, secrets} = c; const headers: Record<string,string> = {};
  if (config.authType === 'bearer' || config.authType === 'header') {
    if (!secrets.apiKey) throw new Error('API key required');
    headers[config.authType === 'bearer' ? 'Authorization' : config.authHeader] = config.authType === 'bearer' ? `Bearer ${secrets.apiKey}` : secrets.apiKey;
  } else if (config.authType === 'basic') {
    if (!secrets.username || !secrets.password) throw new Error('HTTP username and password required');
    headers.Authorization = 'Basic ' + Buffer.from(`${secrets.username}:${secrets.password}`).toString('base64');
  }
  return headers;
}
export async function testHttp(c: SavedConnection) {
  if (!c.config.healthUrl) throw new Error('Configure a read-only health/account URL for the HTTP connection test');
  const response = await carrierRequest(c.config.healthUrl, 'GET', authHeaders(c));
  if (response.status < 200 || response.status >= 300) throw new Error(`HTTP health check returned ${response.status}`);
}
export async function sendHttp(c: SavedConnection, from: string, to: string, text: string) {
  if (!c.config.sendUrl) throw new Error('Configure the provider send URL');
  const headers = authHeaders(c); let payload: string;
  if (c.config.adapter === 'twilio') {
    headers['Content-Type'] = 'application/x-www-form-urlencoded'; payload = new URLSearchParams({From: from, To: to, Body: text}).toString();
  } else {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(c.config.adapter === 'telnyx' ? {from, to, text} : c.config.adapter === 'sinch' ? {from, to: [to], body: text} : {[c.config.fromField]: from, [c.config.toField]: to, [c.config.bodyField]: text});
  }
  const response = await carrierRequest(c.config.sendUrl, 'POST', headers, payload);
  if (response.status < 200 || response.status >= 300) throw new Error(`Carrier submission returned HTTP ${response.status}; check provider records before retrying`);
  let data: any; try { data = JSON.parse(response.body); } catch { throw new Error('Carrier accepted request but response is not JSON; delivery status unknown'); }
  const field = c.config.adapter === 'twilio' ? 'sid' : c.config.adapter === 'telnyx' ? 'data.id' : c.config.messageIdPath;
  const id = field.split('.').reduce((value, key) => value?.[key], data);
  if (typeof id !== 'string' || !id) throw new Error('Carrier response has no message ID; check response mapping before retrying');
  return id;
}
