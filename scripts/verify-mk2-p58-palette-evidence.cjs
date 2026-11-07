#!/usr/bin/env node
/** P58 original-MK2 palette-evidence acceptance.
 * Usage: node scripts/verify-mk2-p58-palette-evidence.cjs <original MK2 directory> [private result.json]
 * Does not synthesize, overwrite or export original commercial artwork.
 */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),ts=require('typescript');
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{fileName:f,
 compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,f);
if(!globalThis.crypto)globalThis.crypto=crypto.webcrypto;
const {scanAssets}=require('../src/core/assets/collection.ts');
const {buildMK2PaletteEvidenceP58}=require('../src/components/mk2PaletteEvidenceP58.ts');
const {matchesAssetSearchP55,exactAssetSearchP55}=require('../src/core/assets/assetSearchP55.ts');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const dir=process.argv[2];assert(dir,'Provide original MK2 directory');
const checkout=fs.realpathSync(path.resolve(__dirname,'..')),original=fs.realpathSync(dir);
const inside=(p,q)=>{const rel=path.relative(p,q);return rel===''||(!rel.startsWith('..'+path.sep)&&rel!=='..'&&!path.isAbsolute(rel));};
assert(!inside(checkout,original),'Original DOS files must remain outside repository');
const out=process.argv[3]&&path.resolve(process.argv[3]);
if(out)assert(!inside(checkout,out)&&!inside(original,out),'Private result must remain outside repository/game directory');
const data=new Map();
function walk(base,prefix=''){for(const f of fs.readdirSync(base,{withFileTypes:true})){
 const p=prefix?prefix+'/'+f.name:f.name,full=path.join(base,f.name);
 if(f.isDirectory())walk(full,p);else if(f.isFile())data.set(p,new Uint8Array(fs.readFileSync(full)));
}}walk(original);
const entries=[...data].map(([p,b])=>({path:p,name:path.basename(p),extension:path.extname(p).slice(1).toUpperCase(),size:b.length}));
const source={directoryName:'P58 original MK2',isSynthetic:false,
 async listRecursive(){return entries;},
 async readSlice(p,begin,size){const b=data.get(p);if(!b)throw Error('Missing original '+p);return b.slice(begin,begin+size);}};
function originalFile(name,expected){
 const found=entries.filter(e=>e.name.toLowerCase()===name.toLowerCase());
 assert.equal(found.length,1,'Exactly one '+name);
 const bytes=data.get(found[0].path);assert.equal(sha(bytes),expected,'Original '+name+' SHA256 mismatch');
 return bytes;
}
(async()=>{
 const exe=originalFile('MK2.EXE','fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65');
 assert.equal(exe.length,861133);
 const forest=originalFile('FOREST.GRA','8aef888aeef608eefe03e3cdc142035ff3a53984b77b525850a218c68b7e44b9');
 const tomb=originalFile('TOMB.GRA','be4f2427e79ff50eaca2fdbfb2fb6f534d9b61fb20cc79744648401d07a9b613');
 const portal=originalFile('PORTAL.GRA','cf16116e96a21fcc17dbfd841e0fb3b5b73c972b1addb5177bfc09b8d1745b82');
 const c=await scanAssets(source,'mk2',()=>{});
 assert.equal(c.assets.length,5369);assert.equal(new Set(c.assets.map(a=>a.id)).size,5369);
 const e=buildMK2PaletteEvidenceP58(c.assets);
 assert.deepStrictEqual(e.errors,[],'No altered or incomplete original evidence may be presented');
 assert.equal(e.forestComparisons.length,5,'Five authentic Forest indexed/candidate pairs');
 assert.equal(e.screenshotFloors.size,2,'Two screenshot-conditioned original floor strips');
 const planes=[];
 for(const p of e.forestComparisons){
  const a=p.diagnostic,b=p.candidate;
  assert(c.assets.includes(a)&&c.assets.includes(b));
  assert.equal(a.source.sha256,sha(forest));assert.equal(b.source.sha256,sha(forest));
  assert.deepStrictEqual(a.metadata.indices,b.metadata.indices);
  assert.deepStrictEqual(a.metadata.mask,b.metadata.mask);
  for(let i=0;i<a.metadata.indices.length;i++){
   const n=i*4,ix=a.metadata.indices[i];
   assert.equal(a.rgba[n],ix);assert.equal(a.rgba[n+1],ix);assert.equal(a.rgba[n+2],ix);
   assert.equal(a.rgba[n+3],a.metadata.mask[i]?255:0);
  }
  const target=c.assets.filter(x=>matchesAssetSearchP55(x,exactAssetSearchP55(b.id)));
  assert.equal(target.length,1);assert.equal(target[0],b);
  planes.push({variant:p.key,indexSha256:sha(a.metadata.indices),maskSha256:sha(a.metadata.mask),
   diagnosticRgbaSha256:sha(a.rgba),candidateRgbaSha256:sha(b.rgba),runtimePaletteKnown:false});
 }
 const floors=[];
 for(const [stage,sourceBytes,left,offset,rows,matches] of [
  ['TOMB.GRA',tomb,291,63776,48,12222],['PORTAL.GRA',portal,292,56916,40,4420]]){
  const p=e.screenshotFloors.get(stage);assert(p);
  const a=p.asset;assert(c.assets.includes(a));
  assert.equal(a.metadata.originalScreenshotHeldOutExactMatches,matches);
  const originalIndices=new Uint8Array(320*rows);
  for(let y=0;y<rows;y++)originalIndices.set(sourceBytes.subarray(offset+y*896+left,offset+y*896+left+320),y*320);
  assert.deepStrictEqual(a.metadata.indices,originalIndices,'Witnessed RGB may not replace original indexed source');
  assert.equal(sha(originalIndices),a.metadata.sourcePixelSha256);
  assert.equal(sha(a.rgba),a.metadata.observedRgbPreviewSha256);
  assert(a.metadata.paletteKnownMask.every(v=>v===0),'Native palette known mask must remain unknown');
  const target=c.assets.filter(x=>matchesAssetSearchP55(x,exactAssetSearchP55(a.id)));
  assert.equal(target.length,1);assert.equal(target[0],a);
  floors.push({stage,rows,conditionalScreenshotMatches:matches,indicesSha256:sha(originalIndices),
   observedRgbSha256:sha(a.rgba),nativePaletteAssigned:false});
 }
 const result={pass:'P58',status:'PASS',mk2Assets:5369,sourceVerifiedForestIndexColorPairs:5,
  originalScreenshotWitnessedFloorStrips:2,originalSourceHashesVerified:4,
  allOriginalIndexPlanesPreserved:true,sourceOnlyNegativeControlsRunInCI:true,
  nativeDACPaletteOwnershipAsserted:false,completeStageCompositionsAsserted:false,
  actualBrowserPaletteEvidenceClicksVerified:false,
  forest:planes,floors};
 if(out){fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');}
 console.log(JSON.stringify({pass:result.pass,status:result.status,mk2Assets:result.mk2Assets,
  sourceVerifiedForestIndexColorPairs:result.sourceVerifiedForestIndexColorPairs,
  originalScreenshotWitnessedFloorStrips:result.originalScreenshotWitnessedFloorStrips,
  originalSourceHashesVerified:result.originalSourceHashesVerified,
  allOriginalIndexPlanesPreserved:result.allOriginalIndexPlanesPreserved,
  nativeDACPaletteOwnershipAsserted:false,completeStageCompositionsAsserted:false,
  actualBrowserPaletteEvidenceClicksVerified:false},null,2));
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
