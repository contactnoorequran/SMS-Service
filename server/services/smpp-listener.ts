import smpp from 'smpp';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {constantEqual} from './carrier-security';
import {decodeDelivery, encodeSegments} from './smpp-transport';
import type {SmppConfig, CarrierDelivery, TrunkState} from './smpp-transport';

// One explicit connection per listening port, and one authenticated provider bind.
// No listener is started in DEMO mode or by a connection status check.
export class SmppListener {
  state: TrunkState = 'DISCONNECTED';
  lastError: string | null = null;
  private server: any;
  private peer: any;
  private peerMode = '';
  private sockets = new Set<any>();
  private heartbeat?: NodeJS.Timeout;
  private opening?: Promise<void>;
  private generation = 0;
  private pending = new Set<(e: Error) => void>();
  private inflight = 0;
  private nextSend = 0;
  constructor(readonly config: SmppConfig, private receive: (d: CarrierDelivery) => Promise<void>) {}

  connect(): Promise<void> {
    if(this.state === 'BOUND' || this.state === 'LISTENING')return Promise.resolve();
    if(this.opening)return this.opening;
    const generation = ++this.generation;
    this.opening = this.open(generation).finally(()=>{this.opening=undefined;});
    return this.opening;
  }
  private async open(generation:number) {
    this.state='CONNECTING';
    try {
      let options:any={};
      if(this.config.useTls){
        const keyFile=process.env.SMPP_SERVER_TLS_KEY_FILE, certFile=process.env.SMPP_SERVER_TLS_CERT_FILE;
        if(!keyFile||!certFile)throw Error('Configure SMPP server TLS key and certificate files');
        const [key,cert]=await Promise.all([readFile(keyFile),readFile(certFile)]);
        options={key,cert,minVersion:'TLSv1.2'};
      }
      if(generation!==this.generation)throw Error('Listener start cancelled');
      const server=smpp.createServer(options,(session:any)=>this.accept(session));
      this.server=server;server.maxConnections=16;
      server.on('error',()=>{if(generation===this.generation){this.lastError='SMPP listener failed. Check address, port availability and TLS files.';this.state='ERROR';}});
      await new Promise<void>((resolve,reject)=>{
        const failed=()=>reject(Error('SMPP listener could not open the configured address and port'));
        server.once('error',failed);
        server.listen(this.config.port,this.config.listenAddress||'127.0.0.1',()=>{server.off('error',failed);resolve();});
      });
      if(generation!==this.generation){server.close();throw Error('Listener start cancelled');}
      this.state='LISTENING';this.lastError=null;
    }catch(e){if(generation===this.generation){this.state='ERROR';this.lastError=(e as Error).message;}throw e;}
  }
  private accept(session:any) {
    session.on('error',()=>session.socket.destroy());
    const ip=String(session.socket.remoteAddress||'').replace(/^::ffff:/,'');
    const allowed=(this.config.allowedProviderIps||'').split(',').map(s=>s.trim());
    if(!allowed.includes(ip)||this.sockets.size>=8){session.socket.destroy();return;}
    this.sockets.add(session);
    let bound=false,inbound=0,windowStart=Date.now(),count=0;
    const bindDeadline=setTimeout(()=>session.socket.destroy(),10000);
    session.socket.setTimeout(90000,()=>session.socket.destroy());
    const respond=(pdu:any,status=0,extra:object={})=>{if(!session.socket.destroyed)session.send(pdu.response({command_status:status,...extra}));};
    const bind=(pdu:any)=>{
      if(bound){respond(pdu,5);return;}
      const expected=this.config.bindMode==='SMPP_RECEIVER'?'bind_receiver':this.config.bindMode==='SMPP_TRANSMITTER'?'bind_transmitter':'bind_transceiver';
      if(this.peer || pdu.command!==expected || pdu.interface_version!==0x34 || !constantEqual(String(pdu.system_id||''),this.config.systemId) || !constantEqual(String(pdu.password||''),this.config.password||'')){
        respond(pdu,0x0d);session.socket.end();return;
      }
      clearTimeout(bindDeadline);bound=true;this.peer=session;this.peerMode=pdu.command;
      this.state='BOUND';this.lastError=null;respond(pdu,0,{system_id:'SMS-Service'});this.scheduleHeartbeat();
    };
    for(const command of ['bind_receiver','bind_transmitter','bind_transceiver'])session.on(command,bind);
    session.on('enquire_link',(pdu:any)=>respond(pdu,bound?0:4));
    session.on('unbind',(pdu:any)=>{respond(pdu,bound?0:4);session.socket.end();});
    const receive=async(pdu:any)=>{
      if(!bound||this.peer!==session||this.peerMode==='bind_receiver'){respond(pdu,4);return;}
      if(Date.now()-windowStart>=1000){windowStart=Date.now();count=0;}
      if(inbound>=(this.config.windowSize||10)||++count>(this.config.throughputTps||10)){respond(pdu,0x58);return;}
      inbound++;
      try{await this.receive(decodeDelivery(pdu));respond(pdu,0,pdu.command==='submit_sm'?{message_id:randomUUID().replace(/-/g,'')}:{});}
      catch{respond(pdu,8);}finally{inbound--;}
    };
    session.on('submit_sm',receive);session.on('deliver_sm',receive);
    session.on('pdu',(pdu:any)=>{
      if(!pdu.isResponse()&&!['bind_receiver','bind_transmitter','bind_transceiver','enquire_link','unbind','submit_sm','deliver_sm'].includes(pdu.command)){
        session.send(new smpp.PDU('generic_nack',{sequence_number:pdu.sequence_number,command_status:bound?3:4}));
      }
    });
    session.on('close',()=>{
      clearTimeout(bindDeadline);this.sockets.delete(session);
      if(this.peer===session){this.peer=undefined;clearTimeout(this.heartbeat);for(const fail of [...this.pending])fail(Error('Provider disconnected; delivery outcome may be unknown'));if(this.server?.listening)this.state='LISTENING';}
    });
  }
  private request(command:string,params:object):Promise<any>{
    const peer=this.peer;
    if(!peer)return Promise.reject(Error('Waiting for provider to bind to this listener'));
    return new Promise((resolve,reject)=>{
      const fail=(e:Error)=>{clearTimeout(timer);this.pending.delete(fail);reject(e);};
      const timer=setTimeout(()=>{fail(Error('Provider response timed out'));peer.socket.destroy();},10000);
      this.pending.add(fail);
      try{peer[command](params,(pdu:any)=>{clearTimeout(timer);this.pending.delete(fail);pdu.command_status?reject(Error('Provider rejected '+command)):resolve(pdu);});}catch{fail(Error('Provider request failed'));}
    });
  }
  private scheduleHeartbeat(){
    clearTimeout(this.heartbeat);this.heartbeat=setTimeout(async()=>{try{await this.request('enquire_link',{});if(this.peer)this.scheduleHeartbeat();}catch{this.peer?.socket.destroy();}},this.config.enquireLinkIntervalMs||30000);
  }
  async send(from:string,to:string,body:string,onAccepted?:(id:string)=>Promise<void>){
    if(this.state!=='BOUND'||this.peerMode==='bind_transmitter')throw Error('Provider must bind as receiver or transceiver before receiving messages');
    if(this.inflight>=(this.config.windowSize||10))throw Error('SMPP delivery window full');
    const peer=this.peer;this.inflight++;const ids:string[]=[];
    try{for(const segment of encodeSegments(body)){
      const wait=Math.max(0,this.nextSend-Date.now());this.nextSend=Math.max(Date.now(),this.nextSend)+1000/(this.config.throughputTps||10);
      if(wait)await new Promise(r=>setTimeout(r,wait));
      if(this.peer!==peer||this.state!=='BOUND')throw Error('Provider bind changed during delivery');
      const pdu=await this.request('deliver_sm',{source_addr:from,destination_addr:to.replace(/^\+/,''),source_addr_ton:this.config.sourceTon??5,source_addr_npi:this.config.sourceNpi??0,dest_addr_ton:this.config.destTon??1,dest_addr_npi:this.config.destNpi??1,registered_delivery:0,...segment});
      const id=pdu.message_id||'peer-ack-'+randomUUID();ids.push(id);await onAccepted?.(id);
    }return ids;}finally{this.inflight--;}
  }
  disconnect(){
    this.generation++;clearTimeout(this.heartbeat);
    for(const fail of [...this.pending])fail(Error('Listener stopped'));
    for(const peer of this.sockets)peer.socket.destroy();this.sockets.clear();this.peer=undefined;
    this.server?.close();this.server=undefined;this.state='DISCONNECTED';
  }
}
