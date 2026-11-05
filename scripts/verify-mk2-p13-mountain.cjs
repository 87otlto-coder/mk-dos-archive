#!/usr/bin/env node
/* P13: TypeScript original-source adapter against independent Python O96T/O96U
 * hashed pixel, bounded stream, descriptor and preview checks. No game media in Git.
 */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
let ts;try{ts=require('typescript')}catch{ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript')}
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(m,file)=>m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{fileName:file,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,file);
if(!globalThis.crypto)globalThis.crypto=crypto.webcrypto;
const {buildMK2MountainSourceP13}=require('../src/core/assets/mk2MountainSourceP13.ts');
const {selectedZip}=require('../src/core/assets/export.ts');
const {parseAnimationStoreZip}=require('../src/games/mk1/research/browserAnimationExportBundleValidation.ts');
const reference=require('./fixtures/mk2-p13-mountain-independent-parity.json');
const root=process.argv[2];if(!root)throw Error('usage: verify-mk2-p13-mountain.cjs <original MK2 directory> [report.json]');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const base=new Map();for(const name of ['mk2.exe','mountain.gra'])base.set(name,new Uint8Array(fs.readFileSync(path.join(root,name))));
function source(map){return {directoryName:'original MK2 P13',isSynthetic:false,
 async listRecursive(){return [...map].map(([p,b])=>({name:p,path:p,extension:p.split('.').pop().toUpperCase(),size:b.length}));},
 async readSlice(p,start,len){const b=map.get(p);if(!b)throw Error('missing original '+p);return b.slice(start,start+len);}}}
let checks=0;const eq=(x,y,label)=>{assert.deepStrictEqual(x,y,label);checks++};
(async()=>{
 eq(sha(base.get('mk2.exe')),reference.fixture.mk2ExeSha256,'original exe');
 eq(sha(base.get('mountain.gra')),reference.fixture.mountainGraSha256,'original gra');
 const out=await buildMK2MountainSourceP13(source(base));
 eq(out.status.status,'VERIFIED','source passed');eq(out.status.count,15,'15 valid graphics');
 eq(out.status.selectedCount,14,'14 selected consumer descriptors');
 eq(out.status.adjacentUnselectedCount,1,'one unselected adjacent graphics');
 eq(out.assets.length,15,'15 ordinary Asset Library sprites');
 eq(new Set(out.assets.map(x=>x.id)).size,15,'15 distinct asset IDs');
 eq(out.status.originalSourceOrders,reference.conditionalVariants,'all six conditional source arrangements unchanged');
 const knownMaskSha=sha(new Uint8Array(35*41));
 for(const ref of reference.records){
   const asset=out.assets.find(x=>x.id===`mk2-mountain-source:${ref.ordinal}:original-indices`);
   eq(Boolean(asset),true,`asset ${ref.ordinal} exists`);
   eq(asset.kind,'sprite',`resource sprite type ${ref.ordinal}`);
   eq(asset.width,35,`source width ${ref.ordinal}`);eq(asset.height,41,`source height ${ref.ordinal}`);
   eq(asset.source.offset,ref.offset,`original gra start ${ref.ordinal}`);
   eq(asset.source.length,ref.endExclusive-ref.offset,`native encoded extent ${ref.ordinal}`);
   eq(asset.metadata.sourceDescriptorPhysical,ref.descriptorPhysical,`O96T original descriptor ${ref.ordinal}`);
   eq(asset.metadata.sourceIndexMin,ref.colorIndexMin,`original minimum index ${ref.ordinal}`);
   eq(asset.metadata.sourceIndexMax,ref.colorIndexMax,`original maximum index ${ref.ordinal}`);
   eq(asset.metadata.sourceCommands,ref.commands,`original native stream command census ${ref.ordinal}`);
   eq(asset.metadata.selectedByO96SPointerTable,ref.selected,`O96S selected vs adjacent not-selected ${ref.ordinal}`);
   eq(sha(asset.metadata.indices),ref.pixelSHA256,`independent original pixel parity ${ref.ordinal}`);
   eq(sha(asset.metadata.mask),ref.maskSHA256,`original coverage ${ref.ordinal}`);
   eq(sha(asset.rgba),ref.diagnosticRgbaSHA256,`indexed grayscale NOT RGB palette ${ref.ordinal}`);
   eq(sha(asset.metadata.paletteKnownMask),knownMaskSha,`all palette colors UNKNOWN ${ref.ordinal}`);
   eq(asset.metadata.originalPaletteKnown,false,`no false RGB ownership ${ref.ordinal}`);
   eq(asset.metadata.originalScenePositionKnown,false,`no invented screen placement ${ref.ordinal}`);
   eq(asset.metadata.originalFrameRateKnown,false,`no inferred animation frame rate ${ref.ordinal}`);
 }
 eq(out.assets.filter(x=>x.metadata.selectedByO96SPointerTable).length,14,'only first 14 consumer selected');
 eq(out.assets.find(x=>x.metadata.isAdjacentStructurallyQualifiedOnly).metadata.selectedByO96SPointerTable,false,'adjacent 15 never selected');
 eq(out.packages.length,1,'provenance ZIP available');
 const archive=parseAnimationStoreZip(out.packages[0].bytes);
 eq([...archive.keys()].filter(x=>x.startsWith('preview/')).length,15,'15 diagnostic PNGs');
 eq([...archive.keys()].filter(x=>x.startsWith('indexed/')).length,45,'15 original source planes, opacity and known masks');
 const m=JSON.parse(new TextDecoder().decode(archive.get('manifest.json').bytes));
 eq(m.originalConditionalOrders,reference.conditionalVariants,'manifest records 6 authenticated alternatives');
 eq(m.completeStageComposition,false,'no full scene claim');eq(m.allRgbUnknown,true,'no RGB ownership asserted');
 eq(m.selectedUniqueSourceDescriptors,14,'14 original selector table descriptors');
 eq(m.boundedSuffixStart,reference.bounds.suffixStart,'original 23024-byte source suffix beginning');
 for(const ref of reference.records){
  const ord=String(ref.ordinal).padStart(2,'0');
  eq(sha(archive.get(`indexed/mountain_source_${ord}.indices.bin`).bytes),ref.pixelSHA256,`forensic package index ${ref.ordinal}`);
  eq(sha(archive.get(`indexed/mountain_source_${ord}.mask.bin`).bytes),ref.maskSHA256,`forensic package paint mask ${ref.ordinal}`);
  eq(sha(archive.get(`indexed/mountain_source_${ord}.palette-known.bin`).bytes),knownMaskSha,`forensic package unknown-color mask ${ref.ordinal}`);
 }
 const selection=[out.assets[0],out.assets[13],out.assets[14]];
 const selected=parseAnimationStoreZip(selectedZip(selection));
 eq([...selected.keys()].filter(x=>x.startsWith('assets/')).length,3,'three valid exported PNGs');
 eq([...selected.keys()].filter(x=>x.startsWith('indexed/')).length,9,'three selected index/mask/known planes');
 const sm=JSON.parse(new TextDecoder().decode(selected.get('manifest.json').bytes));
 eq(sm.selectionOrder.map(x=>x.id),selection.map(x=>x.id),'selected order is source preserving');
 for(let i=0;i<selection.length;i++)for(const key of ['indices','mask','paletteKnownMask']){
  eq(sha(selected.get(`indexed/${String(i).padStart(5,'0')}_${key}.bin`).bytes),sha(selection[i].metadata[key]),`selected ${i} ${key}`);
 }
 for(const name of ['mk2.exe','mountain.gra']){
   const mutated=new Map(base),bytes=base.get(name).slice();bytes[0]^=1;mutated.set(name,bytes);
   const r=await buildMK2MountainSourceP13(source(mutated));
   eq(r.status.status,'UNAVAILABLE',`tampered ${name} fail closed`);
   eq(r.assets.length,0,`tampered ${name} no false qualifying asset`);
   eq(r.packages.length,0,`tampered ${name} no false evidence ZIP`);
   const missing=new Map(base);missing.delete(name);
   const m=await buildMK2MountainSourceP13(source(missing));
   eq(m.status.status,'UNAVAILABLE',`missing ${name} unavailable`);
   eq(m.assets.length,0,`missing ${name} no original graphics`);
 }
 const ambig=new Map(base);ambig.set('MOUNTAIN.GRA',base.get('mountain.gra'));
 const dup=await buildMK2MountainSourceP13(source(ambig));
 eq(dup.status.status,'UNAVAILABLE','ambiguous mountain resource rejected');
 eq(dup.assets.length,0,'no duplicated qualified record');
 const res={pass:'P13',status:'PASS',checks,newOriginalIndexedGraphics:15,consumerSelected:14,
   adjacentStructurallyQualifiedOnly:1,originalSuffixBytes:23024,sourceOrders:6,
   diagnosticColorOnly:true,originalSourceIndicesPreserved:true,
   negativeFixtureCases:5,commercialAssetsCommitted:false,packageSha256:sha(out.packages[0].bytes)};
 if(process.argv[3])fs.writeFileSync(process.argv[3],JSON.stringify(res,null,2)+'\n');
 console.log(JSON.stringify(res,null,2));
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
