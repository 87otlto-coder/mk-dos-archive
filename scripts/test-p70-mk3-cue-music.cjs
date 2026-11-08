#!/usr/bin/env node
/** P70 source-only original CUE join, Ogg byte preservation and explicit refusals. */
const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict'),ts=require('typescript');
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(m,p)=>m._compile(
 ts.transpileModule(fs.readFileSync(p,'utf8'),{fileName:p,
 compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,p);
if(!globalThis.crypto)globalThis.crypto=crypto.webcrypto;
const {buildMK3CueMusicBundleP70,MK3_P70_FORMAT,MK3_P70_ARCHIVE}=
 require('../src/core/assets/mk3CueAudioBundleP70.ts');
const {parseAnimationStoreZip}=
 require('../src/games/mk1/research/browserAnimationExportBundleValidation.ts');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const enc=new TextEncoder();
function fixture(){
 const lines=['FILE "MK3.GOG" BINARY','  TRACK 01 MODE1/2048','    INDEX 0 00:00:00'];
 const oggs=[];
 for(let i=2;i<=47;i++){
  const name='Track'+String(i).padStart(2,'0')+'.ogg',bytes=enc.encode('OggS'+String(i));
  lines.push('FILE "'+name+'" MP3','  TRACK '+String(i).padStart(2,'0')+' AUDIO',
    '    INDEX 0 00:00:00');
  oggs.push({id:'IMAGE/'+name,group:'CD music',kind:'music',format:'OGG',
   mime:'audio/ogg',filename:name,name,
   source:{path:'IMAGE/'+name,offset:0,length:bytes.length,sha256:sha(bytes)},
   metadata:{},bytes});
 }
 const cue=enc.encode(lines.join('\r\n')+'\r\n');
 return [{id:'IMAGE/MK3.cue',name:'MK3.cue',group:'Music metadata',
  kind:'raw',format:'CUE',filename:'MK3.cue',
  source:{path:'IMAGE/MK3.cue',offset:0,length:cue.length,sha256:sha(cue)},
  metadata:{},bytes:cue},...oggs];
}
async function reject(label,fn,pattern){
 const f=fixture();fn(f);
 await assert.rejects(buildMK3CueMusicBundleP70(f),pattern,label);
}
(async()=>{
 const a=fixture(),pkg=await buildMK3CueMusicBundleP70(a);
 assert.equal(pkg.name,MK3_P70_ARCHIVE);
 assert.equal(pkg.report.status,'VERIFIED');
 assert.equal(pkg.report.originalOggTracks,46);
 assert.equal(pkg.report.dataTrack01Included,false);
 assert.equal(pkg.report.nativeRuntimeSongAssociationsClaimed,false);
 const z=parseAnimationStoreZip(pkg.bytes);
 assert.equal(z.size,49,'original CUE, 46 OGG, manifest and README');
 assert.deepStrictEqual(z.get('MK3.cue').bytes,a[0].bytes);
 const m=JSON.parse(new TextDecoder().decode(z.get('manifest.json').bytes));
 assert.equal(m.format,MK3_P70_FORMAT);
 assert.equal(m.originalCueSha256,sha(a[0].bytes));
 assert.equal(m.originalCuePath,'IMAGE/MK3.cue');
 assert.equal(m.originalOggTracks,46);
 assert.equal(m.originalBinaryDataTrack01.cueReferencedFilename,'MK3.GOG');
 assert.equal(m.originalBinaryDataTrack01.includedInAudioOnlyArchive,false);
 assert.equal(m.completeReconstructedCdImageClaimed,false);
 assert.equal(m.nativeDosRuntimeSongAssociationsClaimed,false);
 assert.equal(m.nativeMusicLoopDurationsClaimed,false);
 assert.equal(m.cueDeclaredAudioFileType,'MP3');
 assert.equal(m.actualAudioContainerSignature,'OggS');
 assert.equal(m.cueIndexStatementsAreLiteralNotRuntimeTimings,true);
 assert.deepStrictEqual(m.trackRecords.map(r=>r.cueTrackNumber),
  Array.from({length:46},(_,i)=>i+2));
 for(let i=0;i<46;i++){
  const rec=m.trackRecords[i],src=a[i+1];
  assert.equal(rec.originalSourcePath,src.source.path);
  assert.equal(rec.originalSourceSha256,sha(src.bytes));
  assert.equal(rec.originalAudioSignature,'OggS');
  assert.equal(rec.cueFileDeclaredType,'MP3');
  assert.equal(rec.gameplayStageCueVerified,false);
  assert.equal(rec.originalLoopAndTimingVerified,false);
  assert.deepStrictEqual(z.get(rec.archiveMember).bytes,src.bytes);
 }
 assert.equal(pkg.report.completeOriginalAudioBytes,a.slice(1).reduce((n,x)=>n+x.bytes.length,0));
 let refusals=0;
 const fail=async(name,fn,rx)=>{await reject(name,fn,rx);refusals++;};
 await fail('no source CUE',a=>a.shift(),/one and only one original MK3.cue/);
 await fail('duplicate source CUE',a=>a.push({...a[0]}),/one and only one original MK3.cue/);
 await fail('relative CUE path escapes',a=>{a[0].source.path='../MK3.cue'},/unqualified original MK3 CUE file/);
 await fail('corrupt original CUE SHA',a=>{a[0].source.sha256='f'.repeat(64)},/original CUE source SHA mismatch/);
 await fail('CUE missing triple',a=>{
   const x=new TextDecoder().decode(a[0].bytes).replace('  TRACK 47 AUDIO\r\n','');
   a[0].bytes=enc.encode(x);a[0].source.length=a[0].bytes.length;a[0].source.sha256=sha(a[0].bytes);
 },/47 original CUE file\/track\/index triples/);
 await fail('wrong CUE data track',a=>{
   a[0].bytes=enc.encode(new TextDecoder().decode(a[0].bytes).replace('MK3.GOG','MK3.OGG'));
   a[0].source.sha256=sha(a[0].bytes);a[0].source.length=a[0].bytes.length;
 },/missing original binary data track 01/);
 await fail('wrong CUE track order',a=>{
   a[0].bytes=enc.encode(new TextDecoder().decode(a[0].bytes).replace('TRACK 02 AUDIO','TRACK 04 AUDIO'));
   a[0].source.sha256=sha(a[0].bytes);a[0].source.length=a[0].bytes.length;
 },/noncanonical CUE track number\/order/);
 await fail('guessed CUE index/time',a=>{
   a[0].bytes=enc.encode(new TextDecoder().decode(a[0].bytes).replace('INDEX 0 00:00:00','INDEX 01 00:03:00'));
   a[0].source.sha256=sha(a[0].bytes);a[0].source.length=a[0].bytes.length;
 },/unverified CUE index or original track time/);
 await fail('cue declares OGG instead of MP3',a=>{
   a[0].bytes=enc.encode(new TextDecoder().decode(a[0].bytes).replace('Track02.ogg" MP3','Track02.ogg" OGG'));
   a[0].source.sha256=sha(a[0].bytes);a[0].source.length=a[0].bytes.length;
 },/invalid CUE FILE declaration/);
 await fail('no source OGG',a=>a.splice(1,1),/missing\/duplicate source IMAGE\/Track02.ogg/);
 await fail('duplicate source OGG',a=>a.push({...a[1]}),/missing\/duplicate source IMAGE\/Track02.ogg/);
 await fail('wrong OGG source length',a=>a[1].source.length++,/incomplete original source asset/);
 await fail('wrong OGG digest',a=>a[1].source.sha256='0'.repeat(64),/original CUE-referenced Ogg SHA-256 mismatch/);
 await fail('false MP3 audio',a=>a[1].bytes=enc.encode('ID3!2'),/original referenced file is not an Ogg stream/);
 await fail('forged OGG format',a=>a[1].format='MP3',/unqualified referenced Ogg source/);
 assert.equal(refusals,15);
 console.log(JSON.stringify({pass:'P70_SOURCE',status:'PASS',
  qualifiedCueReferencedOggFiles:46,originalCueBytesPreserved:true,
  originalOggBytesPreserved:true,declaredMP3ActualOggMismatchRetained:true,
  originalBinaryDataTrackExcludedAndExplicit:true,invalidEvidenceRefused:refusals,
  nativeRuntimeStageOrLoopClaimed:false,syntheticOnly:true},null,2));
})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
