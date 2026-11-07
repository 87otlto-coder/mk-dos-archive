#!/usr/bin/env node
/** P40 original-MK2 fixture integration and negative-control gate.
 * node scripts/verify-mk2-p40-portal-coverage.cjs <original MK2 folder> [private-report.json]
 * Source-only CI cannot replace this original-game test.
 */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),ts=require('typescript');
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{fileName:f,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,f);
if(!globalThis.crypto)globalThis.crypto=crypto.webcrypto;
const {scanAssets}=require('../src/core/assets/collection.ts');


const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const root=process.argv[2];assert.ok(root,'Provide original MK2 directory');const data=new Map();
function walk(dir,prefix=''){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=prefix?prefix+'/'+e.name:e.name,full=path.join(dir,e.name);if(e.isDirectory())walk(full,p);else if(e.isFile())data.set(p,new Uint8Array(fs.readFileSync(full)));}}
walk(root);
const source={directoryName:'P40 original MK2',isSynthetic:false,
 async listRecursive(){return [...data].map(([p,b])=>({path:p,name:path.basename(p),extension:path.extname(p).slice(1).toUpperCase(),size:b.length}));},
 async readSlice(p,start,count){const b=data.get(p);if(!b)throw Error('Missing '+p);return b.slice(start,start+count);}};

const {indexedAssetZip,selectedZip,metadata}=require('../src/core/assets/export.ts');
const {parseAnimationStoreZip}=require('../src/games/mk1/research/browserAnimationExportBundleValidation.ts');
const output=path.resolve(process.argv[3]||'');assert.ok(process.argv[3],'Private output required');
const inside=(a,b)=>{const rel=path.relative(a,b);return rel===''||(!rel.startsWith('..'+path.sep)&&rel!=='..'&&!path.isAbsolute(rel));};
let existing=output,tail=[];while(!fs.existsSync(existing)){tail.unshift(path.basename(existing));existing=path.dirname(existing);}
const target=path.resolve(fs.realpathSync(existing),...tail);
assert.ok(!inside(fs.realpathSync(path.join(__dirname,'..')),target)&&!inside(fs.realpathSync(root),target),'Output must be outside repository and fixtures');
(async()=>{
 const c=await scanAssets(source,'mk2',()=>{});assert.equal(c.assets.length,5369);
 const ids=['mk2-cave-source:0:original-indices','mk2-armory-tail-source:0:original-indices','mk2-forest-tail-source:0:original-indices',
 'mk2-tomb-source:0:original-indices','mk2-portal-source:0:original-indices','mk2-stage-effect:tower_original_effect:00','mk2-pit-bridge:green:0','mk2-floor:battle:indices-preview'];
 const cases=[];fs.mkdirSync(target,{recursive:true});
 for(const [i,id]of ids.entries()){
  const a=c.assets.find(a=>a.id===id);assert.ok(a,id);const before=JSON.stringify(metadata(a)),archive=indexedAssetZip(a);
  assert.deepStrictEqual(archive.bytes,selectedZip([a]));const entries=parseAnimationStoreZip(archive.bytes);
  assert.deepStrictEqual(JSON.parse(new TextDecoder().decode(entries.get('manifest.json').bytes)).selectionOrder,[JSON.parse(before)]);
  for(const key of ['indices','mask','paletteKnownMask']){
   const plane=a.metadata[key],entry=entries.get('indexed/00000_'+key+'.bin');
   if(plane instanceof Uint8Array)assert.deepStrictEqual(Buffer.from(entry.bytes),Buffer.from(plane));else assert.equal(entry,undefined);
  }
  assert.equal(JSON.stringify(metadata(a)),before);
  const file=i+'.zip';fs.writeFileSync(path.join(target,file),archive.bytes);
  cases.push({id,file,filename:archive.filename,previewRgbaSha256:sha(a.rgba),sha256:sha(archive.bytes)});
 }
 fs.writeFileSync(path.join(target,'cases.json'),JSON.stringify(cases,null,2)+'\n');
 console.log(JSON.stringify({status:'PASS',uniqueAssets:5369,indexedAssetCases:cases.length,newRepresentations:0,
  allArchivesByteIdenticalToLegacySelectedZip:true,sourceMetadataUnchanged:true,originalDataBrowserVerified:false},null,2));
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
