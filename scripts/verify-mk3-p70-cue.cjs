#!/usr/bin/env node
/** P70 original-MK3 complete source/library and CUE-linked Ogg export acceptance.
 * node scripts/verify-mk3-p70-cue.cjs <original-MK3-folder> <PRIVATE-work-directory>
 * Original GOG files and the 43MB generated ZIP remain outside GitHub.
 */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const assert=require('node:assert/strict'),ts=require('typescript');
const {spawnSync}=require('node:child_process');
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(m,file)=>m._compile(
 ts.transpileModule(fs.readFileSync(file,'utf8'),{fileName:file,
 compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
if(!globalThis.crypto)globalThis.crypto=crypto.webcrypto;
const {scanAssets}=require('../src/core/assets/collection.ts');
const {buildMK3CueMusicBundleP70,MK3_P70_ARCHIVE}=
 require('../src/core/assets/mk3CueAudioBundleP70.ts');
const {parseAnimationStoreZip}=
 require('../src/games/mk1/research/browserAnimationExportBundleValidation.ts');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const args=process.argv.slice(2);
assert(args.length===2,'Require original MK3 directory and PRIVATE work directory');
const checkout=fs.realpathSync(path.resolve(__dirname,'..')),
 original=fs.realpathSync(path.resolve(args[0]));
const output=path.resolve(args[1]);
const inside=(a,b)=>{const rel=path.relative(a,b);
 return rel===''||(!rel.startsWith('..'+path.sep)&&rel!=='..'&&!path.isAbsolute(rel));};
function canonical(target){let exists=target,tail=[];
 while(!fs.existsSync(exists)){const parent=path.dirname(exists);
  assert.notEqual(parent,exists,'invalid output path');tail.unshift(path.basename(exists));exists=parent;}
 return path.resolve(fs.realpathSync(exists),...tail);}
const work=canonical(output);
assert(fs.statSync(original).isDirectory(),'MK3 source must be a directory');
assert(!inside(checkout,original)&&!inside(checkout,work)&&!inside(original,work)&&!inside(work,original),
 'Private original source/work must be outside checkout and non-overlapping');
const data=new Map();
function walk(folder,prefix=''){for(const e of fs.readdirSync(folder,{withFileTypes:true})){
 const n=prefix?prefix+'/'+e.name:e.name,full=path.join(folder,e.name);
 if(e.isDirectory())walk(full,n);else if(e.isFile())data.set(n,new Uint8Array(fs.readFileSync(full)));
}}walk(original);
const entries=[...data].map(([p,b])=>({path:p,name:path.basename(p),
 extension:path.extname(p).slice(1).toUpperCase(),size:b.length}));
const exe=entries.filter(e=>e.name.toUpperCase()==='MK3.EXE');
assert.equal(exe.length,1);
assert.equal(sha(data.get(exe[0].path)),
 '8aa7f3d45a086e7373afc120dc88378bda3d7766d5b69badbc707bb4570bdef0');
const source={directoryName:'P70 original MK3 GOG',isSynthetic:false,
 async listRecursive(){return entries;},
 async readSlice(p,start,length){const b=data.get(p);if(!b)throw Error('Missing '+p);return b.slice(start,start+length);}};
(async()=>{
 const collection=await scanAssets(source,'mk3',()=>{});
 assert.equal(collection.assets.length,9186,'MK3 catalogue regression');
 assert.equal(new Set(collection.assets.map(a=>a.id)).size,9186);
 const music=collection.assets.filter(a=>a.kind==='music'&&a.format==='OGG');
 assert.equal(music.length,46,'original OGG track census');
 const cue=collection.assets.filter(a=>a.kind==='raw'&&a.format==='CUE');
 assert.equal(cue.length,1,'original cue census');
 const result=await buildMK3CueMusicBundleP70(collection.assets);
 assert.equal(result.name,MK3_P70_ARCHIVE);
 assert.equal(result.report.status,'VERIFIED');
 assert.equal(result.report.originalOggTracks,46);
 const zip=parseAnimationStoreZip(result.bytes);
 assert.equal(zip.size,49,'manifest/CUE/README plus 46 OGG sources');
 const meta=JSON.parse(new TextDecoder().decode(zip.get('manifest.json').bytes));
 assert.equal(meta.format,'mk3_p70_gog_original_cue_audio_tracks_v1');
 assert.equal(meta.trackRecords.length,46);
 assert.equal(meta.nativeDosRuntimeSongAssociationsClaimed,false);
 assert.equal(meta.dataTrack01NotIncluded,true);
 assert.equal(meta.originalAudioSourceBytes,43367491,'canonical GOG soundtrack bytes');
 const cueOriginal=data.get(cue[0].source.path);
 assert.deepStrictEqual(zip.get('MK3.cue').bytes,cueOriginal);
 for(const record of meta.trackRecords){
  const originalFile=data.get(record.originalSourcePath);
  assert(originalFile,'missing original referenced source '+record.originalSourcePath);
  assert.deepStrictEqual(zip.get(record.archiveMember).bytes,originalFile);
  assert.equal(record.originalSourceSha256,sha(originalFile));
 }
 // Accepted fixture emits the final PASS only after a distinct original
 // Python parser reopens the generated private ZIP and source install files.
 fs.mkdirSync(work,{recursive:true});
 const zipPath=path.join(work,MK3_P70_ARCHIVE);
 fs.writeFileSync(zipPath,result.bytes);
 const report=path.join(work,'p70-independent-original.json');
 const r=spawnSync(process.env.PYTHON||'python',
  ['scripts/verify-mk3-p70-cue-independent.py',original,zipPath,report],
  {cwd:checkout,encoding:'utf8',timeout:300000,maxBuffer:4*1024*1024,windowsHide:true});
 if(r.error||r.status!==0)
  throw Error('P70 independent original CUE/OGG source readback failed:\n'+
   [r.error?.message,r.stderr,r.stdout].filter(Boolean).join('\n'));
 const independent=JSON.parse(fs.readFileSync(report,'utf8'));
 assert.equal(independent.status,'PASS');
 assert.equal(independent.originalOggTracks,46);
 assert.equal(independent.originalOggByteTotal,43367491);
 assert.equal(independent.allOriginalCueAndOggBytesMatched,true);
 const summary={pass:'P70',status:'PASS',mk3Assets:9186,
  originalCueBytes:meta.originalCueBytes,originalOggTracks:46,
  originalOggByteTotal:independent.originalOggByteTotal,
  allOriginalSourceBytesAndHashesMatched:true,
  literalMp3CueVsActualOggPreserved:true,
  nativeGameplayAssociationsClaimed:false,completeCdImageClaimed:false,
  browserDownloadVerified:false,privateWorkDirectory:work};
 fs.writeFileSync(path.join(work,'p70-summary.json'),JSON.stringify(summary,null,2)+'\n');
 console.log(JSON.stringify(summary,null,2));
})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
