#!/usr/bin/env node
/** P19: original DOS source-list -> user-presentation queue and APNG parity.
 * This is NOT an original native frame timing test or full P16 collection scan.
 * node scripts/verify-mk2-p19-source-order-queue.cjs <original MK2 dir> [report.json]
 */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
let ts;try{ts=require('typescript')}catch{ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript')}
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(m,file)=>m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{fileName:file,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true,allowImportingTsExtensions:true}}).outputText,file);
if(!globalThis.crypto)globalThis.crypto=crypto.webcrypto;
const {buildMK2StageVisualAssetsP2P4}=require('../src/core/assets/mk2StageVisualIntegrationP2P4.ts');
const {buildMK2PitBridgeActorsP10}=require('../src/core/assets/mk2PitBridgeActorsP10.ts');
const {buildMK2OrderedSequenceBundlesP18}=require('../src/core/assets/mk2OrderedSequenceBundlesP18.ts');
const {resolveMK2OriginalSourceOrder}=require('../src/core/assets/mk2SourceOrderQueueP19.ts');
const {animatedPng,selectedZip}=require('../src/core/assets/export.ts');
const {parseAnimationStoreZip}=require('../src/games/mk1/research/browserAnimationExportBundleValidation.ts');
const root=process.argv[2];if(!root)throw Error('Pass original MK2 directory');
const entries=[];function walk(dir,prefix=''){for(const f of fs.readdirSync(dir,{withFileTypes:true})){
 const name=prefix?prefix+'/'+f.name:f.name,full=path.join(dir,f.name);
 if(f.isDirectory())walk(full,name);else if(f.isFile())entries.push({path:name,name:f.name,extension:path.extname(name).slice(1).toUpperCase(),size:fs.statSync(full).size});}}
walk(root);const source={directoryName:'Original DOS MK2',isSynthetic:false,
 async listRecursive(){return entries;},async readSlice(p,at,n){const fd=fs.openSync(path.join(root,p),'r');try{const buf=Buffer.alloc(n);const got=fs.readSync(fd,buf,0,n,at);return new Uint8Array(buf.subarray(0,got));}finally{fs.closeSync(fd);}}};
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');let checks=0;
const eq=(actual,expected,msg)=>{assert.deepStrictEqual(actual,expected,msg);checks++};
function rejected(sheet,map,label){assert.throws(()=>resolveMK2OriginalSourceOrder(sheet,map),/P19 verified source-order queue/,'reject '+label);checks++}
function apngChunks(bytes){
 const chunks=[];const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 eq(Buffer.from(bytes.slice(0,8)).toString('hex'),'89504e470d0a1a0a','APNG signature');
 for(let p=8;p<bytes.length;){
  assert.ok(p+12<=bytes.length,'APNG chunk header');const n=view.getUint32(p),type=Buffer.from(bytes.subarray(p+4,p+8)).toString('ascii');
  assert.ok(p+12+n<=bytes.length,'APNG chunk body');chunks.push({type,length:n,start:p});p+=n+12;
  if(type==='IEND')break;
 }return chunks;
}
(async()=>{
 const stages=await buildMK2StageVisualAssetsP2P4(source);
 const bridge=await buildMK2PitBridgeActorsP10(source);
 eq(stages.status.P2.status,'VERIFIED','O136 stage source');eq(bridge.status.status,'VERIFIED','O220/221 bridge source');
 const result=buildMK2OrderedSequenceBundlesP18(stages.assets,bridge.assets);
 eq(result.status.status,'VERIFIED','P18 original groups');eq(result.assets.length,8,'eight sheets');
 const frames=[...stages.assets,...bridge.assets].filter(x=>x.id.startsWith('mk2-stage-effect:')||x.id.startsWith('mk2-pit-bridge:'));
 const lookup=new Map([...frames,...result.assets].map(x=>[x.id,x]));
 let ordered=0;let apngPixels=0;
 for(const sheet of result.assets){
  const q=resolveMK2OriginalSourceOrder(sheet,lookup);const ids=sheet.metadata.sourceOrderAssetIds;
  eq(q.frames.map(x=>x.id),ids,'preserved original list ordering');
  eq(q.frames.length,sheet.metadata.frameCount,'all original source frames');
  eq(q.sourceListObject2,sheet.metadata.sourceListObject2,'original EXE pointer');
  eq(q.originalControl,sheet.metadata.sourceControl,'source loop/end token unchanged');
  eq(q.timing,'USER_SELECTED_PRESENTATION_ONLY','never assert native timing');
  eq(q.frames.every(x=>x.metadata.indices instanceof Uint8Array&&x.metadata.mask instanceof Uint8Array),true,'original indexed sidecars preserved');
  const selected=parseAnimationStoreZip(selectedZip(q.frames));
  eq([...selected.keys()].filter(x=>x.startsWith('assets/')).length,ids.length,'queue selected ZIP all original PNGs');
  eq([...selected.keys()].filter(x=>x.startsWith('indexed/')).length,ids.length*2,'queue exact indexed+opacity planes');
  const ms=137, anim=animatedPng(q.frames,ms),chunks=apngChunks(anim),v=new DataView(anim.buffer,anim.byteOffset,anim.byteLength);
  eq(chunks.filter(c=>c.type==='fcTL').length,ids.length,'APNG exact frame count');
  eq(chunks.filter(c=>c.type==='acTL').length,1,'APNG exactly one animation control');
  const actl=chunks.find(c=>c.type==='acTL');
  eq(v.getUint32(actl.start+12),0,'APNG loop count zero: presentation-only repetition, even for original zero-terminated lists');
  const frameChunks=chunks.filter(c=>c.type==='fcTL');
  for(const ch of frameChunks){eq(v.getUint16(ch.start+8+20),ms,'APNG user-supplied numerator');eq(v.getUint16(ch.start+8+22),1000,'APNG chosen presentation denominator');}
  eq(chunks.at(-1)?.type,'IEND','valid complete APNG');
  ordered+=q.frames.length;apngPixels+=q.frames.reduce((n,f)=>n+f.width*f.height,0);
  const m=sheet.metadata;
  const clone=(patch)=>({...sheet,metadata:{...m,...patch}});
  rejected(clone({sourceOrderAssetIds:[...ids].reverse()}),lookup,'reversed original list');
  rejected(clone({sourceOrderAssetIds:[ids[0],...ids.slice(0,-1)]}),lookup,'duplicated original frame');
  rejected(clone({sourceFrameTimingKnown:true}),lookup,'invented native milliseconds');
  rejected(clone({sourceControl:'UNKNOWN'}),lookup,'invented source terminator');
  rejected(clone({contactSheetIsDiagnostic:false}),lookup,'mislabelled placement');
  const missing=new Map(lookup);missing.delete(ids[0]);rejected(sheet,missing,'missing source frame');
  const corrupt=new Map(lookup),f=corrupt.get(ids[0]);corrupt.set(ids[0],{...f,metadata:{...f.metadata,indices:new Uint8Array(1)}});rejected(sheet,corrupt,'corrupt original indices');
 }
 eq(ordered,57,'57 original frames in 8 authentic lists');
 rejected({...frames[0],metadata:{...frames[0].metadata,sourceOrderAssetIds:['fake']}},lookup,'ordinary frame cannot masquerade as group');
 const report={pass:'P19',status:'PASS',checks,sourceTracks:result.assets.length,originalOrderedFrames:ordered,originalFramePixelsReExported:apngPixels,
  presentationMillisecondsTested:137,nativeFrameTimeKnown:false,originalPaletteOwnershipKnown:false,
  canonicalOriginalFixture:true,currentFullP16P17P18ScannerVerified:false};
 if(process.argv[3])fs.writeFileSync(process.argv[3],JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
})().catch(err=>{console.error(err.stack||err);process.exitCode=1});
