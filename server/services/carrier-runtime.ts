import { createHash, randomUUID } from 'node:crypto';
import { getPrismaClient } from '../db/prisma';
import { CarrierStore, SavedConnection, safeConnection } from './carrier-store';
import { smppManager, CarrierDelivery } from './smpp-transport';
import { MessagingService } from './messaging.service';
import { testHttp, sendHttp } from './carrier-http';

const digest = (s: string) => createHash('sha256').update(s).digest('hex');
const tests = new Map<string, {status: string; lastPingMs: number; lastSuccessAt?: string; lastError?: string}>();
const registered = new Map<string, string>();
let timer: NodeJS.Timeout | undefined;
let stopping = false;
export function publicConnection(c: SavedConnection) { return {...safeConnection(c), ...(c.config.mode === 'LIVE' && c.config.connectionType === 'HTTP_REST' ? tests.get(c.id) : {})}; }
export async function recordReceipt(c: SavedConnection, id: string, state: string) {
  const db = getPrismaClient() as any; if (!db) throw new Error('Database unavailable');
  const key = digest(`receipt:${c.id}:${id}:${state}`);
  await db.carrierEvent.upsert({where: {key}, create: {key, providerId: c.providerId, connectionId: c.id, kind: 'RECEIPT', status: state, payload: {providerMessageId: id}}, update: {}});
}
export async function receiveSmpp(c: SavedConnection, delivery: CarrierDelivery) {
  if (delivery.receipt) { await recordReceipt(c, delivery.receipt.id, delivery.receipt.state); return; }
  const db = getPrismaClient() as any; if (!db) throw new Error('Database unavailable');
  const identity = digest(`${c.id}:${delivery.from}:${delivery.to}:${delivery.part?.reference ?? ''}:${delivery.part?.total ?? ''}`);
  if (delivery.part) {
    const complete = await db.$transaction(async (tx: any) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${identity}, 0))`;
      let group = await tx.carrierEvent.findFirst({where: {connectionId: c.id, kind: 'PARTS', groupKey: identity, expiresAt: {gt: new Date()}}, orderBy: {createdAt: 'desc'}});
      const segments = {...(group?.payload as any)?.segments};
      const previous = segments[delivery.part!.sequence];
      if (previous !== undefined && previous !== delivery.body) throw new Error('Conflicting multipart segment; refusing to mix messages');
      segments[delivery.part!.sequence] = delivery.body;
      const payload = {segments, from: delivery.from, to: delivery.to, total: delivery.part!.total};
      group = group ? await tx.carrierEvent.update({where: {key: group.key}, data: {payload}}) : await tx.carrierEvent.create({data: {key: randomUUID(), providerId: c.providerId, connectionId: c.id, kind: 'PARTS', groupKey: identity, status: 'ASSEMBLING', payload, expiresAt: new Date(Date.now()+10*60*1000)}});
      if (Object.keys(segments).length !== delivery.part!.total) return null;
      return {id: group.key, body: Array.from({length: delivery.part!.total}, (_,i) => segments[i+1]).join('')};
    });
    if (!complete) return; // Segment is durable before acknowledgement.
    await MessagingService.ingestInboundMessage({providerId: c.providerId, providerMessageId: `smpp-parts:${complete.id}`, fromNumber: delivery.from, toNumber: delivery.to, body: complete.body});
    await db.carrierEvent.update({where: {key: complete.id}, data: {status: 'COMPLETE'}});
    return;
  }
  // SMPP MO has no mandatory globally unique message ID. A short retry window is documented.
  const fingerprint = digest(`${identity}:${delivery.body}`);
  const event = await db.$transaction(async (tx: any) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${fingerprint}, 0))`;
    const existing = await tx.carrierEvent.findFirst({where: {groupKey: fingerprint, kind: 'MO', expiresAt: {gt: new Date()}}});
    return existing || tx.carrierEvent.create({data: {key: randomUUID(), providerId: c.providerId, connectionId: c.id, groupKey: fingerprint, kind: 'MO', status: 'RECEIVED', payload: delivery, expiresAt: new Date(Date.now()+60000)}});
  });
  await MessagingService.ingestInboundMessage({providerId: c.providerId, providerMessageId: `smpp:${event.key}`, fromNumber: delivery.from, toNumber: delivery.to, body: delivery.body});
}
export function registerSmpp(c: SavedConnection) {
  const f = c.config;
  return smppManager.registerTrunk({direction: f.smppDirection, listenAddress: f.listenAddress, allowedProviderIps: f.allowedProviderIps, providerId: c.providerId, connectionId: c.id, host: f.host, port: f.port, systemId: f.systemId, password: c.secrets.password,
    bindMode: f.connectionType as any, systemType: f.systemType, useTls: f.tlsEnabled, enquireLinkIntervalMs: f.enquireLinkIntervalSec*1000,
    reconnectIntervalMs: f.reconnectIntervalSec*1000, throughputTps: f.throughputTps, windowSize: f.windowSize,
    sourceTon: f.sourceTon, sourceNpi: f.sourceNpi, destTon: f.destTon, destNpi: f.destNpi,
  }, delivery => receiveSmpp(c, delivery));
}
export async function testCarrier(c: SavedConnection) {
  const started = Date.now();
  if (c.config.mode === 'DEMO') return {success: true, demo: true, latencyMs: 0, message: 'DEMO: local simulation passed. No carrier was contacted.'};
  try {
    if(c.config.connectionType !== 'HTTP_REST' && c.config.smppDirection === 'SERVER') {
      const state=smppManager.getTrunkStatus(c.id);
      if(state !== 'BOUND' && state !== 'LISTENING')throw new Error('Listener is not running. Save LIVE mode with Enable checked and wait for startup.');
      return {success:true,demo:false,latencyMs:0,message:state === 'BOUND' ? 'Provider authenticated and bound to our SMPP listener. SMS delivery is not verified.' : 'Listener is running. Waiting for the provider to connect; public reachability is not verified.'};
    }
    if (c.config.connectionType === 'HTTP_REST') await testHttp(c);
    else {
      const session = smppManager.get(c.id) || registerSmpp(c);
      try { await session.connect(); } finally { if (!c.config.enabled) smppManager.stopTrunk(c.id); }
    }
    const latencyMs = Date.now()-started;
    tests.set(c.id, {status: 'CONNECTED', lastPingMs: latencyMs, lastSuccessAt: new Date().toISOString()});
    return {success: true, demo: false, latencyMs, message: 'Live carrier handshake verified. SMS delivery has not been tested.'};
  } catch (error) {
    tests.set(c.id, {status: 'ERROR', lastPingMs: Date.now()-started, lastError: 'Carrier handshake failed'});
    throw error;
  }
}
export async function sendCarrier(c: SavedConnection, from: string, to: string, body: string, idempotencyKey: string) {
  if (c.config.mode === 'DEMO') return {demo: true, status: 'SIMULATED', providerMessageIds: [`demo-${digest(idempotencyKey).slice(0,16)}`], message: 'Demo only. No SMS was sent or billed.'};
  if (!c.config.enabled) throw new Error('Enable the live connection before submitting messages');
  const db = getPrismaClient() as any; if (!db) throw new Error('Database unavailable');
  const key = digest(`outbound:${c.id}:${idempotencyKey}`);
  const contentHash = digest(JSON.stringify({from,to,body}));
  let event: any;
  try { event = await db.carrierEvent.create({data: {key, providerId: c.providerId, connectionId: c.id, kind: 'OUTBOUND', status: 'SUBMITTING', payload: {from,to,contentHash,providerMessageIds: []}}}); }
  catch (error: any) {
    if (error.code !== 'P2002') throw error;
    event = await db.carrierEvent.findUnique({where: {key}});
    if (event?.payload?.contentHash !== contentHash) throw new Error('Idempotency key already used for different content');
    return {status: event.status === 'SUBMITTING' ? 'UNKNOWN_OR_IN_PROGRESS' : event.status, providerMessageIds: event.payload.providerMessageIds, duplicate: true};
  }
  const ids: string[] = [];
  const accepted = async (id: string) => { ids.push(id); await db.carrierEvent.update({where: {key}, data: {payload: {...event.payload, providerMessageIds: ids}}}); };
  try {
    if (c.config.connectionType === 'HTTP_REST') await accepted(await sendHttp(c, from, to, body));
    else {
      const session = smppManager.get(c.id) || registerSmpp(c); await session.connect(); await session.send(from,to,body,accepted);
    }
    await db.carrierEvent.update({where: {key}, data: {status: 'ACCEPTED'}});
    return {status: 'ACCEPTED', providerMessageIds: ids};
  } catch {
    await db.carrierEvent.update({where: {key}, data: {status: ids.length ? 'PARTIAL_OR_UNKNOWN' : 'UNKNOWN'}});
    throw new Error('Submission did not complete. Inspect carrier records before retrying; the same idempotency key will not resend.');
  }
}
export function startCarrierRuntime() {
  stopping = false;
  const tick = async () => {
    try {
      const db = getPrismaClient();
      if (db) {
        const rows = await db.providerConnection.findMany({where: {connectionType: 'SMPP', status: 'ACTIVE', provider: {status: 'ACTIVE'}}});
        const active = new Set<string>();
        for (const row of rows) {
          try {
            const c = await CarrierStore.getById(row.id);
            if (c.config.mode !== 'LIVE' || !c.config.enabled) continue;
            active.add(c.id); const revision = row.updatedAt.toISOString();
            if (!stopping && (registered.get(c.id) !== revision || !smppManager.get(c.id))) {
              registerSmpp(c); registered.set(c.id, revision); void smppManager.startTrunk(c.id).catch(() => {});
            }
          } catch { smppManager.stopTrunk(row.id); registered.delete(row.id); }
        }
        for (const id of registered.keys()) if (!active.has(id)) { smppManager.stopTrunk(id); registered.delete(id); }
      }
    } catch { /* Retain live sessions during a transient database outage; ingestion NACKs safely. */ }
    finally { if (!stopping) { timer = setTimeout(tick, 10000); timer.unref(); } }
  };
  void tick();
}
export function stopCarrierRuntime() { stopping = true; clearTimeout(timer); registered.clear(); smppManager.shutdown(); }
