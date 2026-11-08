#!/usr/bin/env node
/** P64 source-only original-MID evidence joins and negative controls. No game files. */
const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict'),ts=require('typescript');
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(m,f)=>m._compile(
 ts.transpileModule(fs.readFileSync(f,'utf8'),{fileName:f,
 compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
if(!globalThis.crypto)globalThis.crypto=crypto.webcrypto;
const {buildMK2MusicAssetsP64}=require('../src/core/assets/mk2MusicProvenanceP64.ts');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function song(){
 const b=new Uint8Array(50);
 b[0]=1;b[1]=48;
 b.set([0,0x80,0,60,100,1,0x9c,5,0x98],4);
 b.set([0,0x81,0,0x92,10,10,0x91],16);
 b[35]=96;b[36]=120;b[37]=2;b[38]=4;b[40]=16;b[48]=35;
 return b;
}
async function fail(name,bytes,expect){
 const r=await buildMK2MusicAssetsP64('sound/'+name+'.mid',name+'.mid',bytes);
 assert.equal(r.assets.length,1,'Malformed score must retain only original raw bytes');
 assert.equal(r.assets[0].kind,'raw');
 assert.equal(r.assets[0].metadata.originalScoreDecodeStatus,'UNAVAILABLE');
 assert.match(r.report.error,expect);
}
(async()=>{
 const b=song(),ret=await buildMK2MusicAssetsP64('SOUND/TEST.MID','TEST.MID',b);
 assert.equal(ret.assets.length,2);assert.equal(ret.report.status,'VERIFIED');
 const [raw,midi]=ret.assets,p=midi.metadata.p64ScoreProvenance;
 assert.equal(raw.id,'raw:SOUND/TEST.MID');assert.equal(midi.id,'midi:SOUND/TEST.MID');
 assert.equal(raw.filename,'TEST.MID.soundimages.bin');assert.equal(midi.filename,'TEST.MID');
 assert.deepStrictEqual(raw.bytes,b,'original score byte preserved');
 assert.equal(raw.source.sha256,sha(b));assert.equal(midi.source.sha256,sha(b));
 assert.equal(raw.source.length,b.length);assert.deepStrictEqual(p.sourceByteRange,[0,b.length]);
 assert.equal(p.sourceSha256,sha(b));assert.equal(p.exportedMidiSha256,sha(midi.bytes));
 assert.equal(p.originalTrackCount,2);assert.equal(p.nativeRepeatBoundaries,1);
 assert.equal(p.nativeStopBoundaries,1);
 assert.deepStrictEqual(p.sourceTrackBoundaries.map(x=>x.terminalOpcode),['0x98','0x91']);
 assert.equal(p.sourceTrackBoundaries[0].savedRepeatCursorOffset,11);
 assert.equal(p.sourceTrackBoundaries[1].savedRepeatCursorOffset,null);
 assert.equal(p.exportTraversal,'ONE_PASS');
 assert.equal(p.runtimeLoopDurationVerified,false);
 assert.equal(p.runtimeTempoSchedulingVerified,false);
 assert.equal(p.nativeInstrumentTimbreVerified,false);
 assert.equal(raw.metadata.originalScoreDecodeStatus,'VERIFIED');
 assert.deepStrictEqual(raw.metadata.p64ScoreProvenance,p);
 let count=0;
 const rejected=async(label,promise,pattern)=>{
  await assert.rejects(promise,pattern,label);count++;
 };
 await rejected('source/name mismatch',buildMK2MusicAssetsP64('sound/a.mid','b.mid',b),/source path and filename/);
 await rejected('extension mismatch',buildMK2MusicAssetsP64('sound/test.wav','test.wav',b),/source path and filename/);
 await rejected('empty original',buildMK2MusicAssetsP64('sound/test.mid','test.mid',new Uint8Array()),/must contain source bytes/);
 const corrupt=b.slice();corrupt[1]=255;corrupt[2]=127;
 await fail('table-out-of-range',corrupt,/table out of bounds/);count++;
 const global=b.slice();global[12]=0x9a;await fail('unsupported-driver-global-branch',global,/Driver-global sequence branch/);count++;
 const badPpqn=b.slice();badPpqn[35]=0;await fail('invalid-ppqn',badPpqn,/Invalid song header/);count++;
 const badTerm=b.slice();badTerm[12]=0x9e;await fail('unsupported-command',badTerm,/Unsupported sequence command/);count++;
 const badVar=b.slice();badVar.set([0x80,0x80,0x80,0x80,0x80],4);
 await fail('malformed-delta',badVar,/Invalid sequence delta/);count++;
 assert.equal(count,8);
 console.log(JSON.stringify({pass:'P64_SOURCE',status:'PASS',falseClaimsRejected:count,
  originalScoreBytesRetained:true,sourceExtentAndHashPreserved:true,
  midiExportHasSeparateDigest:true,nativeRepeatVsStopDistinguished:true,
  nativeTimingOrTimbreClaimed:false,syntheticFixtureOnly:true},null,2));
})().catch(error=>{console.error(error.stack||error);process.exitCode=1;});
