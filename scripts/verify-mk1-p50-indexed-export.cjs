#!/usr/bin/env node
/** P50 MK1 indexed archive compatibility.
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
const source={directoryName:'P50 original MK1',isSynthetic:false,
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
 const c=await scanAssets(source,'mk1',()=>{});assert.equal(c.assets.length,2656);
 const eligible=c.assets.filter(a=>a.metadata.indices instanceof Uint8Array);
 assert.ok(eligible.length,'MK1 indexed candidates required');
 const chosen=eligible.filter(a=>a.id.startsWith('unresolved:'));assert.equal(chosen.length,79);
 assert.ok(chosen.length);fs.mkdirSync(target,{recursive:true});
 const bundle=parseAnimationStoreZip(c.packages.find(p=>p.name==='MK1_animations_evidence.zip').bytes);
 const manifestEntry=[...bundle].find(([name])=>name.endsWith('indexed/descriptor_manifest.json'));
 assert.ok(manifestEntry,'original indexed descriptor manifest');
 const indexedManifest=JSON.parse(new TextDecoder().decode(manifestEntry[1].bytes));
 const binaryEntry=[...bundle].find(([name])=>name.endsWith('indexed/descriptor_pixels.bin'));assert.ok(binaryEntry,'original indexed binary');

 let sourcePlaneBytes=0;
 for(const [i,a]of chosen.entries()){
  const d=indexedManifest.descriptors.find(d=>d.tableSymbol===a.metadata.tableSymbol&&d.descriptorWatcomOffset===a.metadata.descriptorWatcomOffset);assert.ok(d);
  assert.deepStrictEqual([a.width,a.height],[d.width,d.height]);
  assert.deepStrictEqual(Buffer.from(a.metadata.indices),Buffer.from(binaryEntry[1].bytes.subarray(d.indicesOffset,d.indicesOffset+d.pixelCount)));
  assert.deepStrictEqual(Buffer.from(a.metadata.mask),Buffer.from(binaryEntry[1].bytes.subarray(d.maskOffset,d.maskOffset+d.pixelCount)));
  assert.equal(a.metadata.palette,'UNRESOLVED');sourcePlaneBytes+=2*d.pixelCount;
  const before=JSON.stringify(metadata(a)),archive=indexedAssetZip(a),entries=parseAnimationStoreZip(archive.bytes);
  assert.deepStrictEqual(archive.bytes,selectedZip([a]));
  for(const key of ['indices','mask','paletteKnownMask','paletteRgb']){
   const plane=a.metadata[key],entry=entries.get('indexed/00000_'+key+'.bin');
   if(plane instanceof Uint8Array)assert.deepStrictEqual(Buffer.from(entry.bytes),Buffer.from(plane));else assert.equal(entry,undefined);
  }
  assert.equal(JSON.stringify(metadata(a)),before);fs.writeFileSync(path.join(target,i+'.zip'),archive.bytes);
 }
 console.log(JSON.stringify({status:'PASS',game:'mk1',assets:c.assets.length,indexedCandidates:eligible.length,indexedSamples:chosen.length,
  sourcePlaneBytesCompared:sourcePlaneBytes,existingO60EvidencePlanesVerified:true,paletteStillUnresolved:true,legacyArchiveByteParity:true,planesAndMetadataPreserved:true,originalDataBrowserVerified:false},null,2));
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
