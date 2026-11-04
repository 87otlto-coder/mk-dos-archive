#!/usr/bin/env node
// O109H independent raw-score-to-MIDI comparison. Never imports Python producer or its stream manifest.
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
const [fixture,dir]=process.argv.slice(2);if(!fixture||!dir)throw Error('args: mk2-directory output-directory');
let n=0;const ok=(b,m)=>{n++;if(!b)throw Error('FAIL '+m)};
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const profile={gvs:{driver:'grv.bin',pins:{0x90:[0x849,'8a45083c0b7730'],0x92:[0x8a6,'8a45083c0b7709'],0x93:[0x397,'aca21902'],0x98:[0x3a4,'8b7506c3'],0x9b:[0x8eb,'8a45080cb0']}},awe:{driver:'awe.bin',pins:{0x90:[0x13e7,'8a45083c0b773c'],0x92:[0x144b,'8a45083c0b7711'],0x93:[0xd02,'aca2870b'],0x98:[0xd0f,'8b7506c3'],0x9b:[0x14a4,'8a45080657']}},sbl:{driver:'sbl.bin',pins:{0x90:[0xc21,'ac3a4509751c'],0x92:[0xc75,'c6451640ac'],0x93:[0x396,'aca21602'],0x98:[0x3a3,'8b7506c3'],0x9b:[0xd39,'acc3']}}};
const argc={0x90:1,0x91:0,0x92:1,0x93:1,0x94:0,0x95:1,0x96:1,0x97:1,0x98:0,0x99:0,0x9a:0,0x9b:1,0x9c:0,0x9d:2};
const vlq=x=>{ok(x>=0&&x<0x10000000,'VLQ range');let a=[x%128];x=Math.floor(x/128);while(x>0){a.unshift((x%128)|128);x=Math.floor(x/128)}return Buffer.from(a)};
const chunk=(t,b)=>{const header=Buffer.alloc(8);header.write(t,0,'ascii');header.writeUInt32BE(b.length,4);return Buffer.concat([header,b])};
function track(items){items=items.map((e,i)=>({...e,idx:i})).sort((a,b)=>a.t-b.t||a.p-b.p||a.idx-b.idx);let out=[],prior=0;for(const e of items){ok(e.t>=prior,'chronology');out.push(vlq(e.t-prior),e.msg);prior=e.t}out.push(Buffer.from([0,0xff,0x2f,0]));return chunk('MTrk',Buffer.concat(out))}
const midi=(s,streams,family)=>{
 const ppqn=s.clock&255,bpm=s.clock>>8;ok(ppqn===96&&bpm>0,'native PPQN and clock');
 let tempo=[{t:0,p:0,msg:Buffer.from([0xff,0x51,3,...[...Buffer.from([0,0,0,0])].slice(1)])}], midiTracks=[];tempo[0].msg=tempoMeta(bpm);
 for(const st of streams){let time=0,voice=null,prev=null,events=[];
 for(const ev of st){time+=ev.dt;const op=ev.op,a=ev.params;
 if(op<=0x7f){ok(a.length===1&&voice!==null,'note parameter');prev=op;if(voice<=11)events.push({t:time,p:10,msg:Buffer.from([0x90+voice,op,a[0]])})}
 else if(op<=0x8f){voice=op&15}
 else if(op===0x90){if(voice!==null&&voice<12)events.push({t:time,p:10,msg:Buffer.from([0x90+voice,a[0],0])})}
 else if(op===0x99){if(prev!==null&&voice!==null&&voice<12)events.push({t:time,p:10,msg:Buffer.from([0x90+voice,prev,0])})}
 else if(op===0x92){if(voice!==null&&voice<12)events.push({t:time,p:5,msg:Buffer.from([0xc0+voice,a[0]])})}
 else if(op===0x93){ok(a[0]>0,'tempo argument');tempo.push({t:time,p:0,msg:tempoMeta(a[0])})}
 else if([0x95,0x96,0x9b,0x9d].includes(op)){
 if((family==='sbl'&&[0x95,0x9b,0x9d].includes(op))||voice===null||voice>=12)continue;
 let msg;if(op===0x95)msg=Buffer.from([0xe0+voice,0,a[0]]);
 if(op===0x96)msg=Buffer.from([0xb0+voice,7,a[0]]);
 if(op===0x9b)msg=Buffer.from([0xb0+voice,10,a[0]]);
 if(op===0x9d)msg=Buffer.from([0xb0+voice,a[0],a[1]]);
 events.push({t:time,p:5,msg})
 }
 else if([0x91,0x98].includes(op)){ok(ev===st.at(-1),'terminal position');if(voice!==null&&voice<12)events.push({t:time,p:30,msg:Buffer.from([0xb0+voice,123,0])})}
 else ok([0x94,0x97,0x9a,0x9c].includes(op),'known native opcode');
 }
 if(!events.length||Math.max(...events.map(x=>x.t))<time)events.push({t:time,p:31,msg:Buffer.from([0xff,1,0])});midiTracks.push(track(events))
 }
 const header=Buffer.alloc(6);header.writeUInt16BE(1,0);header.writeUInt16BE(midiTracks.length+1,2);header.writeUInt16BE(ppqn,4);
 return Buffer.concat([chunk('MThd',header),track(tempo),...midiTracks])
};
function tempoMeta(bpm){const usec=Math.round(60000000/bpm);return Buffer.from([0xff,0x51,3,(usec>>16)&255,(usec>>8)&255,usec&255])}
const data=JSON.parse(fs.readFileSync(path.join(dir,'O109H_DEVICE_MIDI_PROXY_PROVENANCE.json'),'utf8'));
ok(data.checkpoint==='O109H','checkpoint');ok(data.songs.length===99,'99 scores');
ok(data.deviceSemantics.GVS.includes('UltraMID patches'),'GVS timbral limitation documented');
ok(data.deviceSemantics.AWE.includes('proprietary synthesizer'),'AWE timbral limitation documented');
ok(data.deviceSemantics.SBL.includes('not General MIDI'),'FM patch not GM');
for(const song of data.songs){const expected={gvs:'native GUS patch timbre unavailable',awe:'exact EMU8000 patch bank/sound unavailable',sbl:'original OPL patch and waveform NOT converted'}[song.device];ok(song.fidelity.includes(expected),'fidelity policy '+song.source)}
for(const [ext,pr] of Object.entries(profile)){
 const bytes=fs.readFileSync(path.join(fixture,pr.driver));ok(sha(bytes)===data.nativeDriverAnchors[ext].sha256,'driver hash '+ext);
 for(const [op,[offset,hex]] of Object.entries(pr.pins)){ok(bytes.subarray(offset,offset+hex.length/2).toString('hex')===hex,'driver opcode anchor '+ext+'/'+op)}
}
const counters={};let totals={files:0,streams:0,events:0,midiBytes:0};
for(const info of data.songs){
 const family=info.device, b=fs.readFileSync(path.join(fixture,'sound',info.source));ok(sha(b)===info.sourceSHA256,'source sha '+info.source);
 const L=b.readUInt16LE(1);ok(b[0]===1,'header version');ok(b.readUInt16LE(L)===L+2,'directory pointer');const clock=b.readUInt16LE(L+2),nc=b[L+4];
 ok(L+5+2*nc===b.length,'header length');const starts=Array.from({length:nc},(_,i)=>b.readUInt16LE(L+5+2*i));ok(starts[0]===3,'stream start');
 const streams=[];for(let j=0;j<nc;j++){
 let i=starts[j],end=starts[j+1]??L;ok(i<end,'bounds');let operations=[];
 while(i<end){let dt=0,c=0,part;do{ok(i<end&&c<5,'delta');part=b[i++];dt=(dt<<7)|(part&127);c++}while(part&128);
 ok(i<end,'opcode');const op=b[i++];let ac;if(op<128)ac=1;else if(op<144)ac=0;else {ok(op in argc,'op spec');ac=argc[op]};ok(i+ac<=end,'argument bounds');const params=b.subarray(i,i+ac);i+=ac;operations.push({dt,op,params});totals.events++;
 }
 ok(operations.length&&[0x91,0x98].includes(operations.at(-1).op),'terminal');streams.push(operations);totals.streams++
 }
 const expected=midi({clock},streams,family),file=path.join(dir,info.output);const actual=fs.readFileSync(file);
 ok(actual.equals(expected),'independent MIDI byte reconstruction '+info.source);ok(sha(actual)===info.midiSHA256,'MIDI digest');ok(actual.length===info.midiBytes,'MIDI length');ok(info.ppqn===96&&info.initialBpm===clock>>8&&info.tracks===nc+1,'MIDI metadata');ok(info.sourceCommands===streams.reduce((a,s)=>a+s.length,0),'command count');
 totals.files++;totals.midiBytes+=actual.length;counters[family]=(counters[family]??0)+1;
}
for(const [f,num] of Object.entries(counters))ok(num===33,'file count '+f);
console.log(JSON.stringify({verifier:'independent_raw_score_to_SMF',checks:n,failures:0,counts:totals,devices:counters,warning:'Proof of source-derived musical transcription only, not authentic FM/GUS/AWE hardware timbre'}));
