#!/usr/bin/env node
/** P78 ORIGINAL DOS integration: 197 source-chained images vs independent P77.
 *
 * node scripts/verify-mk3-p78-original.cjs <original DOS MK3 directory>
 * Creates private P75/P77 source archives in the OS temp directory, independently
 * verifies original 216-record source/PNG evidence, scans actual MK3 source,
 * accepts P76 first 19 opt-in assets, then compares all 197 P78 indexed assets
 * and their exact stored ZIP sidecars to original independent source hashes.
 * This is original-integrated SOURCE verification, NOT real Chrome acceptance.
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
const {recoverMK3P76RowMappedAssets}=
 require('../src/core/assets/mk3NonIffRowMappedP76.ts');
const {recoverMK3P78AdditionalChainedAssets,MK3_P78_SOURCE_CHAIN_FORMAT}=
 require('../src/core/assets/mk3ChainedSourceImagesP78.ts');
const {indexedAssetZip}=require('../src/core/assets/export.ts');
const {parseAnimationStoreZip}=
 require('../src/games/mk1/research/browserAnimationExportBundleValidation.ts');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function python(args){
 const result=spawnSync(process.env.PYTHON||'python',args,{encoding:'utf8',
   cwd:path.resolve(__dirname,'..'),timeout:900000,maxBuffer:16*1024*1024,windowsHide:true});
 if(result.error||result.status!==0)throw Error('P78 original Python evidence FAILED: '+
  [result.error?.message,result.stderr,result.stdout].filter(Boolean).join('\n'));
 return result.stdout.trim();
}
function originalMemory(folder){
 const source=new MemoryDirectorySource('P78 original MK3'),files=[];
 function visit(here,relative=''){
  for(const e of fs.readdirSync(here,{withFileTypes:true})){
   const next=path.join(here,e.name),rel=relative?relative+'/'+e.name:e.name;
   if(e.isDirectory())visit(next,rel);
   else if(e.isFile()&&/\.(FTR|ASG|MK3|CUE|OGG)$/i.test(e.name)){
    source.setFile(rel,new Uint8Array(fs.readFileSync(next)));files.push(rel);
   }
  }
 }
 visit(folder);
 return {source,files};
}
async function main(){
 assert.equal(process.argv.length,3,'original MK3 game directory is required');
 const dir=fs.realpathSync(process.argv[2]);
 assert(fs.statSync(dir).isDirectory());
 const scratch=fs.mkdtempSync(path.join(os.tmpdir(),'mkdos-p78-original-'));
 try{
  const p75Zip=path.join(scratch,'original-P75-private.zip');
  const p77Zip=path.join(scratch,'original-P77-private.zip');
  const p75=JSON.parse(python([path.join(__dirname,'mk3_p75_noniff_row_tables.py'),dir,p75Zip]));
  assert.equal(p75.status,'PASS');
  const p77=JSON.parse(python([path.join(__dirname,'mk3_p77_chained_source_export.py'),dir,p77Zip]));
  assert.equal(p77.status,'PASS');assert.equal(p77.sourceIndexedRecords,216);
  const independent=JSON.parse(python([
   path.join(__dirname,'verify_mk3_p77_chained_source_independent.py'),dir,p77Zip,p75Zip]));
  assert.equal(independent.status,'PASS');
  assert.equal(independent.sourceImagesCheckedPixelByPixel,432);
  const originalManifest=JSON.parse(python(['-c',
   'import json,sys,zipfile; print(json.dumps(json.loads(zipfile.ZipFile(sys.argv[1]).read("manifest.json"))))',
   p77Zip]));
  const {source,files}=originalMemory(dir);
  const baseline=await scanMK3(source,()=>{});
  assert.equal(baseline.assets.length,9186,'original accepted MK3 baseline');
  const originalIds=baseline.assets.map(a=>a.id);
  const first=await recoverMK3P76RowMappedAssets(source,baseline.assets);
  assert.equal(first.assets.length,19);assert.equal(first.report.newCatalogueAssets,9205);
  const p76=[...baseline.assets,...first.assets];
  const preservedIds=p76.map(a=>a.id);
  const additional=await recoverMK3P78AdditionalChainedAssets(source,p76);
  assert.equal(additional.assets.length,197);
  assert.equal(additional.report.visibleAfterExplicitOptIn,9402);
  assert.deepEqual(baseline.assets.map(a=>a.id),originalIds);
  assert.deepEqual(p76.map(a=>a.id),preservedIds,'P76 first images must not mutate');
  const originalRecords=originalManifest.records.filter(r=>r.sourceRecordOrdinalWithinRegion>0);
  assert.equal(originalRecords.length,197);
  const sourcePlaneNames={
   sourceCompressedFirstStream:'firstStream',
   sourceRowXTable:'rowXTable',
   sourceRowPointerTable:'rowPointerTable',
   sourceAdjacentUnlabeledRgb8:'sourceAdjacentRgb8Candidate',
   sourceMappedIndices:'indices',
   sourceMappedOpacityMask:'mask',
  };
  let indexPositions=0,painted=0,missing=0,sidecars=0;
  for(let i=0;i<197;i++){
   const a=additional.assets[i],record=originalRecords[i];
   assert.equal(a.source.offset,record.recordOffset);
   assert.equal(a.source.length,record.recordLength);
   assert.equal(a.width,record.width);
   assert.equal(a.height,record.height);
   assert.equal(a.metadata.originalNonIffRegionOrdinal,record.nonIffRegionOrdinal);
   assert.equal(a.metadata.sourceRecordOrdinalWithinRegion,record.sourceRecordOrdinalWithinRegion);
   assert.equal(a.metadata.sourceRecordFormat,MK3_P78_SOURCE_CHAIN_FORMAT);
   assert.equal(a.metadata.sourceAbsentRows,record.sourceMinusOneRows);
   assert.equal(a.metadata.sourcePaintedPixels,record.sourcePaintedPixels);
   assert.equal(a.metadata.sourceRecordEndOffset,record.sourceNextRecordOffset);
   assert.equal(a.metadata.palette,'UNKNOWN');
   assert.equal(a.metadata.paletteRgb,undefined);
   assert.equal(a.metadata.nativePaletteOwnershipVerified,false);
   assert.equal(a.metadata.originalRendererPlacementVerified,false);
   assert.equal(a.metadata.originalStageOrAnimationMembershipVerified,false);
   assert.equal(a.metadata.sourceRecordOrderIsNotNativeAnimationOrder,true);
   const zip=parseAnimationStoreZip(indexedAssetZip(a).bytes);
   assert.equal(zip.size,8,'one PNG + six original evidence bytes + manifest');
   for(const [key,field] of Object.entries(sourcePlaneNames)){
    const plane=a.metadata[field],expected=record.outputs[key];
    assert(plane instanceof Uint8Array,'source plane missing: '+field);
    assert.equal(plane.length,expected.length);
    assert.equal(sha(plane),expected.sha256,'original P77 source mismatch: '+key);
    const names=[...zip.keys()].filter(n=>n.endsWith('_'+field+'.bin'));
    assert.equal(names.length,1,'missing or duplicate ZIP source plane: '+field);
    assert.deepEqual(zip.get(names[0]).bytes,plane);
    sidecars++;
   }
   const selected=JSON.parse(new TextDecoder().decode(zip.get('manifest.json').bytes));
   assert.equal(selected.selectionOrder[0].metadata.palette,'UNKNOWN');
   assert.equal(selected.selectionOrder[0].metadata.nativePaletteOwnershipVerified,false);
   assert.equal(selected.selectionOrder[0].source.offset,record.recordOffset);
   indexPositions+=a.width*a.height;
   painted+=a.metadata.sourcePaintedPixels;
   missing+=a.metadata.sourceAbsentRows;
  }
  assert.equal(indexPositions,6616595);
  assert.equal(painted,1167687);
  assert.equal(missing,8475);
  assert.equal(sidecars,1182);
  assert.equal(additional.report.originalP75PostTableBytesConsumed,1611110);
  assert.equal(additional.report.originalFirstNonIffBytesStillUnresolved,1840634);
  console.log(JSON.stringify({
   pass:'P78_ORIGINAL',status:'PASS',game:'mk3',
   originalSourceSha256:p77.originalSourceSha256,
   originalGameFilesLoaded:files.length,
   baselineAssets:9186,acceptedP76FirstImages:19,
   additionalSourceIndexedImages:197,visibleAfterExplicitOptIn:9402,
   additionalIndexedPositionsPerPlane:indexPositions,
   additionalPaintedOriginalPixels:painted,
   additionalSourceAbsentRows:missing,
   exactOriginalSidecarHashesAndZIPsChecked:sidecars,
   independentOriginalSourceAnd432PngOraclePass:true,
   p76OriginalAssetIDsUnchanged:true,
   nativePaletteOrAnimationOrStageMembershipClaimed:false,
   originalChromeBrowserVerified:false,
  },null,2));
 }finally{fs.rmSync(scratch,{recursive:true,force:true});}
}
main().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
