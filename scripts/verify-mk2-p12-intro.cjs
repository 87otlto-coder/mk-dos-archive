#!/usr/bin/env node
/* Original MK2 O110B/O110E independent parity; no game data checked into Git.
 * node scripts/verify-mk2-p12-intro.cjs <canonical MK2 folder> [report.json]
 * The 31 SHA-256 triples were built with the original, independently verified
 * Python O110B (GIF/Pillow pixel checks) and O110E (DAC6 original instruction
 * + PNG/mask validation) implementations; this script tests new TS code.
 */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
let ts;try{ts=require('typescript')}catch{ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript')}
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(m,file)=>m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{fileName:file,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,file);
if(!globalThis.crypto)globalThis.crypto=crypto.webcrypto;
const {buildMK2IntroLzwP12}=require('../src/core/assets/mk2IntroLzwP12.ts');
const {selectedZip}=require('../src/core/assets/export.ts');
const {parseAnimationStoreZip}=require('../src/games/mk1/research/browserAnimationExportBundleValidation.ts');
const reference=require('./fixtures/mk2-p12-intro-independent-parity.json');
const directory=process.argv[2];if(!directory)throw Error('Usage: verify-mk2-p12-intro.cjs <canonical MK2 folder> [report.json]');
const base=new Map();for(const name of ['mk2.exe','probe.gra','acclaim.gra'])base.set(name,new Uint8Array(fs.readFileSync(path.join(directory,name))));
function makeSource(files){return {directoryName:'original MK2 fixture (P12)',isSynthetic:false,async listRecursive(){return [...files].map(([p,b])=>({path:p,name:p,extension:p.split('.').pop().toUpperCase(),size:b.length}));},async readSlice(p,offset,length){const b=files.get(p);if(!b)throw Error('Missing original '+p);return b.slice(offset,offset+length);}}}
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');let checks=0;
const eq=(a,b,label)=>{assert.deepStrictEqual(a,b,label);checks++;};
(async()=>{
 eq(sha(base.get('mk2.exe')),reference.canonicalExeSha256,'original EXE identity');
 for(const [name,spec] of Object.entries(reference.resources))eq(sha(base.get(name)),spec.sha256,'original '+name);
 const {assets,status}=await buildMK2IntroLzwP12(makeSource(base));
 eq(status.status,'VERIFIED','new source assets qualified');eq(status.count,31,'31 intro images');eq(assets.length,31,'31 asset count');
 eq(new Set(assets.map(x=>x.id)).size,31,'source-ordinal identities unique');
 for(const ref of reference.frames){
  const id=`mk2-intro-lzw:${ref.resource}:${ref.ordinal}`,a=assets.find(x=>x.id===id);
  eq(Boolean(a),true,id+' exists');eq(a.width,320,'original image width');eq(a.height,200,'original image height');eq(a.kind,'image','intro is image, never stage');
  eq(sha(a.metadata.indices),ref.indicesSha256,id+' independently verified original pixels');
  eq(sha(a.rgba),ref.rgbaSha256,id+' independent O110E DAC6 diagnostic RGB + magenta unknown');
  eq(sha(a.metadata.paletteKnownMask),ref.paletteKnownMaskSha256,id+' independent known-color mask');
  eq(a.metadata.unknownIndex0PixelCount,ref.unknownZero,id+' zero-colour unresolved count');
  eq(a.metadata.unknownOtherPixelCount,ref.unknownBeyondPalette,id+' out-of-bank unknown count');
  eq(a.source.offset,ref.frameHeaderStart,id+' source frame offset');
  eq(a.metadata.originalCompressedStart,ref.compressedStart,id+' original source compressed start');
  eq(a.metadata.originalCompressedEnd,ref.compressedEnd,id+' original source compressed end');
  eq(a.metadata.originalLzwTerminatedByZeroSubblock,ref.terminatedByZeroSubblock,id+' original LZW native end grammar');
  eq(a.metadata.frameIntervalMillisecondsKnown,false,'no runtime timing invented');
  eq(a.metadata.paletteIndex0Qualified,false,'index0 unqualified');
  eq(a.metadata.mask.every(x=>x===1),true,'full-frame original image opacity');
 }
 eq(assets.filter(a=>a.source.path==='probe.gra').length,30,'Probe original frame count');
 eq(assets.filter(a=>a.source.path==='acclaim.gra').length,1,'Acclaim original frame count');
 const selection=[assets[0],assets[30]],z=parseAnimationStoreZip(selectedZip(selection));
 eq([...z.keys()].filter(x=>x.startsWith('assets/')).length,2,'selected ZIP graphics');
 eq([...z.keys()].filter(x=>x.startsWith('indexed/')).length,6,'selected ZIP includes native indices, original opacity, palette-known masks');
 const manifest=JSON.parse(new TextDecoder().decode(z.get('manifest.json').bytes));
 eq(manifest.selectionOrder.map(x=>x.id),selection.map(x=>x.id),'original selected-asset order');
 for(let i=0;i<2;i++){
  for(const field of ['indices','mask','paletteKnownMask'])eq(sha(z.get(`indexed/${String(i).padStart(5,'0')}_${field}.bin`).bytes),sha(selection[i].metadata[field]),'selected ZIP '+field);
 }
 // These controls must never turn modified or ambiguous sources into qualified previews.
 for(const name of ['mk2.exe','probe.gra','acclaim.gra']){
  const mutated=new Map(base),bytes=base.get(name).slice();bytes[0]^=1;mutated.set(name,bytes);
  const r=await buildMK2IntroLzwP12(makeSource(mutated));
  eq(r.status.status,'UNAVAILABLE',`tampered ${name} rejected`);eq(r.assets.length,0,`tampered ${name} emits no images`);
 }
 for(const name of ['mk2.exe','probe.gra','acclaim.gra']){
  const absent=new Map(base);absent.delete(name);
  const r=await buildMK2IntroLzwP12(makeSource(absent));eq(r.status.status,'UNAVAILABLE',`missing ${name} rejected`);
 }
 const dup=new Map(base);dup.set('PROBE.GRA',base.get('probe.gra'));
 const dupResult=await buildMK2IntroLzwP12(makeSource(dup));eq(dupResult.status.status,'UNAVAILABLE','ambiguous Probe rejected');
 const result={pass:'P12',status:'PASS',checks,originalIntroFrames:31,originalSourceIndicesAndConditionalDAC6Parity:'all 31 original frames',negativeCases:7,selectedZipExport:['indices','mask','paletteKnownMask'],runtimeAnimationTimingKnown:false,livePaletteIndex0Known:false,commercialGameDataInGit:false};
 if(process.argv[3])fs.writeFileSync(process.argv[3],JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify(result,null,2));
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
