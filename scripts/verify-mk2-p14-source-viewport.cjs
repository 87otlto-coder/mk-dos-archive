#!/usr/bin/env node
/* P14: independent O110C 7-source normalized viewport checks and negative controls. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
let ts;try{ts=require('typescript')}catch{ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript')}
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(m,file)=>m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{fileName:file,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,file);
if(!globalThis.crypto)globalThis.crypto=crypto.webcrypto;
const {buildMK2NativeViewportFloorsP14}=require('../src/core/assets/mk2NativeFloorViewportsP14.ts');
const {selectedZip}=require('../src/core/assets/export.ts');
const {parseAnimationStoreZip}=require('../src/games/mk1/research/browserAnimationExportBundleValidation.ts');
const reference=require('./fixtures/mk2-p14-stage-neutral-viewport-parity.json');
const root=process.argv[2];if(!root)throw Error('usage: verify-mk2-p14-source-viewport.cjs <canonical MK2 folder> [report.json]');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');const fixture=new Map();
for(const name of ['mk2.exe',...reference.resources.map(x=>x.filename)])fixture.set(name,new Uint8Array(fs.readFileSync(path.join(root,name))));
function source(map){return {directoryName:'P14 canonical original MK2',isSynthetic:false,
 async listRecursive(){return [...map].map(([p,b])=>({name:path.basename(p),path:p,size:b.length,extension:path.extname(p).slice(1).toUpperCase()}));},
 async readSlice(p,start,len){const b=map.get(p);if(!b)throw Error('missing original file '+p);return b.slice(start,start+len);}}}
let checks=0;function eq(x,y,label){assert.deepStrictEqual(x,y,label);checks++}
(async()=>{
 eq(sha(fixture.get('mk2.exe')),reference.originalExeSha256,'canonical EXE identity');
 const r=await buildMK2NativeViewportFloorsP14(source(fixture));
 eq(r.status.status,'VERIFIED','all original stage source resources qualified');eq(r.status.count,7,'seven source floor viewport assets');
 eq(r.assets.length,7,'seven new source stage PNGs');eq(new Set(r.assets.map(a=>a.id)).size,7,'all native viewport IDs distinct');
 eq(r.packages.length,1,'one source evidence ZIP');
 const z=parseAnimationStoreZip(r.packages[0].bytes),m=JSON.parse(new TextDecoder().decode(z.get('manifest.json').bytes));
 eq(m.completeStageComposition,false,'no complete stage claim');eq(m.runtimeCameraKnown,false,'no runtime camera');eq(m.paletteKnown,false,'no authentic RGB palette');eq(m.records.length,7,'all seven independently qualified records');
 eq([...z.keys()].filter(k=>k.startsWith('preview/')).length,7,'all 7 diagnostic previews');
 eq([...z.keys()].filter(k=>k.startsWith('indexed/')).length,21,'21 lossless original-pixel/paint/color-unknown payloads');
 for(const ref of reference.resources){
  const original=fixture.get(ref.filename);
  eq(sha(original),ref.resourceSHA256,'authentic original '+ref.filename);
  const a=r.assets.find(a=>a.id===`mk2-viewport-floor:${ref.label}:x288-bank1`);
  eq(Boolean(a),true,`${ref.filename} asset present`);
  eq(a.kind,'stage','source-only stage qualifier '+ref.filename);eq(a.width,320,'source pixel projection width '+ref.filename);eq(a.height,ref.nativeRows,'original source rows '+ref.filename);
  eq(a.source.offset,ref.sourceOffset,'original GRA source offset '+ref.filename);eq(a.source.length,ref.nativeRows*896,'source suffix extent '+ref.filename);
  eq(a.metadata.originalPaletteKnown,false,'unknown source palette '+ref.filename);eq(a.metadata.originalRuntimeCameraKnown,false,'unknown gameplay camera '+ref.filename);
  eq(a.metadata.completeStageComposition,false,'no full scene '+ref.filename);eq(a.metadata.sourceX,288,'normalized source input x=288 '+ref.filename);
  eq(a.metadata.sourceBankStart,1,'normalized hypothetical palette bank start 1 '+ref.filename);
  eq(sha(a.metadata.indices),ref.indicesSHA256,'independently decoded O110C pixel hash '+ref.filename);
  const resultIndices=a.metadata.indices;
  eq(resultIndices.length,320*ref.nativeRows,'exact native row count '+ref.filename);
  eq(Math.min(...resultIndices),ref.indicesMinMax[0],'source minimum '+ref.filename);
  eq(Math.max(...resultIndices),ref.indicesMinMax[1],'source maximum '+ref.filename);
  eq(a.metadata.mask.every(v=>v===1),true,'all exported projected bytes opaque '+ref.filename);
  eq(a.metadata.paletteKnownMask.every(v=>v===0),true,'all palette colours unknown '+ref.filename);
  const previewBytes=z.get(`preview/${ref.label}_x288_bank1_320x${ref.nativeRows}.png`).bytes;
  const png=s => z.get(s).bytes;
  eq(previewBytes[0],137,'real PNG for '+ref.filename);
  eq(sha(png(`indexed/${ref.label}_x288_bank1.indices.bin`)),ref.indicesSHA256,'ZIP index parity '+ref.filename);
  eq(sha(png(`indexed/${ref.label}_x288_bank1.mask.bin`)),sha(a.metadata.mask),'ZIP mask parity '+ref.filename);
  eq(sha(png(`indexed/${ref.label}_x288_bank1.palette-known.bin`)),sha(a.metadata.paletteKnownMask),'ZIP unknown-colour parity '+ref.filename);
  for(let p=0;p<resultIndices.length;p++){
    eq(a.rgba[p*4],resultIndices[p],`numeric grayscale R ${ref.label}:${p}`);
    eq(a.rgba[p*4+1],resultIndices[p],`numeric grayscale G ${ref.label}:${p}`);
    eq(a.rgba[p*4+2],resultIndices[p],`numeric grayscale B ${ref.label}:${p}`);
    eq(a.rgba[p*4+3],255,`opaque preview ${ref.label}:${p}`);
  }
 }
 const selected=[r.assets[0],r.assets[3],r.assets[5]];const s=parseAnimationStoreZip(selectedZip(selected));
 eq([...s.keys()].filter(k=>k.startsWith('assets/')).length,3,'mixed 3 assets exported');
 eq([...s.keys()].filter(k=>k.startsWith('indexed/')).length,9,'all three raw/mask/known planes exported');
 const sm=JSON.parse(new TextDecoder().decode(s.get('manifest.json').bytes));
 eq(sm.selectionOrder.map(x=>x.id),selected.map(x=>x.id),'source selection preserved');
 for(let i=0;i<selected.length;i++)for(const field of ['indices','mask','paletteKnownMask']){
  const file=`indexed/${String(i).padStart(5,'0')}_${field}.bin`;
  eq(sha(s.get(file).bytes),sha(selected[i].metadata[field]),`selected ZIP lossless ${i}:${field}`);
 }
 // Missing/altered/duplicated source: no fabricated viewport from that resource.
 for(const name of ['mk2.exe','tomb.gra','portal.gra']){
  const altered=new Map(fixture),broken=fixture.get(name).slice();broken[0]^=1;altered.set(name,broken);
  const t=await buildMK2NativeViewportFloorsP14(source(altered));
  eq(t.assets.length,name==='mk2.exe'?0:6,'tampered '+name+' fail-closed but independent sources retained');
  eq(t.status.status,name==='mk2.exe'?'UNAVAILABLE':'PARTIAL','tampered '+name+' status');
  const missing=new Map(fixture);missing.delete(name);
  const u=await buildMK2NativeViewportFloorsP14(source(missing));
  eq(u.assets.length,name==='mk2.exe'?0:6,'missing '+name+' never falsely qualified');
  const duplicate=new Map(fixture);duplicate.set(name.toUpperCase(),fixture.get(name));
  const d=await buildMK2NativeViewportFloorsP14(source(duplicate));
  eq(d.assets.length,name==='mk2.exe'?0:6,'ambiguous '+name+' rejected');
 }
 const o={pass:'P14',status:'PASS',checks,newNativeViewportPreviews:r.assets.length,canonicalOriginalEXE:reference.originalExeSha256,sourceResearch:'O110C',nativeProjection:'320 x source rows, source-x 288, hypothetical bank base 1',runtimeColorKnown:false,runtimeCameraKnown:false,completeStageScenes:false,evidencePackageSHA256:sha(r.packages[0].bytes),negativeFixtureVariants:9,gameMediaCommitted:false};
 if(process.argv[3])fs.writeFileSync(process.argv[3],JSON.stringify(o,null,2)+'\n');
 if(process.argv[4])fs.writeFileSync(process.argv[4],r.packages[0].bytes);
 console.log(JSON.stringify(o,null,2));
})().catch(err=>{console.error(err.stack||err);process.exitCode=1});
