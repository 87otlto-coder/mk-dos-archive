#!/usr/bin/env node
/** P21 read-only MK1/MK3 collection and representative export regression.
 * node scripts/verify-cross-game-p21.cjs <mk1|mk3> <original directory>
 * Original input hashes are recorded, not a claim of complete corpus identity.
 */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const ts=require('typescript');
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(m,file)=>m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{fileName:file,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,file);
if(!globalThis.crypto)globalThis.crypto=crypto.webcrypto;
const {scanAssets}=require('../src/core/assets/collection.ts');
const {selectedZip,assetBytes}=require('../src/core/assets/export.ts');
const {parseAnimationStoreZip,decodeAnimationBundlePng}=require('../src/games/mk1/research/browserAnimationExportBundleValidation.ts');
const game=process.argv[2],root=process.argv[3];
assert.ok(['mk1','mk3'].includes(game)&&root,'Usage: verify-cross-game-p21.cjs <mk1|mk3> <original directory>');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
let checks=0;const eq=(a,b,label)=>{assert.deepStrictEqual(a,b,label);checks++};
const entries=[];function walk(dir,prefix=''){for(const f of fs.readdirSync(dir,{withFileTypes:true})){
 const rel=prefix?prefix+'/'+f.name:f.name,full=path.join(dir,f.name);
 if(f.isDirectory())walk(full,rel);else if(f.isFile())entries.push({path:rel,name:f.name,extension:path.extname(rel).slice(1).toUpperCase(),size:fs.statSync(full).size});
}}walk(root);
const source={directoryName:'P21 local original '+game,isSynthetic:false,async listRecursive(){return entries;},async readSlice(p,start,count){
 const fd=fs.openSync(path.join(root,p),'r');try{const b=Buffer.alloc(count),n=fs.readSync(fd,b,0,count,start);return new Uint8Array(b.subarray(0,n));}finally{fs.closeSync(fd);}
}};
(async()=>{
 const exe=entries.find(e=>e.name.toLowerCase()===game+'.exe');assert.ok(exe,'game EXE present');checks++;
 const exeHash=sha(await source.readSlice(exe.path,0,exe.size));
 if(game==='mk1')eq(exeHash,'750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14','qualified MK1 EXE');
 const r=await scanAssets(source,game,()=>{});
 const counts=r.assets.reduce((o,a)=>(o[a.kind]=(o[a.kind]||0)+1,o),{});
 const expected=game==='mk1'?{sprite:2363,stage:49,audio:244}:{sprite:6654,raw:1046,audio:1024,image:416,music:46};
 eq(counts,expected,'P11 historical original-fixture kind census');
 eq(new Set(r.assets.map(a=>a.id)).size,r.assets.length,'unique IDs');
 const kinds=Object.keys(expected);
 const chosen=game==='mk1'?r.assets.filter(a=>a.kind==='stage'):kinds.flatMap(k=>{const a=r.assets.filter(x=>x.kind===k);return [a[0],a.at(-1)];});
 if(game==='mk1'){
  eq(chosen.filter(a=>a.name.includes('normalized_combined_background')).length,24,'24 normalized module previews');
  eq(r.packages.some(p=>p.name==='MK1_stages_evidence.zip'),true,'MK1 stage evidence remains present');
 }
 const exported=parseAnimationStoreZip(selectedZip(chosen));
 const manifest=JSON.parse(new TextDecoder().decode(exported.get('manifest.json').bytes));
 eq(manifest.selectionOrder.map(a=>a.id),chosen.map(a=>a.id),'selected ZIP order');
 for(const [ordinal,a]of chosen.entries()){
  const pngOrPayload=[...exported].filter(([k])=>k.startsWith('assets/'))[ordinal];
  assert.ok(pngOrPayload,'exported payload present');checks++;
  eq(Buffer.from(pngOrPayload[1].bytes),Buffer.from(assetBytes(a)),'export payload bytes '+a.id);
  if(a.rgba){const decoded=decodeAnimationBundlePng(pngOrPayload[1].bytes);
   eq([decoded.width,decoded.height],[a.width,a.height],'PNG dimensions '+a.id);
   eq(Buffer.from(decoded.rgba),Buffer.from(a.rgba),'PNG decoded pixels '+a.id);
  }
  for(const plane of ['indices','mask','paletteKnownMask'])if(a.metadata[plane] instanceof Uint8Array){
   const entry=exported.get(`indexed/${String(ordinal).padStart(5,'0')}_${plane}.bin`);
   assert.ok(entry,'indexed sidecar present');checks++;
   eq(Buffer.from(entry.bytes),Buffer.from(a.metadata[plane]),'sidecar byte parity '+plane);
  }
 }
 // Hashes contain no original pixels or executable bytes and are safe evidence.
 const visualHash=crypto.createHash('sha256');
 for(const a of [...r.assets].sort((a,b)=>a.id.localeCompare(b.id)))if(a.rgba){
  eq(a.rgba.length,a.width*a.height*4,'valid visual plane '+a.id);
  visualHash.update(a.id+'\0');visualHash.update(a.rgba);
 }
 console.log(JSON.stringify({pass:'P21',game,status:'PASS',checks,inputFiles:entries.length,exeSha256:exeHash,assets:r.assets.length,counts,
  selectedAssetsExportVerified:chosen.length,visualPlaneSha256:visualHash.digest('hex'),
  packageHashes:r.packages.map(p=>({name:p.name,sha256:sha(p.bytes)})),
  browserInteractionVerified:false,completeCorpusIdentityVerified:false,stageOwnershipExpanded:false},null,2));
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
