#!/usr/bin/env node
/** P64 ORIGINAL MK2 score-provenance and selected-MIDI readback.
 * Usage: node scripts/verify-mk2-p64-scores.cjs <canonical-original-MK2-directory> [PRIVATE-report.json]
 * Reads original DOS files; never stores commercial files in the source checkout.
 */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),ts=require('typescript');
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(m,f)=>m._compile(
 ts.transpileModule(fs.readFileSync(f,'utf8'),{fileName:f,
 compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
if(!globalThis.crypto)globalThis.crypto=crypto.webcrypto;
const {scanAssets}=require('../src/core/assets/collection.ts');
const {selectedZip}=require('../src/core/assets/export.ts');
const {parseAnimationStoreZip}=require('../src/games/mk1/research/browserAnimationExportBundleValidation.ts');
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const input=process.argv.slice(2);
assert(input.length===1||input.length===2,'original MK2 directory and optional private report path');
const checkout=fs.realpathSync(path.resolve(__dirname,'..')),folder=fs.realpathSync(input[0]);
const inside=(a,b)=>{const r=path.relative(a,b);return r===''||(!r.startsWith('..'+path.sep)&&r!=='..'&&!path.isAbsolute(r));};
assert(fs.statSync(folder).isDirectory()&&!inside(checkout,folder),'original MK2 directory must remain outside checkout');
const reportPath=input[1]&&path.resolve(input[1]);
if(reportPath)assert(!inside(checkout,reportPath)&&!inside(folder,reportPath),'private report must stay outside checkout/originals');
const content=new Map();
function walk(at,prefix=''){for(const e of fs.readdirSync(at,{withFileTypes:true})){
 const p=prefix?prefix+'/'+e.name:e.name,full=path.join(at,e.name);
 if(e.isDirectory())walk(full,p);else if(e.isFile())content.set(p,new Uint8Array(fs.readFileSync(full)));
}}walk(folder);
const entries=[...content].map(([p,b])=>({path:p,name:path.basename(p),extension:path.extname(p).slice(1).toUpperCase(),size:b.length}));
const originalExe=entries.filter(e=>e.name.toUpperCase()==='MK2.EXE');
assert.equal(originalExe.length,1);
assert.equal(sha(content.get(originalExe[0].path)),
 'fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65');
const originalScores=entries.filter(e=>e.extension==='MID').sort((a,b)=>a.path.localeCompare(b.path));
assert.equal(originalScores.length,33,'canonical installation has 33 Sound Images scores');
const source={directoryName:'P64 original MK2',isSynthetic:false,
 async listRecursive(){return entries;},
 async readSlice(p,start,len){const b=content.get(p);if(!b)throw Error('missing original '+p);return b.slice(start,start+len);}};
function independent(bytes){
 assert(bytes.length>=8 && bytes[0]===1);
 const little=(p)=>{assert(p+2<=bytes.length);return bytes[p]|bytes[p+1]<<8;};
 const table=little(1),song=little(table),ppqn=bytes[song],bpm=bytes[song+1],count=bytes[song+2];
 assert(ppqn>0&&bpm>0&&count>0&&count<=16&&song+3+2*count<=bytes.length&&table<=bytes.length-2);
 let events=[],tempos=[{tick:0,track:-1,data:tempo(bpm)}],bounds=[],maxTick=0;
 for(let t=0;t<count;t++){
  const start=little(song+3+2*t);let p=start,tick=0,lastNote=0,ch=0,loop=start;
  const next=()=>{assert(p<table,'score event crossed source table');return bytes[p++];};
  const delta=()=>{let n=0;for(let i=0;i<5;i++){const x=next();n=n*128+(x&127);if(x<128)return n;}throw Error('invalid native delta');};
  const emit=data=>events.push({tick,track:t,data});
  tick=delta();let done=false;
  for(let steps=0;steps<200000;steps++){
   const op=next();
   if(op<128){lastNote=op;const velocity=next();assert(ch<=11);emit([0x90|ch,op,velocity]);}
   else if(op<0x90)ch=op&15;
   else if(op===0x90)emit([0x90|ch,next(),0]);
   else if(op===0x91){emit([0xb0|ch,123,0]);bounds.push({start,end:p,tick,opcode:op,loopOffset:null});done=true;}
   else if(op===0x92)emit([0xc0|ch,next()]);
   else if(op===0x93){const nbpm=next();assert(nbpm>0);tempos.push({tick,track:t,data:tempo(nbpm)});}
   else if(op===0x94){}
   else if(op===0x95)emit([0xe0|ch,0,next()]);
   else if(op===0x96)emit([0xb0|ch,7,next()]);
   else if(op===0x97)next();
   else if(op===0x98){bounds.push({start,end:p,tick,opcode:op,loopOffset:loop});done=true;}
   else if(op===0x99)emit([0x90|ch,lastNote,0]);
   else if(op===0x9b)emit([0xb0|ch,10,next()]);
   else if(op===0x9c)loop=p;
   else if(op===0x9d)emit([0xb0|ch,next(),next()]);
   else if(op===0xff){}
   else throw Error('unknown native source command '+op);
   if(done)break;
   tick+=delta();assert(tick<=10000000);
  }
  assert(done);maxTick=Math.max(maxTick,tick);
 }
 return {ppqn,bpm,bounds,maxTick,events:[...events,...tempos].sort((a,b)=>a.tick-b.tick||a.track-b.track)};
}
function tempo(bpm){const n=Math.round(60000000/bpm);return [255,81,3,(n>>>16)&255,(n>>>8)&255,n&255];}
function midiEvents(b){
 const u32=p=>(b[p]*0x1000000)+(b[p+1]<<16)+(b[p+2]<<8)+b[p+3],u16=p=>(b[p]<<8)|b[p+1];
 assert.equal(String.fromCharCode(...b.subarray(0,4)),'MThd');
 assert.equal(u32(4),6);assert.equal(u16(8),0);assert.equal(u16(10),1);
 assert.equal(String.fromCharCode(...b.subarray(14,18)),'MTrk');
 const end=22+u32(18);assert.equal(end,b.length);
 let p=22,tick=0,records=[],endTick=-1;
 const one=()=>{assert(p<end);return b[p++];};
 const vlq=()=>{let v=0;for(let i=0;i<4;i++){const q=one();v=v*128+(q&127);if(q<128)return v;}throw Error('bad MIDI delta');};
 while(p<end){
  tick+=vlq();const status=one();
  if(status===0xff){
   const type=one(),length=vlq(),payload=[...b.subarray(p,p+length)];assert.equal(payload.length,length);p+=length;
   if(type===0x2f){assert.equal(length,0);assert.equal(p,end);endTick=tick;break;}
   if(type===0x51){assert.equal(length,3);records.push({tick,data:[255,81,3,...payload]});}
   else throw Error('unexpected generated meta event '+type);
  }else{
   assert(status>=0x80&&status<0xf0,'no running status or system messages in generated MIDI');
   const size=((status&0xf0)===0xc0||(status&0xf0)===0xd0)?1:2;
   const data=[status];for(let j=0;j<size;j++){const q=one();assert(q<128);data.push(q);}
   records.push({tick,data});
  }
 }
 assert.equal(p,end);assert(endTick>=0);
 return {ppqn:u16(12),events:records,endTick};
}
function member(map,name){const v=map.get(name);assert(v,'missing selected ZIP member '+name);return v.bytes;}
(async()=>{
 const c=await scanAssets(source,'mk2',()=>{});assert.equal(c.assets.length,5369);assert.equal(new Set(c.assets.map(x=>x.id)).size,5369);
 const raw=c.assets.filter(x=>x.group==='Original music sequences'&&x.kind==='raw');
 const midi=c.assets.filter(x=>x.group==='MK2 MIDI music'&&x.kind==='sequence');
 assert.equal(raw.length,33);assert.equal(midi.length,33);
 const reports=c.reports.music;assert.equal(reports.length,33);
 const selected=[...raw,...midi];
 const zip=parseAnimationStoreZip(selectedZip(selected));
 const manifest=JSON.parse(new TextDecoder().decode(member(zip,'manifest.json')));
 assert.equal(manifest.format,'mkdos_selected_assets_v1');assert.equal(manifest.selectionOrder.length,66);
 const originalByPath=new Map(originalScores.map(e=>[e.path.toLowerCase(),e]));
 let tracks=0,loops=0,stops=0,sourceMidiEvents=0;
 for(const [i,a]of selected.entries()){
  const entryName='assets/'+String(i).padStart(5,'0')+'_'+a.filename.replace(/[^a-zA-Z0-9_.-]/g,'_').slice(0,180);
  assert.deepStrictEqual(member(zip,entryName),a.bytes,'selected ZIP byte parity: '+a.id);
  assert.deepStrictEqual(manifest.selectionOrder[i].source,a.source,'selected export source identity');
  assert.deepStrictEqual(manifest.selectionOrder[i].metadata.p64ScoreProvenance,a.metadata.p64ScoreProvenance);
 }
 for(const e of originalScores){
  const original=content.get(e.path),a=c.assets.find(x=>x.id==='raw:'+e.path),m=c.assets.find(x=>x.id==='midi:'+e.path);
  assert(a&&m,'original score missing from catalogue '+e.path);
  assert.deepStrictEqual(a.bytes,original);
  const digest=sha(original);assert.equal(a.source.sha256,digest);assert.equal(m.source.sha256,digest);
  assert.equal(a.source.offset,0);assert.equal(m.source.offset,0);assert.equal(a.source.length,original.length);
  const oracle=independent(original),p=m.metadata.p64ScoreProvenance;
  assert.equal(p.sourceSha256,digest);assert.equal(p.originalTrackCount,oracle.bounds.length);
  assert.equal(p.initialTicksPerQuarterNote,oracle.ppqn);assert.equal(p.initialBpm,oracle.bpm);
  assert.equal(p.exportedMidiSha256,sha(m.bytes));
  for(let t=0;t<oracle.bounds.length;t++){
   const n=oracle.bounds[t],v=p.sourceTrackBoundaries[t];
   assert.equal(v.sourceStart,n.start);assert.equal(v.sourceEnd,n.end);
   assert.equal(v.oneTraversalEndTick,n.tick);assert.equal(v.terminalSourceOffset,n.end-1);
   assert.equal(v.terminalOpcode,'0x'+n.opcode.toString(16));
   assert.equal(v.nativeRepeatBoundary,n.opcode===0x98);
   assert.equal(v.savedRepeatCursorOffset,n.opcode===0x98?n.loopOffset:null);
   assert.equal(v.runtimeRepeatCountVerified,false);
   tracks++;if(n.opcode===0x98)loops++;else stops++;
  }
  const decoded=midiEvents(m.bytes);
  assert.equal(decoded.ppqn,oracle.ppqn);assert.equal(decoded.endTick,oracle.maxTick);
  assert.deepStrictEqual(decoded.events,oracle.events.map(({tick,data})=>({tick,data})),'independent MIDI event/tempo order '+e.path);
  sourceMidiEvents+=oracle.events.length;
  assert.equal(p.runtimeLoopDurationVerified,false);
  assert.equal(p.nativeInstrumentTimbreVerified,false);
  assert.equal(a.metadata.originalScoreDecodeStatus,'VERIFIED');
 }
 assert.equal(tracks,212);assert.equal(loops,82);assert.equal(stops,130);
 assert(reports.every(x=>x.status==='VERIFIED'));
 const result={pass:'P64',status:'PASS',mk2Assets:5369,originalScores:33,
  originalStreams:tracks,repeatBoundaries:loops,stopBoundaries:stops,
  independentlyComparedMidiEvents:sourceMidiEvents,selectedZipScoreEntries:66,
  allOriginalSourceHashesAndOffsetsMatched:true,selectedZipPreservedSource:true,
  allMidiBytesAndEventTicksMatched:true,runtimeLoopDurationsClaimed:false,
  nativeTimbreOrOriginalPlaybackClaimed:false,interactiveBrowserExportVerified:false};
 if(reportPath){fs.mkdirSync(path.dirname(reportPath),{recursive:true});fs.writeFileSync(reportPath,JSON.stringify(result,null,2)+'\n');}
 console.log(JSON.stringify(result,null,2));
})().catch(err=>{console.error(err.stack||err);process.exitCode=1;});
