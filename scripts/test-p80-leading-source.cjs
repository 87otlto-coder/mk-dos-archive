#!/usr/bin/env node
/** P80 source-only test: original leading base indices + undecoded raw records.
 * Never treats 216 stored payloads as native video frames or palettes.
 */
const assert=require('node:assert/strict'),fs=require('node:fs');
const crypto=require('node:crypto'),ts=require('typescript');
for(const ext of ['.ts','.tsx']) require.extensions[ext]=(m,p)=>m._compile(
 ts.transpileModule(fs.readFileSync(p,'utf8'),{fileName:p,compilerOptions:{
  module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,
 }}).outputText,p);
if(!globalThis.crypto)globalThis.crypto=crypto.webcrypto;
const {decodeMK3P80LeadingSpan,recoverMK3P80LeadingAssets,
 MK3_P80_SOURCE_OFFSET,MK3_P80_SOURCE_LENGTH,MK3_P80_SOURCE_RECORDS,
 MK3_P80_BASE_GROUP,MK3_P80_RAW_GROUP}=require('../src/core/assets/mk3LeadingSpanP80.ts');
const {indexedAssetZip}=require('../src/core/assets/export.ts');
const {parseAnimationStoreZip}=require('../src/games/mk1/research/browserAnimationExportBundleValidation.ts');
const head=Buffer.alloc(6);head.writeUInt16LE(2,0);head.writeUInt16LE(3,2);head.writeUInt16LE(2,4);
const candidate=Buffer.alloc(768);for(let i=0;i<768;i++)candidate[i]=i&255;
const baseHeader=Buffer.alloc(8);baseHeader.writeUInt32LE(6,4);
const indices=Buffer.from([0,255,12,0,7,52]);
const firstRecord=Buffer.alloc(14);firstRecord.writeUInt16LE(3);firstRecord.writeUInt32LE(11,2);firstRecord.writeUInt32LE(6,6);firstRecord.writeUInt32LE(3,10);
const emptyRecord=Buffer.alloc(14);emptyRecord.writeUInt16LE(3);
const source=Buffer.concat([head,candidate,baseHeader,indices,
 firstRecord,Buffer.from([0,7,255]),emptyRecord]);
let positive=0,rejections=0;
const got=decodeMK3P80LeadingSpan(new Uint8Array(source),1000);
assert.equal(got.width,3);assert.equal(got.height,2);
assert.equal(got.declaredRecords,2);
assert.deepEqual([...got.baseIndices], [...indices]);
assert.equal(got.records.length,2);
assert.deepEqual(got.emptyRecordOrdinals,[1]);
assert.equal(got.totalPayloadBytes,3);
assert.equal(got.sourceEndOffset,1000+source.length);
assert.deepEqual(Buffer.concat(got.records.map(x=>Buffer.from(x.bytes))),
 Buffer.concat([firstRecord,Buffer.from([0,7,255]),emptyRecord]));
assert.equal(got.records[0].payloadOffset,1000+782+6+14);
assert.equal(got.records[1].payloadLength,0);
assert.equal(got.records[1].bytes.length,14);
assert.equal(got.grayscaleRgba[3],255,'opaque preview only');
assert.equal(got.grayscaleRgba[4+3],255,'255 index preview opaque');
assert.equal(got.baseIndices[0],0,'original zero index is not missing pixel');
assert.equal(got.candidateRgb8.length,768);
positive++;
const fake={
 id:'p80:synthetic',name:'Leading base indices',kind:'image',group:MK3_P80_BASE_GROUP,
 format:'Synthetic test',confidence:'Original alpha unknown',
 source:{path:'DATA.MK3',offset:1782,length:6,sha256:'a'.repeat(64)},
 width:3,height:2,rgba:got.grayscaleRgba,filename:'p80-synthetic.png',
 metadata:{indices:got.baseIndices,sourceAdjacentRgb8Candidate:got.candidateRgb8,
  palette:'UNKNOWN',previewOpaqueForDisplayOnly:true,originalOpacityVerified:false,
  nativePaletteOwnershipVerified:false,continuationFramesDecoded:false},
};
const zip=parseAnimationStoreZip(indexedAssetZip(fake).bytes);
assert.equal(zip.size,4,'base PNG, original indexed positions, comparison candidate, manifest');
assert.deepEqual(zip.get([...zip.keys()].find(x=>x.endsWith('_indices.bin'))).bytes,got.baseIndices);
assert.deepEqual(zip.get([...zip.keys()].find(x=>x.endsWith('_sourceAdjacentRgb8Candidate.bin'))).bytes,got.candidateRgb8);
assert.equal([...zip.keys()].filter(x=>x.endsWith('_mask.bin')).length,0,
 'NEVER INVENT original opacity/alpha mask');
const manifest=JSON.parse(new TextDecoder().decode(zip.get('manifest.json').bytes));
assert.equal(manifest.selectionOrder[0].metadata.palette,'UNKNOWN');
assert.equal(manifest.selectionOrder[0].metadata.originalOpacityVerified,false);
assert.equal(manifest.selectionOrder[0].metadata.continuationFramesDecoded,false);
positive++;
function refuse(label,s,regex=/P80 MK3 original leading interval/){
 assert.throws(()=>decodeMK3P80LeadingSpan(new Uint8Array(s),1000),regex,label);
 rejections++;
}
refuse('truncated header',source.subarray(0,781));
refuse('truncated last record',source.subarray(0,source.length-1));
refuse('trailing undecoded byte',Buffer.concat([source,Buffer.from([1])]));
for(const [where,bad] of [[0,0],[2,0],[4,0],[774,4],[778,5],[782+6,0]]){
 const s=Buffer.from(source);s[where]=bad;
 refuse('corrupt base or tag at '+where,s);
}
let bad=Buffer.from(source);bad.writeUInt32LE(99,782+6+10);
refuse('out-of-bounds payload size',bad);
bad=Buffer.from(source);bad.writeUInt32LE(1,source.length-14+2);
refuse('empty record with misleading auxiliary fields',bad);
bad=Buffer.from(source);bad.writeUInt16LE(5,source.length-14);
refuse('wrong second record tag',bad);
const controller=new AbortController();controller.abort();
assert.throws(()=>decodeMK3P80LeadingSpan(new Uint8Array(source),1000,controller.signal));rejections++;
assert.throws(()=>decodeMK3P80LeadingSpan(new Uint8Array(source),-1));rejections++;
assert.equal(MK3_P80_SOURCE_OFFSET,667866);assert.equal(MK3_P80_SOURCE_LENGTH,1840634);
assert.equal(MK3_P80_SOURCE_RECORDS,216);assert.match(MK3_P80_RAW_GROUP,/raw continuations/);
(async()=>{
 await assert.rejects(recoverMK3P80LeadingAssets({
  listRecursive:async()=>[],readSlice:async()=>new Uint8Array()
 },[]),/9,402-item/);
 rejections++;
 const ui=fs.readFileSync(require.resolve('../src/components/AssetBrowser.tsx'),'utf8');
 assert.match(ui,/Show leading base image \+ 216 raw records/);
 assert.match(ui,/collection\.assets\.length === 9402/);
 assert.match(ui,/p80OriginalLeadingSource/);
 assert.match(ui,/leadingAbort\.current\?\.abort\(\)/);
 assert.match(ui,/MK3_P80_RAW_GROUP/);
 positive++;
 console.log(JSON.stringify({pass:'P80_SOURCE',status:'PASS',
  sourceOnlyPositiveControls:positive,malformedOrFalseEvidenceRejected:rejections,
  userOptInRequired:true,originalSourceGameDataUsed:false,
  originalOpaqueAlphaProven:false,nativePaletteVerified:false,
  actualContinuationFramesDecoded:0,existingP78AssetsReplaced:false},null,2));
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
