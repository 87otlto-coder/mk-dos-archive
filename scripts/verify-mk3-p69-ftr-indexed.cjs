#!/usr/bin/env node
/** P69 original MK3 full fighter sprite indexed-plane/manifest fixture gate.
 * Usage:
 *   node scripts/verify-mk3-p69-ftr-indexed.cjs <original MK3 dir> <PRIVATE-work-dir>
 * Makes 17 private original-FTR index/mask ZIP exports, then runs a separate
 * original-FTR descriptor and bitstream oracle in Python. No media in Git.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {spawnSync}=require('node:child_process'),ts=require('typescript');
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(m,f)=>m._compile(
 ts.transpileModule(fs.readFileSync(f,'utf8'),{fileName:f,
 compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
if(!globalThis.crypto)globalThis.crypto=crypto.webcrypto;
const {scanAssets}=require('../src/core/assets/collection.ts');
const {buildMK3FighterIndexedBundleP69,MK3_P69_FORMAT}=
 require('../src/core/assets/mk3FighterIndexedBundleP69.ts');
const {parseAnimationStoreZip}=
 require('../src/games/mk1/research/browserAnimationExportBundleValidation.ts');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
assert.equal(process.argv.length,4,'Provide original MK3 directory and PRIVATE work directory');
const root=fs.realpathSync(path.resolve(__dirname,'..'));
const originals=fs.realpathSync(process.argv[2]);
assert(fs.statSync(originals).isDirectory(),'Original MK3 must be a directory');
const output=path.resolve(process.argv[3]);
function inside(parent,child){const rel=path.relative(parent,child);return rel===''||(!rel.startsWith('..'+path.sep)&&rel!=='..'&&!path.isAbsolute(rel));}
function canonical(target){let existing=target,tail=[];
 while(!fs.existsSync(existing)){let parent=path.dirname(existing);assert.notEqual(parent,existing);tail.unshift(path.basename(existing));existing=parent;}
 return path.resolve(fs.realpathSync(existing),...tail);}
const work=canonical(output);
assert(!inside(root,originals)&&!inside(root,work)&&!inside(originals,work)&&!inside(work,originals),
 'P69 commercial originals and work must remain outside Git and each other');
fs.mkdirSync(work,{recursive:true});
const data=new Map();
function walk(folder,prefix=''){for(const e of fs.readdirSync(folder,{withFileTypes:true})){
 const n=prefix?prefix+'/'+e.name:e.name,full=path.join(folder,e.name);
 if(e.isDirectory())walk(full,n);else if(e.isFile())data.set(n,new Uint8Array(fs.readFileSync(full)));
}}walk(originals);
const entries=[...data].map(([p,b])=>({path:p,name:path.basename(p),
 extension:path.extname(p).slice(1).toUpperCase(),size:b.length}));
const exe=entries.filter(e=>e.name.toUpperCase()==='MK3.EXE');
assert.equal(exe.length,1,'canonical MK3 executable missing/duplicated');
assert.equal(sha(data.get(exe[0].path)),
 '8aa7f3d45a086e7373afc120dc88378bda3d7766d5b69badbc707bb4570bdef0',
 'original MK3.EXE identity differs');
const source={directoryName:'P69 original MK3',isSynthetic:false,
 async listRecursive(){return entries;},
 async readSlice(p,offset,count){const b=data.get(p);if(!b)throw Error('Missing '+p);return b.slice(offset,offset+count);}};
(async()=>{
 const c=await scanAssets(source,'mk3',()=>{});
 assert.equal(c.assets.length,9186,'MK3 asset census regression');
 assert.equal(new Set(c.assets.map(a=>a.id)).size,9186,'duplicate MK3 ID');
 const ftr=entries.filter(e=>e.extension==='FTR').sort((a,b)=>a.path.localeCompare(b.path));
 assert.equal(ftr.length,17,'original canonical fighter containers');
 const sprites=c.assets.filter(a=>a.kind==='sprite' && /\.FTR$/i.test(a.source.path));
 assert.equal(sprites.length,6654,'canonical MK3 fighter indexed sprite count');
 const cases=[];let total=0;
 for(const [n,e]of ftr.entries()){
  const file=data.get(e.path);
  const selected=sprites.filter(a=>a.source.path===e.path);
  assert(selected.length>0,'FTR has no extracted original sprites '+e.path);
  const bundle=await buildMK3FighterIndexedBundleP69(c.assets,e.path);
  const zip=parseAnimationStoreZip(bundle.bytes);
  const raw=zip.get('manifest.json');
  assert(raw,'P69 manifest missing '+e.path);
  const manifest=JSON.parse(new TextDecoder().decode(raw.bytes));
  assert.equal(manifest.format,MK3_P69_FORMAT);
  assert.equal(manifest.originalFtrWholeFileSha256,sha(file));
  assert.equal(manifest.originalFtrPath,e.path);
  assert.equal(manifest.spriteCount,selected.length);
  assert.equal(manifest.originalDescriptors.length,selected.length);
  assert.equal(zip.size,selected.length*2+2);
  const byId=new Map(selected.map(a=>[a.id,a]));
  for(const descriptor of manifest.originalDescriptors){
   const a=byId.get(descriptor.sourceAssetId);
   assert(a,'source frame not registered '+descriptor.sourceAssetId);
   assert.deepStrictEqual(zip.get(descriptor.indicesPath).bytes,a.metadata.indices);
   assert.deepStrictEqual(zip.get(descriptor.maskPath).bytes,a.metadata.mask);
   assert.equal(descriptor.indicesSha256,sha(a.metadata.indices));
   assert.equal(descriptor.maskSha256,sha(a.metadata.mask));
   assert.equal(descriptor.nativePaletteVerified,false);
   assert.equal(descriptor.runtimeAnimationOrderVerified,false);
   assert(descriptor.originalSourceOffset>=0 && descriptor.originalCompressedByteLength>0 &&
    descriptor.originalSourceOffset+descriptor.originalCompressedByteLength<=file.length,
    'source interval exceeds original container');
  }
  const zipName='container_'+String(n).padStart(2,'0')+'.zip';
  fs.writeFileSync(path.join(work,zipName),bundle.bytes);
  cases.push({originalFtrPath:e.path,originalFtrSha256:sha(file),
   zip:zipName,frames:manifest.spriteCount});
  total+=selected.length;
 }
 assert.equal(total,6654);
 const casesPath=path.join(work,'p69_cases.json');
 fs.writeFileSync(casesPath,JSON.stringify({format:'mk3_p69_original_ftr_cases_v1',
   originalExeSha256:sha(data.get(exe[0].path)), cases},null,2)+'\n');
 const report=path.join(work,'p69_original_independent.json');
 const python=process.env.PYTHON||'python';
 const r=spawnSync(python,['scripts/verify-mk3-p69-ftr-independent.py',originals,work,report],
  {cwd:root,encoding:'utf8',timeout:1800000,maxBuffer:4*1024*1024,windowsHide:true});
 if(r.error||r.status!==0)throw new Error('Independent MK3 indexed bitstream oracle FAILED:\n'+
  [r.error?.message,r.stderr,r.stdout].filter(Boolean).join('\n'));
 const details=JSON.parse(fs.readFileSync(report,'utf8'));
 assert.equal(details.status,'PASS');
 assert.equal(details.originalFtrContainers,17);
 assert.equal(details.originalIndexedSprites,6654);
 assert.equal(details.independentlyDecodedPlanes,6654);
 assert.equal(details.originalCompressedSourceIntervalsMatched,true);
 assert.equal(details.originalFhdsDescriptorFieldsMatched,true);
 assert.equal(details.nativePaletteOrRuntimeAnimationClaimed,false);
 const summary={pass:'P69',status:'PASS',mk3Assets:9186,
  originalFtrContainers:17,originalIndexedSprites:6654,
  independentlyDecodedPlanes:details.independentlyDecodedPlanes,
  originalSourceIntervalsVerified:details.originalSourceIntervalsVerified,
  indexedPixelBytesVerified:details.indexedPixelBytesVerified,
  opaqueMaskPixelsVerified:details.opaqueMaskPixelsVerified,
  outputPackages:cases.length,allOriginalSourceHashesMatched:true,
  noNativePaletteOrRuntimeSequenceClaimed:true,
  browserPackageDownloadVerified:false,
  privateWorkDirectory:work};
 fs.writeFileSync(path.join(work,'p69-summary.json'),JSON.stringify(summary,null,2)+'\n');
 console.log(JSON.stringify(summary,null,2));
})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
