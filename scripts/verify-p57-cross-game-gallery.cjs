#!/usr/bin/env node
/** P57 full original-source gallery evidence acceptance.
 * Usage: node scripts/verify-p57-cross-game-gallery.cjs <original MK1 dir> <original MK2 dir> <original MK3 dir> [private-report.json]
 * Original commercial files never belong in Git; output is metadata only.
 */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),ts=require('typescript');
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{fileName:f,
 compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,f);
if(!globalThis.crypto)globalThis.crypto=crypto.webcrypto;
const {scanAssets}=require('../src/core/assets/collection.ts');
const {buildGalleryVisualsP57}=require('../src/components/stageGalleryVisualsP57.ts');
const {discoverStageGallery}=require('../src/components/stageGalleryModel.ts');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const args=process.argv.slice(2);
assert(args.length===3||args.length===4,'Three original game directories and optional private report required');
const checkout=fs.realpathSync(path.resolve(__dirname,'..'));
const inside=(parent,child)=>{const rel=path.relative(parent,child);return rel===''||(!rel.startsWith('..'+path.sep)&&rel!=='..'&&!path.isAbsolute(rel));};
const dirs=args.slice(0,3).map(dir=>fs.realpathSync(dir));
for(const dir of dirs){assert(fs.statSync(dir).isDirectory());assert(!inside(checkout,dir),'Original game files must stay outside checkout');}
if(args[3]){const out=path.resolve(args[3]);assert(!inside(checkout,out)&&dirs.every(dir=>!inside(dir,out)),'Report must be private outside checkout/game directories');}
function sourceFor(dir){
 const data=new Map();
 function walk(at,prefix=''){for(const item of fs.readdirSync(at,{withFileTypes:true})){
  const name=prefix?prefix+'/'+item.name:item.name;
  if(item.isDirectory())walk(path.join(at,item.name),name);
  else if(item.isFile())data.set(name,new Uint8Array(fs.readFileSync(path.join(at,item.name))));
 }}walk(dir);
 const entries=[...data].map(([p,b])=>({path:p,name:path.basename(p),extension:path.extname(p).slice(1).toUpperCase(),size:b.length}));
 return {data,entries,source:{directoryName:path.basename(dir),isSynthetic:false,
  async listRecursive(){return entries;},
  async readSlice(p,begin,length){const bytes=data.get(p);if(!bytes)throw Error('Missing original source: '+p);return bytes.slice(begin,begin+length);}
 }};
}
(async()=>{
 const games=['mk1','mk2','mk3'],summaries={},allAssets={};
 for(let n=0;n<3;n++){
  const game=games[n],{data,entries,source}=sourceFor(dirs[n]);
  const c=await scanAssets(source,game,()=>{});
  assert.equal(c.assets.length,{mk1:2656,mk2:5369,mk3:9186}[game],game+' census changed');
  assert.equal(new Set(c.assets.map(a=>a.id)).size,c.assets.length,game+' duplicate asset IDs');
  const v=buildGalleryVisualsP57(game,c.assets,c.reports.stageHeaderBindings??null);
  assert.deepStrictEqual(v.errors,[],game+' invalid source thumbnail evidence');
  const chosen=game==='mk1'?[...v.mk1ByHeader.values()].flat():
   game==='mk2'?[...v.mk2ByResource.values()]:v.mk3UnassignedPictures;
  assert(chosen.length>0,game+' no source-backed preview images');
  for(const vis of chosen){
   const asset=vis.asset;
   assert(c.assets.includes(asset),'Gallery creates unsourced artwork');
   assert(asset.rgba && asset.rgba.length===asset.width*asset.height*4);
   if(game==='mk1')continue; // Authentic root-to-module association is P54 metadata evidence, not the generated ZIP path.
   const matches=entries.filter(e=>e.name.toUpperCase()===path.basename(asset.source.path).toUpperCase());
   assert.equal(matches.length,1,game+' source path cannot be bound to one original file: '+asset.id);
   assert.equal(asset.source.sha256,sha(data.get(matches[0].path)),game+' original-source SHA mismatch: '+asset.id);
  }
  summaries[game]={assets:c.assets.length,sourceBackedThumbnails:chosen.length};
  if(game==='mk1'){
   assert.equal(v.mk1ByHeader.size,15);
   assert.equal(chosen.length,24);
   const report=c.packages.find(p=>p.name==='MK1_P54_VERIFIED_HEADER_MODULE_PREVIEW_JOINS.json');
   assert(report);assert.equal(sha(report.bytes),'bb180450381a7f43ecca1f3bc6282bb1c6b0bc1d48cc77e8f9ad5e27092269db');
   summaries.mk1.headerCount=v.mk1ByHeader.size;
  }else if(game==='mk2'){
   for(const name of ['TOMB.GRA','PORTAL.GRA'])
    assert(v.mk2ByResource.has(name),'Original '+name+' has no qualified stage-layer preview');
   const inventoryCards=discoverStageGallery(entries,'mk2');
   for(const name of v.mk2ByResource.keys())if(inventoryCards.some(c=>c.file===name))assert(data.has(entries.find(e=>e.name.toUpperCase()===name).path));
   summaries.mk2.originalStageGalleryCards=inventoryCards.length;
  }else if(game==='mk3'){
   assert.equal(v.mk3UnassignedPictures.length,416,'Original embedded-CMAP image count');
   assert(v.mk3UnassignedPictures.every(x=>x.evidence.includes('stage assignment UNKNOWN')));
   summaries.mk3.arcadeStageNamesAssigned=false;
  }
 }
 const result={pass:'P57',status:'PASS',summaries,syntheticArtworkAdded:false,originalAssetsModified:false,
  nativePaletteOrSceneClaimsAdded:false,actualBrowserClicksVerified:false};
 if(args[3]){fs.mkdirSync(path.dirname(path.resolve(args[3])),{recursive:true});fs.writeFileSync(args[3],JSON.stringify(result,null,2)+'\n');}
 console.log(JSON.stringify(result,null,2));
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
