import smpp from 'smpp';
import {SmppListener} from './smpp-listener';
import { randomBytes } from 'node:crypto';
import { resolveCarrierHost } from './carrier-security';

export interface SmppConfig {
  direction?: 'CLIENT' | 'SERVER'; listenAddress?: string; allowedProviderIps?: string;
  providerId: string; connectionId: string; host: string; port: number; systemId: string; password?: string;
  bindMode?: 'SMPP_RECEIVER' | 'SMPP_TRANSMITTER' | 'SMPP_TRANSCEIVER'; systemType?: string; useTls?: boolean;
  enquireLinkIntervalMs?: number; reconnectIntervalMs?: number; requestTimeoutMs?: number;
  throughputTps?: number; windowSize?: number; sourceTon?: number; sourceNpi?: number; destTon?: number; destNpi?: number;
}
export type TrunkState = 'DISCONNECTED' | 'CONNECTING' | 'BOUND' | 'ERROR' | 'LISTENING';
export interface CarrierDelivery { from: string; to: string; body: string; receipt?: { id: string; state: string }; part?: { reference: number; total: number; sequence: number }; }
export function decodeDelivery(pdu: any): CarrierDelivery {
  const content = pdu.message_payload || pdu.short_message;
  const body = typeof content === 'string' ? content : content?.message;
  if (typeof body !== 'string') throw new Error('Unsupported SMS encoding');
  const result: CarrierDelivery = {from: String(pdu.source_addr), to: String(pdu.destination_addr), body};
  if ((pdu.esm_class & 0x3c) === 4 || (pdu.esm_class & 0x3c) === 0x20) {
    const id = pdu.receipted_message_id || /\bid:([^ ]+)/.exec(body)?.[1];
    const state = pdu.message_state !== undefined ? String(pdu.message_state) : /\bstat:([^ ]+)/.exec(body)?.[1];
    if (!id || !state) throw new Error('Invalid delivery receipt');
    result.receipt = {id: String(id), state}; return result;
  }
  if (pdu.sar_msg_ref_num !== undefined) result.part = {reference: pdu.sar_msg_ref_num, total: pdu.sar_total_segments, sequence: pdu.sar_segment_seqnum};
  for (const udh of content?.udh || []) {
    if (udh[0] === 0 && udh.length === 5) result.part = {reference: udh[2], total: udh[3], sequence: udh[4]};
    if (udh[0] === 8 && udh.length === 6) result.part = {reference: udh.readUInt16BE(2), total: udh[4], sequence: udh[5]};
  }
  if (result.part && (!Number.isInteger(result.part.total) || result.part.total < 1 || result.part.total > 255 || result.part.sequence < 1 || result.part.sequence > result.part.total)) throw new Error('Invalid multipart SMS');
  return result;
}
export function encodeSegments(text: string) {
  const gsm = smpp.encodings.ASCII.match(text);
  const encoding = gsm ? smpp.encodings.ASCII : smpp.encodings.UCS2;
  if (encoding.encode(text).length <= (gsm ? 160 : 140)) return [{data_coding: gsm ? 0 : 8, short_message: encoding.encode(text)}];
  const limit = gsm ? 153 : 134;
  const parts: Buffer[] = []; let part = '';
  for (const char of text) {
    if (encoding.encode(part + char).length > limit) { parts.push(encoding.encode(part)); part = ''; }
    part += char;
  }
  if (part) parts.push(encoding.encode(part));
  if (parts.length > 255) throw new Error('Message exceeds 255 segments');
  const reference = randomBytes(1)[0];
  return parts.map((body, i) => ({data_coding: gsm ? 0 : 8, esm_class: 0x40, short_message: Buffer.concat([Buffer.from([5,0,3,reference,parts.length,i+1]), body])}));
}
export class SmppSession {
  state: TrunkState = 'DISCONNECTED';
  lastError: string | null = null;
  private session: any;
  private running = false;
  private generation = 0;
  private heartbeat?: NodeJS.Timeout;
  private reconnect?: NodeJS.Timeout;
  private pending = new Set<(error: Error) => void>();
  private inflight = 0;
  private inbound = 0;
  private nextSubmit = 0;
  private connectPromise?: Promise<void>;
  constructor(readonly config: SmppConfig, private receive: (delivery: CarrierDelivery) => Promise<void>) {}
  private request(command: string, params: object): Promise<any> {
    const session = this.session;
    return new Promise((resolve, reject) => {
      let timer: NodeJS.Timeout;
      const fail = (error: Error) => { clearTimeout(timer); this.pending.delete(fail); reject(error); };
      this.pending.add(fail);
      timer = setTimeout(() => { fail(new Error(`${command} response timed out`)); session?.socket?.destroy(); }, this.config.requestTimeoutMs || 10000);
      try {
        session[command](params, (pdu: any) => {
          clearTimeout(timer); this.pending.delete(fail);
          if (pdu.command_status) reject(new Error(`${command} rejected (0x${pdu.command_status.toString(16)})`)); else resolve(pdu);
        });
      } catch { fail(new Error(`${command} could not be sent`)); }
    });
  }
  connect(): Promise<void> {
    if (this.state === 'BOUND') return Promise.resolve();
    if (this.connectPromise) return this.connectPromise;
    this.running = true;
    this.connectPromise = this.open().finally(() => { this.connectPromise = undefined; });
    return this.connectPromise;
  }
  private async open() {
    this.state = 'CONNECTING'; const generation = ++this.generation;
    try {
      const address = await resolveCarrierHost(this.config.host);
      if (!this.running || generation !== this.generation) throw new Error('Connection cancelled');
      await new Promise<void>((resolve, reject) => {
        let settled = false;
        const finish = (error?: Error) => { if (settled) return; settled = true; clearTimeout(timer); error ? reject(error) : resolve(); };
        const timer = setTimeout(() => { finish(new Error('SMPP connect/bind timed out')); this.session?.socket?.destroy(); }, this.config.requestTimeoutMs || 10000);
        const session = smpp.connect({host: address.address, port: this.config.port, tls: !!this.config.useTls, servername: this.config.host, rejectUnauthorized: true, connectTimeout: this.config.requestTimeoutMs || 10000, auto_enquire_link_period: 0}, async () => {
          if (generation !== this.generation) return session.socket.destroy();
          try {
            const command = this.config.bindMode === 'SMPP_RECEIVER' ? 'bind_receiver' : this.config.bindMode === 'SMPP_TRANSMITTER' ? 'bind_transmitter' : 'bind_transceiver';
            await this.request(command, {system_id: this.config.systemId, password: this.config.password || '', system_type: this.config.systemType || '', interface_version: 0x34});
            this.state = 'BOUND'; this.lastError = null; finish(); this.scheduleHeartbeat();
          } catch (error) { finish(error as Error); session.socket.destroy(); }
        });
        this.session = session;
        session.on('error', () => { this.lastError = 'SMPP transport or TLS failure'; finish(new Error(this.lastError)); session.socket.destroy(); });
        session.on('close', () => {
          finish(new Error('SMPP connection closed'));
          if (generation !== this.generation) return;
          this.state = 'DISCONNECTED'; clearTimeout(this.heartbeat);
          for (const reject of [...this.pending]) reject(new Error('SMPP connection closed; delivery status may be unknown'));
          this.scheduleReconnect();
        });
        session.on('enquire_link', (pdu: any) => session.send(pdu.response()));
        session.on('unbind', (pdu: any) => { session.send(pdu.response()); session.close(); });
        session.on('deliver_sm', async (pdu: any) => {
          if (this.state !== 'BOUND' || this.config.bindMode === 'SMPP_TRANSMITTER') return session.send(pdu.response({command_status: 4}));
          if (this.inbound >= 100) return session.send(pdu.response({command_status: 0x58}));
          this.inbound++;
          try { await this.receive(decodeDelivery(pdu)); session.send(pdu.response()); }
          catch { session.send(pdu.response({command_status: 8})); }
          finally { this.inbound--; }
        });
      });
    } catch (error) {
      if (generation === this.generation) { this.state = 'ERROR'; this.lastError = (error as Error).message; this.scheduleReconnect(); }
      throw error;
    }
  }
  private scheduleHeartbeat() {
    clearTimeout(this.heartbeat);
    this.heartbeat = setTimeout(async () => {
      try { await this.request('enquire_link', {}); if (this.running) this.scheduleHeartbeat(); } catch { this.session?.socket?.destroy(); }
    }, this.config.enquireLinkIntervalMs || 30000);
  }
  private scheduleReconnect() {
    if (!this.running || this.reconnect) return;
    this.reconnect = setTimeout(() => { this.reconnect = undefined; if (this.running) void this.connect().catch(() => {}); }, this.config.reconnectIntervalMs || 10000);
  }
  disconnect() {
    this.running = false; this.generation++;
    clearTimeout(this.heartbeat); clearTimeout(this.reconnect); this.reconnect = undefined;
    for (const reject of [...this.pending]) reject(new Error('Connection stopped'));
    if (this.state === 'BOUND') { try { this.session.unbind(); } catch {} }
    this.session?.socket?.destroy(); this.state = 'DISCONNECTED';
  }
  async send(from: string, to: string, body: string, onAccepted?: (id: string) => Promise<void>) {
    if (this.state !== 'BOUND' || this.config.bindMode === 'SMPP_RECEIVER') throw new Error('An active transmitter/transceiver bind is required');
    if (this.inflight >= (this.config.windowSize || 10)) throw new Error('SMPP send window full; retry with backoff');
    this.inflight++; const ids: string[] = [];
    try {
      for (const segment of encodeSegments(body)) {
        const wait = Math.max(0, this.nextSubmit - Date.now());
        this.nextSubmit = Math.max(Date.now(), this.nextSubmit) + 1000 / (this.config.throughputTps || 10);
        if (wait) await new Promise(resolve => setTimeout(resolve, wait));
        if (this.state !== 'BOUND') throw new Error('Bind disconnected during submission');
        const response = await this.request('submit_sm', {
          source_addr: from, destination_addr: to.replace(/^\+/, ''), source_addr_ton: this.config.sourceTon ?? 5,
          source_addr_npi: this.config.sourceNpi ?? 0, dest_addr_ton: this.config.destTon ?? 1, dest_addr_npi: this.config.destNpi ?? 1,
          registered_delivery: 1, ...segment,
        });
        ids.push(String(response.message_id)); await onAccepted?.(String(response.message_id));
      }
      return ids;
    } finally { this.inflight--; }
  }
}
class SmppConnectionManager {
  private sessions = new Map<string, SmppSession | SmppListener>();
  registerTrunk(config: SmppConfig, receive: (delivery: CarrierDelivery) => Promise<void>) {
    this.stopTrunk(config.connectionId);
    const session = config.direction === 'SERVER' ? new SmppListener(config, receive) : new SmppSession(config, receive); this.sessions.set(config.connectionId, session); return session;
  }
  get(id: string) { return this.sessions.get(id); }
  async startTrunk(id: string) { const session = this.sessions.get(id); if (!session) throw new Error('Connection not registered'); await session.connect(); }
  stopTrunk(id: string) { this.sessions.get(id)?.disconnect(); this.sessions.delete(id); }
  getTrunkStatus(id: string): TrunkState { return this.sessions.get(id)?.state || 'DISCONNECTED'; }
  shutdown() { for (const session of this.sessions.values()) session.disconnect(); this.sessions.clear(); }
}
export const smppManager = new SmppConnectionManager();
