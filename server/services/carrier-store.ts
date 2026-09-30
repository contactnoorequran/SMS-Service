import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { getPrismaClient } from '../db/prisma';
import { connectionSchema, ConnectionConfig, validateLiveConfig } from './carrier-config';
import { decryptSecrets, encryptSecrets, CarrierSecrets } from './carrier-security';
import { smppManager } from './smpp-transport';

export const DEMO_PROVIDER_ID = 'demo-carrier';
const demoPath = () => path.resolve(process.env.CARRIER_DEMO_FILE || '.runtime/carrier-demo.json');
let writeQueue = Promise.resolve();
export interface SavedConnection {id: string; providerId: string; config: ConnectionConfig; secrets: CarrierSecrets; createdAt: string;}
const defaults = () => ['HTTP_REST', 'SMPP_TRANSCEIVER'].map((connectionType, i) => ({
  id: i ? 'demo-smpp' : 'demo-http', providerId: DEMO_PROVIDER_ID,
  config: connectionSchema.parse({name: i ? 'Demo SMPP' : 'Demo HTTP', connectionType, mode: 'DEMO', host: 'demo.invalid', port: i ? 2775 : 443, enabled: false}), createdAt: new Date(0).toISOString(),
}));
async function demos(): Promise<any[]> {
  if (process.env.NODE_ENV === 'production') return [];
  try { return JSON.parse(await fs.readFile(demoPath(), 'utf8')); }
  catch (error: any) { if (error.code !== 'ENOENT') throw error; return defaults(); }
}
async function writeDemo(record: any) {
  const next = writeQueue.catch(() => {}).then(async () => {
    const records = await demos(); const index = records.findIndex(r => r.id === record.id);
    if (index < 0) records.push(record); else records[index] = record;
    await fs.mkdir(path.dirname(demoPath()), {recursive: true});
    const temp = demoPath() + '.' + randomUUID() + '.tmp';
    await fs.writeFile(temp, JSON.stringify(records, null, 2), {mode: 0o600}); await fs.rename(temp, demoPath());
  });
  writeQueue = next; return next;
}
export function safeConnection(record: SavedConnection) {
  const config = record.config;
  const state = config.mode === 'DEMO' ? 'DEMO' : config.connectionType === 'HTTP_REST' ? 'UNTESTED' : smppManager.getTrunkStatus(record.id);
  return {id: record.id, providerId: record.providerId, ...config, status: state === 'BOUND' ? 'CONNECTED' : state,
    credential: {id: record.id, label: config.credentialRefLabel || 'Encrypted carrier credentials', isConfigured: Object.values(record.secrets).some(Boolean), algorithm: 'AES-256-GCM'},
    createdAt: record.createdAt, callbackPath: `/api/messages/callbacks/${record.id}`};
}
export class CarrierStore {
  static async list(providerId: string): Promise<SavedConnection[]> {
    const prisma = getPrismaClient();
    if (providerId === DEMO_PROVIDER_ID) {
      const rows = await demos();
      const local = rows.filter(r => !r.promoted).map(r => ({...r, secrets: {}}));
      if (!rows.some(r => r.promoted)) return local;
      if (!prisma) throw new Error('Live demo replacement requires a database');
      const db = await prisma.providerConnection.findMany({where: {providerId}, include: {credentialReference: true}});
      return [...local, ...db.map(row => this.fromRow(row))];
    }
    if (!prisma) throw new Error('Database connection required');
    const rows = await prisma.providerConnection.findMany({where: {providerId}, include: {credentialReference: true}});
    return rows.map(row => this.fromRow(row));
  }
  private static fromRow(row: any): SavedConnection {
    const config = connectionSchema.parse({name: 'Carrier connection', connectionType: row.connectionType === 'HTTP' ? 'HTTP_REST' : 'SMPP_TRANSCEIVER', ...(row.protocolConfig || {})});
    return {id: row.id, providerId: row.providerId, config, secrets: decryptSecrets(row.credentialReference?.ciphertext), createdAt: row.createdAt.toISOString()};
  }
  static async getById(id: string): Promise<SavedConnection> {
    const demo = (await demos()).find(r => r.id === id && !r.promoted);
    if (demo) return {...demo, secrets: {}};
    const db = getPrismaClient(); if (!db) throw new Error('Database connection required');
    const row = await db.providerConnection.findUnique({where: {id}, include: {credentialReference: true, provider: true}});
    if (!row || row.provider.status !== 'ACTIVE') throw new Error('Carrier connection unavailable or provider suspended');
    return this.fromRow(row);
  }
  static async save(providerId: string, input: unknown, id?: string) {
    const existing = id ? await this.getById(id) : undefined;
    if (existing && existing.providerId !== providerId) throw new Error('Connection does not belong to this provider');
    const merged = {...existing?.config, ...(input as object)};
    const parsed = connectionSchema.parse(merged);
    const {secrets: submitted, ...config} = parsed;
    validateLiveConfig(config);
    // Empty write-only fields preserve the old secret; no secret is returned to a browser.
    const secrets = {...existing?.secrets, ...Object.fromEntries(Object.entries(submitted || {}).filter(([,v]) => Boolean(v)))};
    const connectionId = id || randomUUID();
    const createdAt = existing?.createdAt || new Date().toISOString();
    if (config.mode === 'DEMO' && providerId === DEMO_PROVIDER_ID) {
      if (existing?.config.mode === 'LIVE') throw new Error('Create a separate demo connection instead of overwriting a live connection');
      if (Object.values(submitted || {}).some(Boolean)) throw new Error('Do not enter real secrets in Demo mode');
      await writeDemo({id: connectionId, providerId, config, createdAt});
    } else {
      const db = getPrismaClient(); if (!db) throw new Error('Configure PostgreSQL before saving a live connection');
      const ciphertext = Object.values(secrets).some(Boolean) ? encryptSecrets(secrets) : null;
      if (config.mode === 'LIVE' && config.connectionType !== 'HTTP_REST' && (!secrets.password || !/^[\x21-\x7e]{1,8}$/.test(secrets.password))) throw new Error('SMPP v3.4 requires a password of 1–8 bytes');
      await db.$transaction(async tx => {
        let provider = await tx.provider.findUnique({where: {id: providerId}});
        if (!provider && providerId === DEMO_PROVIDER_ID) {
          const organizations = await tx.organization.findMany({take: 2});
          if (organizations.length !== 1) throw new Error('Create a provider in the intended organization before adding live connections');
          provider = await tx.provider.create({data: {id: providerId, name: 'Carrier Gateway', status: 'ACTIVE', organizationId: organizations[0].id}});
        }
        if (!provider || provider.status !== 'ACTIVE') throw new Error('Active provider required');
        const credential = ciphertext ? await tx.credentialReference.create({data: {label: config.credentialRefLabel, ciphertext, keyVersion: 'v1', rotatedAt: new Date()}}) : null;
        const old = await tx.providerConnection.findUnique({where: {id: connectionId}});
        const data = {providerId, connectionType: (config.connectionType === 'HTTP_REST' ? 'HTTP' : 'SMPP') as any, environment: config.environment, status: config.enabled ? 'ACTIVE' : 'DISABLED', priority: config.priority, protocolConfig: config as any, credentialRefId: credential?.id || null};
        await tx.providerConnection.upsert({where: {id: connectionId}, create: {id: connectionId, ...data}, update: data});
        if (old?.credentialRefId) await tx.credentialReference.deleteMany({where: {id: old.credentialRefId, connections: {none: {}}}});
      });
      if (providerId === DEMO_PROVIDER_ID) await writeDemo({id: connectionId, providerId, config: {mode: 'LIVE'}, promoted: true, createdAt});
    }
    smppManager.stopTrunk(connectionId);
    return safeConnection({id: connectionId, providerId, config, secrets, createdAt});
  }
  static async demoProvider() {
    const connections = (await this.list(DEMO_PROVIDER_ID)).map(safeConnection);
    return {id: DEMO_PROVIDER_ID, name: connections.every(c => c.mode === 'DEMO') ? 'Demo Carrier — HTTP & SMPP' : 'Carrier Gateway', status: 'ACTIVE', connectionsCount: connections.length, numbersCount: 0, rangesCount: 0, connections, ranges: [], createdAt: new Date(0).toISOString(), updatedAt: new Date().toISOString()};
  }
}
