#!/usr/bin/env node
/** P80 original MK3 full scanner and opt-in index/raw source acceptance.
 * node scripts/verify-mk3-p80-original.cjs <original DOS MK3 directory>
 * Actual original full scanner, not a browser test. Original-only archive
 * stays private in an OS temp directory and is deleted after readback.
 */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const os=require('node:os'),crypto=require('node:crypto'),ts=require('typescript');
const {spawnSync}=require('node:child_process');
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(m,p)=>m._compile(
 ts.transpileModule(fs.readFileSync(p,'utf8'),{fileName:p,
 compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,p);
if(!globalThis.crypto)globalThis.crypto=crypto.webcrypto;
const {MemoryDirectorySource}=require('../src/core/filesystem/DirectorySource.ts');
const {scanMK3}=require('../src/core/assets/mk3Collection.ts');
const {recoverMK3P76RowMappedAssets}=require('../src/core/assets/mk3NonIffRowMappedP76.ts');
const {recoverMK3P78AdditionalChainedAssets}=require('../src/core/assets/mk3ChainedSourceImagesP78.ts');
const {recoverMK3P80LeadingAssets,MK3_P80_BASE_GROUP,MK3_P80_RAW_GROUP}=
 require('../src/core/assets/mk3LeadingSpanP80.ts');
const {indexedAssetZip,assetBytes}=require('../src/core/assets/export.ts');
const {parseAnimationStoreZip}=
 require('../src/games/mk1/research/browserAnimationExportBundleValidation.ts');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function runPython(args){
 const r=spawnSync(process.env.PYTHON||'python',args,
  {encoding:'utf8',cwd:path.join(__dirname,'..'),timeout:900000,
   maxBuffer:8*1024*1024,windowsHide:true});
 if(r.error||r.status!==0) throw Error('Original independent P79 Python FAILED: '+
  [r.error?.message,r.stderr,r.stdout].filter(Boolean).join('\n'));
 return JSON.parse(r.stdout.trim());
}
function originalMemory(folder){
 const src=new MemoryDirectorySource('P80 original MK3'),files=[];
 function walk(here,rel=''){
  for(const x of fs.readdirSync(here,{withFileTypes:true})){
   const p=path.join(here,x.name),r=rel?rel+'/'+x.name:x.name;
   if(x.isDirectory())walk(p,r);
   else if(x.isFile()&&/\.(FTR|ASG|MK3|CUE|OGG)$/i.test(x.name)){
    src.setFile(r,new Uint8Array(fs.readFileSync(p)));
    files.push(r);
   }
  }
 }
 walk(folder);
 return {src,files};
}
async function main(){
 assert.equal(process.argv.length,3,'original DOS MK3 installation folder required');
 const root=fs.realpathSync(process.argv[2]);
 assert(fs.statSync(root).isDirectory());
 const work=fs.mkdtempSync(path.join(os.tmpdir(),'mkdos-p80-original-'));
 try{
  const archive=path.join(work,'p79-private-original.zip');
  const p79=runPython([path.join(__dirname,'mk3_p79_leading_span.py'),root,archive]);
  assert.equal(p79.status,'PASS');
  const independent=runPython([path.join(__dirname,'verify_mk3_p79_leading_span.py'),root,archive]);
  assert.equal(independent.status,'PASS');
  assert.equal(independent.sourceParts,220);
  assert.equal(independent.zipMembers,223);
  assert.equal(independent.pngPixelsCompared,128000);
  const {src,files}=originalMemory(root);
  const original=await scanMK3(src,()=>{});
  assert.equal(original.assets.length,9186,'original accepted MK3 catalogue modified');
  const first=await recoverMK3P76RowMappedAssets(src,original.assets);
  assert.equal(first.assets.length,19);
  const p76=[...original.assets,...first.assets];
  const additional=await recoverMK3P78AdditionalChainedAssets(src,p76);
  assert.equal(additional.assets.length,197);
  const accepted=[...p76,...additional.assets],acceptedIds=accepted.map(a=>a.id);
  assert.equal(accepted.length,9402);
  const p80=await recoverMK3P80LeadingAssets(src,accepted);
  assert.equal(p80.assets.length,217);
  assert.equal(p80.report.newVisibleAssets,9619);
  assert.deepEqual(accepted.map(a=>a.id),acceptedIds,'accepted P78 IDs mutated');
  const dataPath=files.find(x=>x.toUpperCase().endsWith('DATA.MK3'));
  assert(dataPath,'actual original DATA.MK3 missing');
  const data=await src.readSlice(dataPath,0,9015508);
  assert.equal(sha(data),'72905bc96b752bceb0055296e26b904402909f73a1401541c0dd175135a55517');
  const base=p80.assets[0],baseOriginal=data.slice(667866+782,667866+782+64000);
  assert.equal(base.kind,'image');assert.equal(base.group,MK3_P80_BASE_GROUP);
  assert.equal(base.source.offset,667866+782);
  assert.equal(base.source.length,64000);
  assert.equal(base.width,320);assert.equal(base.height,200);
  assert.equal(base.metadata.originalOpacityVerified,false);
  assert.equal(base.metadata.nativePaletteOwnershipVerified,false);
  assert.equal(base.metadata.continuationFramesDecoded,false);
  assert.equal(base.metadata.mask,undefined,'must not invent an original alpha plane');
  assert.equal(sha(base.metadata.indices),sha(baseOriginal));
  assert.equal(sha(base.metadata.indices),'3553eead898a40d15788ef8072634cef04b2047cf7d4055682e7129aa6e7dd2e');
  let previewPixels=0;
  for(let i=0;i<64000;i++){
   const px=i*4,g=32+Math.round(baseOriginal[i]*223/255);
   assert.equal(base.rgba[px],g);assert.equal(base.rgba[px+1],g);
   assert.equal(base.rgba[px+2],g);assert.equal(base.rgba[px+3],255);
   previewPixels++;
  }
  const indexed=parseAnimationStoreZip(indexedAssetZip(base).bytes);
  assert.equal(indexed.size,4,'base image PNG plus index and candidate only');
  const keys=[...indexed.keys()];
  assert.equal(keys.filter(x=>x.endsWith('_indices.bin')).length,1);
  assert.equal(keys.filter(x=>x.endsWith('_mask.bin')).length,0);
  const originalPalette=data.slice(667866+6,667866+774);
  assert.equal(sha(indexed.get(keys.find(x=>x.endsWith('_indices.bin'))).bytes),sha(baseOriginal));
  assert.equal(sha(indexed.get(keys.find(x=>x.endsWith('_sourceAdjacentRgb8Candidate.bin'))).bytes),sha(originalPalette));
  const indexManifest=JSON.parse(new TextDecoder().decode(indexed.get('manifest.json').bytes));
  assert.equal(indexManifest.selectionOrder[0].metadata.originalOpacityVerified,false);
  assert.equal(indexManifest.selectionOrder[0].metadata.nativePaletteOwnershipVerified,false);
  let rawBytes=0,empty=0,position=667866+64782;
  const parts=[];
  for(let i=0;i<216;i++){
   const a=p80.assets[i+1];assert.equal(a.kind,'raw');assert.equal(a.group,MK3_P80_RAW_GROUP);
   assert.equal(a.metadata.originalRecordOrdinal,i);
   assert.equal(a.source.offset,position);
   assert.equal(a.source.length,a.bytes.length);
   assert.equal(a.metadata.originalRecordTag,3);
   assert.equal(a.metadata.originalRecordIsNotDecodedFrame,true);
   assert.equal(a.metadata.nativeAnimationTimingVerified,false);
   assert.equal(a.metadata.nativePaletteOwnershipVerified,false);
   assert.equal(a.metadata.nativeStageMembershipVerified,false);
   const expected=data.slice(position,position+a.bytes.length);
   assert.equal(sha(a.bytes),sha(expected));
   assert.deepEqual(assetBytes(a),a.bytes);
   if(a.metadata.originalPayloadLength===0){
    assert.equal(a.bytes.length,14);assert.equal(a.metadata.originalAuxiliaryFieldA,0);
    assert.equal(a.metadata.originalAuxiliaryFieldB,0);empty++;
    assert(i>=120&&i<=125,'original empty source ordinals changed');
   }
   parts.push(a.bytes);
   position+=a.bytes.length;rawBytes+=a.bytes.length;
  }
  assert.equal(position,2508500,'all source continuation record bytes must tile the original interval');
  assert.equal(empty,6);assert.equal(rawBytes,1772828+216*14);
  assert.equal(p80.report.originalRawLeadingSpanPreserved,true);
  assert.equal(p80.report.continuationFrameDecodingVerified,false);
  assert.equal(p80.report.originalOpaqueAlphaKnown,false);
  console.log(JSON.stringify({pass:'P80_ORIGINAL',status:'PASS',
    originalGame:'mk3',originalDataSha256:sha(data),
    genuineOriginalGameFilesLoaded:files.length,
    acceptedOriginalMk3Baseline:9186,acceptedP76FirstImages:19,
    acceptedP78AdditionalIndexed:197,
    previousOptInTotal:9402,newVisibleAfterExplicitOptIn:9619,
    sourceBaseIndexedPositionsVerified:previewPixels,
    originalSourceBaseIndexSha256:sha(baseOriginal),
    originalRawContinuationRecordsIndividuallyByteVerified:216,
    preservedEmptyRawRecords:empty,
    exactOriginalContinuationBytesVerified:rawBytes,
    independentlyVerifiedP79SourceParts:independent.sourceParts,
    independentlyVerifiedP79PngPixels:independent.pngPixelsCompared,
    acceptedP76P78SourceIdsUnchanged:true,
    originalNativeOpacityOrPaletteAssigned:false,
    originalContinuationFramesDecoded:0,
    realChromeBrowserVerified:false
  },null,2));
 }finally{fs.rmSync(work,{recursive:true,force:true});}
}
main().catch(e=>{console.error(e.stack||e);process.exitCode=1});
