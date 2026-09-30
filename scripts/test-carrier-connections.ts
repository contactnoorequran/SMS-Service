import assert from 'node:assert/strict';
import { test, after } from 'node:test';
import { createHmac, generateKeyPairSync, sign, randomBytes } from 'node:crypto';
import http from 'node:http';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import smpp from 'smpp';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = '';
process.env.CARRIER_ENCRYPTION_KEY = randomBytes(32).toString('base64');
const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'sms-carrier-test-'));
process.env.CARRIER_DEMO_FILE = path.join(directory, 'demo.json');
const security = await import('../server/services/carrier-security');
const {connectionSchema} = await import('../server/services/carrier-config');
const {CarrierStore, safeConnection} = await import('../server/services/carrier-store');
const {testCarrier, sendCarrier, stopCarrierRuntime} = await import('../server/services/carrier-runtime');
const {SmppSession, encodeSegments, decodeDelivery} = await import('../server/services/smpp-transport');
const {canViewMessage} = await import('../server/controllers/carrier.controller');
after(async () => { stopCarrierRuntime(); await fs.rm(directory, {recursive: true, force: true}); });

test('credentials encrypt, decrypt and reject tampered ciphertext', () => {
  const encrypted = security.encryptSecrets({password:'secret12',apiKey:'private-key'});
  assert.ok(!encrypted.includes('private-key'));
  assert.deepEqual(security.decryptSecrets(encrypted), {password:'secret12',apiKey:'private-key'});
  const chunks=encrypted.split('.'); const data=Buffer.from(chunks[3],'base64'); data[0]^=1; chunks[3]=data.toString('base64');
  assert.throws(()=>security.decryptSecrets(chunks.join('.')));
});
test('HMAC callback rejects changed body and expired timestamp', () => {
  const timestamp=String(Math.floor(Date.now()/1000)), body=Buffer.from('{"id":"one"}');
  const signature=createHmac('sha256','callback-secret').update(timestamp+'.').update(body).digest('hex');
  assert.equal(security.validateHmac('callback-secret',timestamp,body,signature),true);
  assert.equal(security.validateHmac('callback-secret',timestamp,Buffer.from('changed'),signature),false);
  assert.equal(security.validateHmac('callback-secret',timestamp,body,signature,Date.now()+600000),false);
});
test('Twilio callback binds signature to canonical URL and sorted form fields',()=>{
  const url='https://sms.example.com/api/messages/callbacks/one';
  const params={To:'+15555550123',Body:'hello',From:'+15555550456'};
  const signature=createHmac('sha1','token').update(url+'BodyhelloFrom+15555550456To+15555550123').digest('base64');
  assert.equal(security.validateTwilio('token',url,params,signature),true);
  assert.equal(security.validateTwilio('token',url+'?changed=1',params,signature),false);
});
test('Telnyx callback verifies Ed25519 over timestamp and raw bytes',()=>{
  const pair=generateKeyPairSync('ed25519'); const key=pair.publicKey.export({type:'spki',format:'der'}).subarray(-32).toString('base64');
  const timestamp=String(Math.floor(Date.now()/1000)), body=Buffer.from('{"data":{}}');
  const signature=sign(null,Buffer.concat([Buffer.from(timestamp+'|'),body]),pair.privateKey).toString('base64');
  assert.equal(security.validateTelnyx(key,timestamp,body,signature),true);
  assert.equal(security.validateTelnyx(key,timestamp,Buffer.from('{}'),signature),false);
});
test('network guard rejects loopback, metadata and mapped private addresses',async()=>{
  for(const ip of ['127.0.0.1','10.1.2.3','169.254.169.254','172.16.0.1','192.168.1.1','::1','::ffff:127.0.0.1','fc00::1']) assert.equal(security.isPublicAddress(ip),false,ip);
  assert.equal(security.isPublicAddress('8.8.8.8'),true);
  delete process.env.CARRIER_ALLOWED_PRIVATE_HOSTS;
  await assert.rejects(security.resolveCarrierHost('127.0.0.1'));
});
test('HTTP request performs real loopback request and does not follow redirects',async()=>{
  process.env.CARRIER_ALLOWED_PRIVATE_HOSTS='127.0.0.1'; let hits=0;
  const server=http.createServer((req,res)=>{hits++;if(req.url==='/redirect'){res.writeHead(302,{Location:'http://169.254.169.254/latest'});res.end();}else{res.end('{"ok":true}');}});
  await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${(server.address() as any).port}`;
  try{assert.equal((await security.carrierRequest(base,'GET',{})).status,200); assert.equal((await security.carrierRequest(base+'/redirect','GET',{})).status,302);assert.equal(hits,2);}
  finally{await new Promise<void>(resolve=>server.close(()=>resolve()));delete process.env.CARRIER_ALLOWED_PRIVATE_HOSTS;}
});
test('demo HTTP and SMPP are editable, persisted and never report live delivery',async()=>{
  const provider=await CarrierStore.demoProvider(); assert.equal(provider.connections.length,2);
  for(const id of ['demo-http','demo-smpp']){
    const connection=await CarrierStore.getById(id);
    assert.equal(safeConnection(connection).status,'DEMO');
    assert.equal((await testCarrier(connection)).demo,true);
    const result=await sendCarrier(connection,'DEMO','+15555550123','hello','test-key');
    assert.equal(result.status,'SIMULATED');
  }
  const saved=await CarrierStore.save('demo-carrier',{name:'Edited Demo',systemId:'test-system'},'demo-smpp');
  assert.equal(saved.name,'Edited Demo');assert.equal((await CarrierStore.getById('demo-smpp')).config.systemId,'test-system');
  assert.ok(!(JSON.stringify(saved).includes('"secrets"')));
  await assert.rejects(CarrierStore.save('demo-carrier',{secrets:{password:'must-not-save'}},'demo-smpp'));
});
test('message stream scoping fails closed for missing client/agent associations',async()=>{
  const client:any={role:{name:'CLIENT'},clientId:'client-1'};
  assert.equal(await canViewMessage(client,{clientId:'client-2'}),false);
  assert.equal(await canViewMessage(client,{clientId:'client-1'}),true);
  assert.equal(await canViewMessage({role:{name:'AGENT'}} as any,{agentId:null}),false);
  assert.equal(await canViewMessage(undefined,{}),false);
});
test('GSM extension characters and Unicode segment without broken code points',()=>{
  const ascii=encodeSegments('^'.repeat(90));assert.equal(ascii.length,2);
  assert.ok(ascii.every(p=>p.short_message.length<=160));
  const unicode=encodeSegments('😀'.repeat(80));assert.ok(unicode.length>1);
  const decoded=unicode.map(p=>smpp.encodings.UCS2.decode(p.short_message.subarray(6))).join('');
  assert.equal(decoded,'😀'.repeat(80));
});
test('delivery receipts are distinct from SMS and multipart headers are decoded',()=>{
  assert.deepEqual(decodeDelivery({source_addr:'a',destination_addr:'b',esm_class:4,short_message:{message:'id:abc stat:DELIVRD'}}).receipt,{id:'abc',state:'DELIVRD'});
  const result=decodeDelivery({source_addr:'a',destination_addr:'b',esm_class:64,short_message:{message:'part',udh:[Buffer.from([0,3,7,2,1])]}});
  assert.deepEqual(result.part,{reference:7,total:2,sequence:1});
});
async function withSmsc(handler:(session:any)=>void, run:(port:number)=>Promise<void>) {
  process.env.CARRIER_ALLOWED_PRIVATE_HOSTS='127.0.0.1';
  const sessions:any[]=[];
  const server=smpp.createServer((session:any)=>{sessions.push(session);session.on('error',()=>{});session.on('unbind',(p:any)=>{session.send(p.response());session.close();});handler(session);});
  await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
  try{await run(server.address().port);}finally{for(const s of sessions)s.socket.destroy();await new Promise<void>(resolve=>server.close(resolve));delete process.env.CARRIER_ALLOWED_PRIVATE_HOSTS;}
}
const config=(port:number,bindMode:any='SMPP_TRANSCEIVER')=>({providerId:'test',connectionId:'test-connection',host:'127.0.0.1',port,systemId:'test',password:'password',bindMode,useTls:false,requestTimeoutMs:300,reconnectIntervalMs:60000});
test('SMPP binds in selected mode and submits an actual PDU to local SMSC',async()=>{
  let received:any;
  await withSmsc(session=>{session.on('bind_transmitter',(p:any)=>session.send(p.response()));session.on('submit_sm',(p:any)=>{received=p;session.send(p.response({message_id:'sms-1'}));});},async port=>{
    const client=new SmppSession(config(port,'SMPP_TRANSMITTER'),async()=>{});
    try{await client.connect();assert.equal(client.state,'BOUND');assert.deepEqual(await client.send('DEMO','+15555550123','hello'),['sms-1']);assert.equal(received.short_message.message,'hello');}finally{client.disconnect();}
  });
});
test('SMPP rejects invalid bind response instead of reporting connected',async()=>{
  await withSmsc(session=>session.on('bind_transceiver',(p:any)=>session.send(p.response({command_status:14}))),async port=>{
    const client=new SmppSession(config(port),async()=>{});try{await assert.rejects(client.connect(),/rejected/);assert.notEqual(client.state,'BOUND');}finally{client.disconnect();}
  });
});
test('SMPP does not ACK before persistence and NACKs storage failure',async()=>{
  let serverSession:any;let release!:()=>void;let entered!:()=>void;let acknowledged=false;let fail=false;
  const processing=new Promise<void>(r=>entered=r); const gate=new Promise<void>(r=>release=r);
  await withSmsc(session=>{serverSession=session;session.on('bind_receiver',(p:any)=>session.send(p.response()));},async port=>{
    const client=new SmppSession(config(port,'SMPP_RECEIVER'),async()=>{entered();await gate;if(fail)throw Error('Database failed');});
    try{
      await client.connect();
      const ack=new Promise<any>(resolve=>serverSession.deliver_sm({source_addr:'DEMO',destination_addr:'15555550123',short_message:'hello'},(p:any)=>{acknowledged=true;resolve(p);}));
      await processing; assert.equal(acknowledged,false);release();assert.equal((await ack).command_status,0);
      fail=true;const nack=await new Promise<any>(resolve=>serverSession.deliver_sm({source_addr:'DEMO',destination_addr:'15555550123',short_message:'fail'},resolve));assert.equal(nack.command_status,8);
      await assert.rejects(client.send('a','+15555550123','no'),/transmitter/);
    }finally{client.disconnect();}
  });
});
test('missing heartbeat responses close the stale bind',async()=>{
  await withSmsc(session=>session.on('bind_transceiver',(p:any)=>session.send(p.response())),async port=>{
    const client=new SmppSession({...config(port),enquireLinkIntervalMs:30,requestTimeoutMs:60},async()=>{});
    try{await client.connect();await new Promise(resolve=>setTimeout(resolve,180));assert.notEqual(client.state,'BOUND');}finally{client.disconnect();}
  });
});

test('provider list and details expose editable demo HTTP and SMPP connections', async () => {
  const {ProviderService} = await import('../server/services/provider.service');
  const list = await ProviderService.listProviders();
  assert.equal(list.items[0].id, 'demo-carrier');
  const detail = await ProviderService.getProviderById('demo-carrier');
  assert.ok(detail);
  assert.ok(detail.connections.some(c => c.id === 'demo-http'));
  assert.ok(detail.connections.some(c => c.id === 'demo-smpp'));
  assert.equal((await ProviderService.listProviders({search:'nonexistent'})).total, 0);
});
test('real routes protect provider edits and message streams and reject demo callbacks', async () => {
  const {createExpressApp} = await import('../server/app');
  const server = createExpressApp().listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const base = 'http://127.0.0.1:' + (server.address() as any).port;
  try {
    for (const [method, route] of [['GET','/api/providers'],['PUT','/api/providers/demo-carrier/connections/demo-http'],['GET','/api/messages/stream'],['POST','/api/messages/callbacks/demo-http']]) {
      const response = await fetch(base+route, {method});
      assert.equal(response.status, 401, method+' '+route);
      await response.text();
    }
  } finally { await new Promise<void>(resolve => server.close(() => resolve())); }
});
