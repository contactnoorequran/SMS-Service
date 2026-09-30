import { PrismaClient } from '@prisma/client';
import { AsyncLocalStorage } from 'node:async_hooks';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { env } from '../config/env';

const registries = new Map<string, Map<string, any>>();
const context = new AsyncLocalStorage<any>();
let database: PrismaClient;
let queue: Promise<unknown> = Promise.resolve();
const organizationId = '00000000-0000-0000-0000-000000000001';

export function productionDatabase(): PrismaClient {
  return context.getStore() || (database ||= new PrismaClient());
}
export function registerProfiles(name: string, registry: Map<string, any>) {
  registries.set(name, registry);
}
function key() {
  const value = Buffer.from(process.env.CARRIER_ENCRYPTION_KEY || '', 'base64');
  if (value.length !== 32) throw new Error('Production encryption key is missing');
  return value;
}
function encode(value: unknown) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(), iv);
  const body = Buffer.concat([cipher.update(JSON.stringify(value)), cipher.final()]);
  return [iv, cipher.getAuthTag(), body].map(b => b.toString('base64')).join('.');
}
function decode(value: string) {
  const [iv, tag, body] = value.split('.').map(b => Buffer.from(b, 'base64'));
  const cipher = createDecipheriv('aes-256-gcm', key(), iv);
  cipher.setAuthTag(tag);
  return JSON.parse(Buffer.concat([cipher.update(body), cipher.final()]).toString());
}
export async function loadProductionProfiles() {
  if (env.NODE_ENV !== 'production') return;
  const rows = await productionDatabase().$queryRawUnsafe<Array<{name: string; payload: string}>>('SELECT name, payload FROM "RuntimeRegistry"');
  for (const row of rows) {
    const registry = registries.get(row.name);
    if (!registry) continue;
    registry.clear();
    for (const [id, value] of decode(row.payload)) registry.set(id, value);
  }
}
async function persist(tx: any, before: Map<string, string>) {
  for (const name of ['managers', 'agents', 'clients']) {
    const registry = registries.get(name);
    if (!registry || JSON.stringify([...registry]) === before.get(name)) continue;
    const previous = new Map<string, any>(JSON.parse(before.get(name) || '[]'));
    for (const value of registry.values()) {
      if (JSON.stringify(previous.get(value.id)) === JSON.stringify(value)) continue;
      await tx.user.update({where: {id: value.userId}, data: {
        email: value.email, name: `${value.firstName || ''} ${value.lastName || ''}`.trim() || value.username,
        status: value.status === 'INACTIVE' ? 'SUSPENDED' : value.status,
      }});
      const users = registries.get('users');
      const identity = users && [...users.values()].find(user => user.id === value.userId);
      if (identity) {
        users!.delete(identity.email);
        Object.assign(identity, {email: value.email, firstName: value.firstName, lastName: value.lastName,
          status: value.status === 'INACTIVE' ? 'SUSPENDED' : value.status, customPermissions: value.permissions,
          managerId: name === 'managers' ? value.id : value.managerId || null,
          agentId: name === 'agents' ? value.id : value.agentId || null,
          clientId: name === 'clients' ? value.id : null});
        users!.set(identity.email, identity);
      }
      if (name === 'managers') {
        const data = {userId: value.userId, organizationId};
        await tx.managerProfile.upsert({where: {id: value.id}, create: {id: value.id, ...data}, update: data});
      } else if (name === 'agents') {
        const data = {userId: value.userId, organizationId, managerProfileId: value.managerId || null};
        await tx.agent.upsert({where: {id: value.id}, create: {id: value.id, ...data}, update: data});
      } else {
        const data = {name: value.companyName || value.username, organizationId, agentId: value.agentId || null};
        await tx.client.upsert({where: {id: value.id}, create: {id: value.id, ...data}, update: data});
        await tx.clientUser.upsert({where: {clientId_userId: {clientId: value.id, userId: value.userId}}, create: {clientId: value.id, userId: value.userId}, update: {}});
      }
    }
  }
  for (const [name, registry] of registries) {
    if (JSON.stringify([...registry]) === before.get(name)) continue;
    await tx.$executeRawUnsafe('INSERT INTO "RuntimeRegistry" (name,payload) VALUES ($1,$2) ON CONFLICT (name) DO UPDATE SET payload=EXCLUDED.payload', name, encode([...registry]));
  }
}

// Existing profile services share maps. Serialize their operations and commit
// the maps plus relational identity changes in the same PostgreSQL transaction.
// Run one application process; multiple workers need row-based repositories.
export function persistProfileService(service: any) {
  if (env.NODE_ENV !== 'production') return;
  for (const name of Object.getOwnPropertyNames(service)) {
    const method = service[name];
    if (typeof method !== 'function' || method.constructor.name !== 'AsyncFunction' || name.startsWith('initializeSeed')) continue;
    service[name] = async function (...args: any[]) {
      if (context.getStore()) return method.apply(this, args);
      const run = queue.catch(() => {}).then(async () => {
        const before = new Map([...registries].map(([name, map]) => [name, JSON.stringify([...map])]));
        try {
          return await productionDatabase().$transaction(async tx => context.run(tx, async () => {
            const result = await method.apply(this, args);
            await persist(tx, before);
            return result;
          }), {timeout: 30000, maxWait: 10000});
        } catch (error) {
          for (const [name, snapshot] of before) {
            const map = registries.get(name)!;
            map.clear();
            for (const [id, value] of JSON.parse(snapshot)) map.set(id, value);
          }
          throw error;
        }
      });
      queue = run;
      return run;
    };
  }
}
