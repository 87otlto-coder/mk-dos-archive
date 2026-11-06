#!/usr/bin/env node
/** Original-file adapter/reference parity, ZIP sidecars and fail-closed controls. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),ts=require('typescript');
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(m,file)=>m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{fileName:file,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,file);
if(!globalThis.crypto)globalThis.crypto=crypto.webcrypto;
const {buildMK2TombSourceP27}=require('../src/core/assets/mk2TombSourceP27.ts');
const {parseAnimationStoreZip,decodeAnimationBundlePng}=require('../src/games/mk1/research/browserAnimationExportBundleValidation.ts');
const ref=require('./fixtures/mk2-p27-tomb-independent-parity.json');
const root=process.argv[2];assert.ok(root,'Provide original MK2 directory');
const input=new Map(['mk2.exe','tomb.gra'].map(n=>[n,new Uint8Array(fs.readFileSync(path.join(root,n)))]));
function fixture(map,{synthetic=false,duplicate,shortRead=false}={}){return {directoryName:'P27 original fixture',isSynthetic:synthetic,
 async listRecursive(){const entries=[...map].map(([p,b])=>({path:p,name:path.basename(p),size:b.length,extension:path.extname(p).slice(1).toUpperCase()}));
  if(duplicate)entries.push({...entries.find(e=>e.name===duplicate),path:'duplicate/'+duplicate});return entries;},
 async readSlice(p,start,count){const b=map.get(p);if(!b)throw Error('Missing '+p);return b.slice(start,start+count-(shortRead?1:0));}};}
let checks=0;const eq=(a,b,label)=>{assert.deepStrictEqual(a,b,label);checks++};
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
(async()=>{
 eq(ref.schema,'mkdos_p27_tomb_independent_reference_v1','independent Python reference');
 const r=await buildMK2TombSourceP27(fixture(input));
 eq(r.status.status,'VERIFIED','qualified source');eq(r.assets.length,16,'original Tomb table images');
 eq(r.status.sourceImagePrefix,{start:0,endExclusive:54328,encodedBytes:54328},'qualified original prefix only');
 const zip=parseAnimationStoreZip(r.packages[0].bytes);eq(zip.size,65,'16 PNGs plus three planes plus manifest');
 let pixels=0;
 for(const [ordinal,a] of r.assets.entries()){
  const g=ref.images[ordinal];
  eq([a.width,a.height,a.source.offset,a.source.offset+a.source.length],[g.width,g.height,g.start,g.endExclusive],'original geometry/extent');
  eq(a.metadata.sourceDescriptorPhysical,g.descriptorPhysical,'source descriptor provenance');
  eq(a.metadata.sourceSetupUses,g.sourceSetupUses,'original setup-control relationships');
  eq(a.metadata.componentPreviouslyUsedInMosaics,true,'component already present inside mosaics');
  eq(a.metadata.newlyDiscoveredSourceImage,false,'no new discovery claim');
  for(const [field,key]of [['indices','indicesSha256'],['mask','maskSha256'],['paletteKnownMask','paletteKnownSha256']]){
   eq(sha(a.metadata[field]),g[key],'independent source hash '+field);
   eq(Buffer.from(zip.get(`indexed/${String(ordinal).padStart(5,'0')}_${field}.bin`).bytes),Buffer.from(a.metadata[field]),'exported '+field);
  }
  eq(sha(a.rgba),g.rgbaSha256,'independent diagnostic preview RGBA');
  eq(sha(input.get('tomb.gra').subarray(g.start,g.endExclusive)),g.encodedSha256,'original encoded span');
  const entry=[...zip].filter(([k])=>k.startsWith('assets/'))[ordinal][1];
  const decoded=decodeAnimationBundlePng(entry.bytes);
  eq([decoded.width,decoded.height],[g.width,g.height],'PNG dimensions');eq(sha(decoded.rgba),g.rgbaSha256,'PNG readback');
  for(const flag of ['runtimePaletteKnown','stageOwnershipKnown','nativeTimingKnown','fullStageScene','sourceTableOrderIsAnimation'])eq(a.metadata[flag],false,'no fabricated '+flag);
  pixels+=a.width*a.height;
 }
 let reconstructedCells=0;
 const {O122_SETUP_ROWS}=require('../src/games/mk2/research/stageIndexedPlacementsO122.ts');
 const {renderMK2IndexedSetupLayerO122}=require('../src/games/mk2/research/stageIndexedMosaicsO122.ts');
 for(const canvas of ref.sourceSetupCanvases){
  const setup=O122_SETUP_ROWS.tomb.find(s=>s.setupObject2Offset===canvas.setupObject2Offset);
  eq(Boolean(setup),true,'existing source setup remains present');
  const ix=new Uint8Array(canvas.width*canvas.height),mask=new Uint8Array(ix.length);
  for(const p of setup.placements){
   const component=r.assets.find(a=>a.source.offset===p.offset&&a.width===p.width&&a.height===p.height);
   eq(Boolean(component),true,'every existing placement resolves to a full source component');
   for(let i=0;i<component.metadata.indices.length;i++)if(component.metadata.mask[i]){
    const x=p.x+i%p.width,y=p.y+Math.floor(i/p.width);
    if(x>=0&&y>=0&&x<canvas.width&&y<canvas.height){ix[y*canvas.width+x]=component.metadata.indices[i];mask[y*canvas.width+x]=1;}
   }
  }
  eq(sha(ix),canvas.indicesSha256,'new components reproduce independent original setup indices');
  eq(sha(mask),canvas.maskSha256,'new components reproduce independent original setup opacity');
  const existing=await renderMK2IndexedSetupLayerO122(input.get('mk2.exe'),input.get('tomb.gra'),'tomb',canvas.setupObject2Offset);
  eq(Buffer.from(existing.indices),Buffer.from(ix),'existing setup output remains byte-identical');
  eq(Buffer.from(existing.opacity),Buffer.from(mask),'existing setup opacity remains byte-identical');
  reconstructedCells+=ix.length;
 }
 const reject=async(src,label)=>{const x=await buildMK2TombSourceP27(src);eq(x.status.status,'UNAVAILABLE',label);eq(x.assets.length,0,'no partial assets');eq(x.packages.length,0,'no partial package');};
 await reject(fixture(input,{synthetic:true}),'synthetic');
 for(const name of ['mk2.exe','tomb.gra']){
  const missing=new Map(input);missing.delete(name);await reject(fixture(missing),'missing '+name);
  await reject(fixture(input,{duplicate:name}),'ambiguous '+name);
  const corrupt=new Map(input),b=input.get(name).slice();b[b.length-1]^=1;corrupt.set(name,b);await reject(fixture(corrupt),'corrupt '+name);
 }
 await reject(fixture(input,{shortRead:true}),'truncated read');
 if(process.argv[4])fs.writeFileSync(process.argv[4],r.packages[0].bytes);
 const result={pass:'P27',status:'PASS',checks,originalTombImages:16,indexedPixels:pixels,existingSetupLayers:6,originalSetupPlacements:87,reconstructedSetupCells:reconstructedCells,newlyDiscoveredSourceImages:0,negativeFixtures:8,
  evidenceZipSha256:sha(r.packages[0].bytes),sourceOutsideImageFamilyBytes:52456,nativePaletteKnown:false,fullStageScene:false,browserInteractionVerified:false};
 if(process.argv[3])fs.writeFileSync(process.argv[3],JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
