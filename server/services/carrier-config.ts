import { z } from 'zod';
import {isIP} from 'node:net';

export const connectionSchema = z.object({
  name: z.string().trim().min(1).max(100),
  connectionType: z.enum(['HTTP_REST', 'SMPP_TRANSCEIVER', 'SMPP_TRANSMITTER', 'SMPP_RECEIVER']),
  mode: z.enum(['DEMO', 'LIVE']).default('DEMO'),
  environment: z.enum(['PRODUCTION', 'SANDBOX']).default('SANDBOX'),
  host: z.string().trim().max(512).default('demo.invalid'),
  port: z.number().int().min(1).max(65535).default(443),
  priority: z.number().int().min(1).max(100).default(1),
  tlsEnabled: z.boolean().default(true),
  enabled: z.boolean().default(false),
  smppDirection: z.enum(['CLIENT','SERVER']).default('CLIENT'),
  listenAddress: z.string().refine(value => Boolean(isIP(value)), 'Use a local IPv4 or IPv6 address').default('127.0.0.1'),
  allowedProviderIps: z.string().max(512).default(''),
  publicHost: z.string().trim().max(253).default(''),
  systemId: z.string().max(15).default(''),
  systemType: z.string().max(12).default(''),
  throughputTps: z.number().int().min(1).max(1000).default(10),
  windowSize: z.number().int().min(1).max(100).default(10),
  enquireLinkIntervalSec: z.number().int().min(5).max(120).default(30),
  reconnectIntervalSec: z.number().int().min(1).max(300).default(10),
  sourceTon: z.number().int().min(0).max(6).default(5),
  sourceNpi: z.number().int().min(0).max(18).default(0),
  destTon: z.number().int().min(0).max(6).default(1),
  destNpi: z.number().int().min(0).max(18).default(1),
  adapter: z.enum(['generic', 'twilio', 'telnyx', 'sinch']).default('generic'),
  healthUrl: z.string().max(1024).default(''),
  sendUrl: z.string().max(1024).default(''),
  authType: z.enum(['bearer', 'basic', 'header', 'none']).default('bearer'),
  authHeader: z.string().regex(/^[a-zA-Z0-9-]+$/).default('X-API-Key'),
  webhookAuth: z.enum(['hmac', 'twilio', 'telnyx', 'bearer']).default('hmac'),
  webhookPublicKey: z.string().max(200).default(''),
  fromField: z.string().regex(/^[a-zA-Z][a-zA-Z0-9_]*$/).default('from'),
  toField: z.string().regex(/^[a-zA-Z][a-zA-Z0-9_]*$/).default('to'),
  bodyField: z.string().regex(/^[a-zA-Z][a-zA-Z0-9_]*$/).default('body'),
  messageIdPath: z.string().regex(/^[a-zA-Z0-9_.]+$/).default('id'),
  credentialRefLabel: z.string().max(100).optional(),
  secrets: z.object({apiKey: z.string().max(4096).optional(), username: z.string().max(200).optional(), password: z.string().max(4096).optional(), webhookSecret: z.string().max(4096).optional()}).strict().optional(),
}).strict();
export type ConnectionConfig = Omit<z.infer<typeof connectionSchema>, 'secrets'>;
export function validateLiveConfig(c: ConnectionConfig) {
  if (c.mode !== 'LIVE') return;
  if (c.connectionType === 'HTTP_REST') {
    for (const value of [c.healthUrl, c.sendUrl].filter(Boolean)) {
      const url = new URL(value);
      if (url.protocol !== 'https:' || url.username || url.password || url.hash) throw new Error('Use HTTPS URLs without embedded credentials');
    }
    if (['host','authorization','cookie','content-length','connection'].includes(c.authHeader.toLowerCase()) && c.authType === 'header') throw new Error('Reserved authentication header');
    if (new Set([c.fromField,c.toField,c.bodyField]).size !== 3) throw new Error('HTTP message field names must be distinct');
  } else {
    if (!c.systemId || !/^[\x21-\x7e]{1,15}$/.test(c.systemId)) throw new Error('SMPP System ID must be 1–15 printable ASCII characters');
    if(c.smppDirection === 'SERVER'){
      const ips=c.allowedProviderIps.split(',').map(ip=>ip.trim());
      if(!ips.length || ips.length>16 || ips.some(ip=>!isIP(ip)))throw new Error('List the exact allowed provider IP addresses, separated by commas');
    }else if (!c.host || /[\s/]/.test(c.host)) throw new Error('SMPP requires a provider host');
  }
}
