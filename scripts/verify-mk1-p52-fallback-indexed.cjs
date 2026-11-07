#!/usr/bin/env node
/** P52 original-MK1 fixture gate: fallback Kano indexed sidecars and strict canonical routing.
 * Usage: node scripts/verify-mk1-p52-fallback-indexed.cjs <original MK1 directory> [private report path]
 * This checks original game data locally; no commercial assets belong in Git.
 */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),ts=require('typescript');
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{fileName:f,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,f);
if(!globalThis.crypto)globalThis.crypto=crypto.webcrypto;
const {scanMK1ReadOnlyFallback}=require('../src/core/assets/mk1ReadOnlyFallback.ts');
const {scanAssets}=require('../src/core/assets/collection.ts');
const {indexedAssetZip,selectedZip}=require('../src/core/assets/export.ts');
const {decodeUgraSprite}=require('../src/games/mk1/graphics/ugraDecoder.ts');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const original=process.argv[2];assert(original,'Provide original MK1 directory');
const data=new Map();
function walk(dir,prefix=''){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=prefix?prefix+'/'+e.name:e.name,full=path.join(dir,e.name);if(e.isDirectory())walk(full,p);else if(e.isFile())data.set(p,new Uint8Array(fs.readFileSync(full)));}}
walk(original);
function asSource(files){return {directoryName:'P52 original MK1',isSynthetic:false,
 async listRecursive(){return [...files].map(([p,b])=>({path:p,name:path.basename(p),extension:path.extname(p).slice(1).toUpperCase(),size:b.length}));},
 async readSlice(p,start,count){const b=files.get(p);if(!b)throw Error('Missing source '+p);return b.slice(start,start+count);}};}
const find=(name)=>[...data].filter(([p])=>path.basename(p).toLowerCase()===name.toLowerCase());
const exe=find('MK1.EXE'),gra=find('KANO.GRA');
assert.equal(exe.length,1);assert.equal(gra.length,1);
assert.equal(sha(exe[0][1]),'750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14');
assert.equal(sha(gra[0][1]),'5b32513ed4fd5363f6aab56a9f2493b96ffbe331593297a277d4aac5fbbd9390');
function zipMembers(bytes){
 const members=new Map();let p=0;
 while(p+30<=bytes.length){
  const signature=new DataView(bytes.buffer,bytes.byteOffset+p,4).getUint32(0,true);
  if(signature!==0x04034b50)break;
  const v=new DataView(bytes.buffer,bytes.byteOffset+p,30);
  const flags=v.getUint16(6,true),method=v.getUint16(8,true),size=v.getUint32(18,true),nameLen=v.getUint16(26,true),extraLen=v.getUint16(28,true);
  assert.equal(flags&8,0,'data descriptors disallowed');assert.equal(method,0,'stored ZIP expected');
  const name=new TextDecoder().decode(bytes.subarray(p+30,p+30+nameLen));
  const start=p+30+nameLen+extraLen,end=start+size;
  assert(end<=bytes.length);assert(!members.has(name));members.set(name,bytes.subarray(start,end));p=end;
 }
 assert(members.has('manifest.json'));return members;
}
(async()=>{
 const fallback=await scanMK1ReadOnlyFallback(asSource(data),()=>{},undefined,'P52 deliberate read-only audit');
 assert.equal(fallback.reports.mode,'MK1_READ_ONLY_FALLBACK');
 const frames=fallback.assets.filter(a=>a.id.startsWith('mk1-kano-index:'));
 assert.equal(frames.length,187);assert.equal(fallback.reports.indexedKanoFrames,187);
 const hash=crypto.createHash('sha256');let pixels=0,opaque=0;
 for(const a of frames){
  assert(a.metadata.indices instanceof Uint8Array);assert(a.metadata.mask instanceof Uint8Array);
  const index=a.metadata.indices,mask=a.metadata.mask;
  assert.equal(index.length,a.width*a.height);assert.equal(mask.length,index.length);
  const exact=decodeUgraSprite(gra[0][1],a.source.offset,a.width,a.height);
  assert(exact.success);assert.deepStrictEqual(index,exact.indices);assert.deepStrictEqual(mask,exact.opaqueMask);
  const at=a.metadata.descriptorPhysical;
  const header=Buffer.alloc(8);header.writeUInt32LE(at,0);header.writeUInt16LE(a.width,4);header.writeUInt16LE(a.height,6);
  hash.update(header);hash.update(index);hash.update(mask);
  pixels+=index.length;opaque+=mask.reduce((n,v)=>n+v,0);
  assert.equal(a.metadata.palette,'UNRESOLVED');
  assert.equal(a.metadata.paletteRgb,undefined);
  const single=indexedAssetZip(a);
  assert.deepStrictEqual(single.bytes,selectedZip([a]));
  const contents=zipMembers(single.bytes);
  assert.deepStrictEqual(contents.get('indexed/00000_indices.bin'),index);
  assert.deepStrictEqual(contents.get('indexed/00000_mask.bin'),mask);
  assert(![...contents].some(([n])=>n.includes('paletteRgb')||n.includes('paletteKnownMask')));
 }
 assert.equal(pixels,928368);assert.equal(opaque,340324);
 assert.equal(hash.digest('hex'),'838216030d67125687534f8a5e7e576d2381d049e3b98ca13185c48b12a8668a');
 const a=frames[0],mutations=[
  {...a,metadata:{...a.metadata,indices:undefined}},
  {...a,metadata:{...a.metadata,indices:a.metadata.indices.subarray(1)}},
  {...a,metadata:{...a.metadata,mask:new Uint8Array(1)}},
  {...a,metadata:{...a.metadata,paletteRgb:new Uint8Array([1,2,3])}},
 ];
 for(const damaged of mutations)assert.throws(()=>indexedAssetZip(damaged),'malformed export accepted');
 // Deliberately patch an unrelated byte: altered executable must route to fallback, never canonical authoring.
 const patched=new Map(data);
 const modified=exe[0][1].slice();modified[100]^=1;patched.set(exe[0][0],modified);
 const routed=await scanAssets(asSource(patched),'mk1',()=>{});
 assert.equal(routed.reports.mode,'MK1_READ_ONLY_FALLBACK');
 assert.equal(routed.reports.indexedKanoFrames,187);
 assert.equal(routed.assets.filter(x=>x.id.startsWith('mk1-kano-index:')).length,187);
 const denied=new Map(patched);const damaged=modified.slice();damaged[0xA7464]^=1;denied.set(exe[0][0],damaged);
 const invalid=await scanMK1ReadOnlyFallback(asSource(denied),()=>{});
 assert.equal(invalid.reports.indexedKanoFrames,0);
 assert.equal(invalid.assets.filter(x=>x.id.startsWith('mk1-kano-index:')).length,0);
 const result={pass:'P52',status:'PASS',originalKanoFrames:187,indexPixels:pixels,opaquePixels:opaque,
  decodedCombinedSha256:'838216030d67125687534f8a5e7e576d2381d049e3b98ca13185c48b12a8668a',
  indexedZipsChecked:187,malformedExportsRejected:mutations.length,modifiedExeFallbackVerified:true,
  alteredDescriptorFailsClosed:true,canonicalResearchGateUnchanged:true,nativePaletteOwnershipKnown:false,
  originalDataBrowserInteractionVerified:false};
 if(process.argv[3])fs.writeFileSync(process.argv[3],JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify(result,null,2));
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
