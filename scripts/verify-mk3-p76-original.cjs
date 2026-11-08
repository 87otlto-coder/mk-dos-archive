#!/usr/bin/env node
/**
 * P76 ORIGINAL DOS MK3 integrated TypeScript regression, PRIVATE local files.
 * Usage: node scripts/verify-mk3-p76-original.cjs <original-MK3-directory>
 *
 * Runs independent P75 Python original-byte oracle in a temporary PRIVATE
 * folder, scans unmodified MK3 source, opts into P76, verifies the new
 * indexed/mask/row-source bytes against independent source hashes, and
 * checks the selected indexed asset ZIP evidence sidecars.
 */
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const assert=require('node:assert/strict'),crypto=require('node:crypto');
const {spawnSync}=require('node:child_process'),ts=require('typescript');
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(m,p)=>m._compile(
  ts.transpileModule(fs.readFileSync(p,'utf8'),{fileName:p,compilerOptions:{
    module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,p);
if(!globalThis.crypto)globalThis.crypto=crypto.webcrypto;
const {MemoryDirectorySource}=require('../src/core/filesystem/DirectorySource.ts');
const {scanMK3}=require('../src/core/assets/mk3Collection.ts');
const {recoverMK3P76RowMappedAssets,MK3_P76_ROW_MAP_FORMAT}=
  require('../src/core/assets/mk3NonIffRowMappedP76.ts');
const {indexedAssetZip}=require('../src/core/assets/export.ts');
const {parseAnimationStoreZip}=
  require('../src/games/mk1/research/browserAnimationExportBundleValidation.ts');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function python(args){
  const r=spawnSync(process.env.PYTHON||'python',args,{encoding:'utf8',cwd:path.resolve(__dirname,'..'),
    timeout:600000,maxBuffer:16*1024*1024,windowsHide:true});
  if(r.error||r.status!==0)throw Error('P76 independent original Python FAILED: '+
    [r.error?.message,r.stderr,r.stdout].filter(Boolean).join('\n'));
  return r.stdout.trim();
}
function originalMemory(dir){
  const source=new MemoryDirectorySource('P76 private original MK3'),files=[];
  function walk(here,relative=''){
    for(const e of fs.readdirSync(here,{withFileTypes:true})){
      const next=path.join(here,e.name),rel=relative?relative+'/'+e.name:e.name;
      if(e.isDirectory())walk(next,rel);
      else if(e.isFile()&&/\.(FTR|ASG|MK3|CUE|OGG)$/i.test(e.name)){
        source.setFile(rel,new Uint8Array(fs.readFileSync(next)));files.push(rel);
      }
    }
  }
  walk(dir);return {source,files};
}
async function main(){
  assert.equal(process.argv.length,3,'original MK3 directory required');
  const dir=fs.realpathSync(process.argv[2]);
  assert(fs.statSync(dir).isDirectory());
  const scratch=fs.mkdtempSync(path.join(os.tmpdir(),'mkdos-p76-fixture-'));
  try{
    const p75Zip=path.join(scratch,'source-P75-private.zip');
    const p75=JSON.parse(python([path.join(__dirname,'mk3_p75_noniff_row_tables.py'),dir,p75Zip]));
    assert.equal(p75.status,'PASS');
    const independent=JSON.parse(python([path.join(__dirname,
      'verify_mk3_p75_noniff_independent.py'),dir,p75Zip]));
    assert.equal(independent.status,'PASS');
    assert.equal(independent.rowMappedCanvases,19);
    const oracle=JSON.parse(python(['-c',
      'import json,sys,zipfile; print(json.dumps(json.loads(zipfile.ZipFile(sys.argv[1]).read("manifest.json"))))',
      p75Zip]));
    const memory=originalMemory(dir);
    const baseline=await scanMK3(memory.source,()=>{});
    assert.equal(baseline.assets.length,9186,'P71 MK3 9,186-asset baseline');
    const ids=baseline.assets.map(a=>a.id);
    const result=await recoverMK3P76RowMappedAssets(memory.source,baseline.assets);
    assert.equal(result.assets.length,19);
    assert.equal(result.report.newCatalogueAssets,9205);
    assert.deepEqual(baseline.assets.map(a=>a.id),ids,'P76 must preserve baseline IDs/objects');
    const lookup={
      sourceMappedIndices:'indices',
      sourceMappedOpacityMask:'mask',
      firstCompressedStream:'firstStream',
      sourceRowXTable:'rowXTable',
      sourceRowOffsetTable:'rowPointerTable',
      adjacentUnlabeledRgb8Candidate:'sourceAdjacentRgb8Candidate',
    };
    let pixels=0,painted=0;
    for(let i=0;i<19;i++){
      const asset=result.assets[i],original=oracle.records[i];
      assert.equal(asset.source.offset,original.regionOffset);
      assert.equal(asset.source.length,original.regionLength);
      assert.equal(asset.metadata.sourceRowMapFormat,MK3_P76_ROW_MAP_FORMAT);
      assert.equal(asset.metadata.originalNonIffRegionOrdinal,i+1);
      assert.equal(asset.metadata.sourceAbsentRows,original.sourceMinusOneRowsWithoutPackedData);
      assert.equal(asset.metadata.sourceUnparsedRemainderBytes,original.sourceAfterRowTablesLength);
      assert.equal(asset.metadata.palette,'UNKNOWN');
      assert.equal(asset.metadata.paletteRgb,undefined);
      assert.equal(asset.metadata.nativePaletteOwnershipVerified,false);
      assert.equal(asset.metadata.originalRendererPlacementVerified,false);
      const zip=parseAnimationStoreZip(indexedAssetZip(asset).bytes);
      for(const [name,field] of Object.entries(lookup)){
        const bytes=asset.metadata[field],truth=original.outputs[name];
        assert(bytes instanceof Uint8Array);
        assert.equal(bytes.length,truth.length);
        assert.equal(sha(bytes),truth.sha256,'independent original bytes: '+name);
        const entry=[...zip.keys()].find(n=>n.endsWith('_'+field+'.bin'));
        assert(entry,'indexed ZIP missing '+field);
        assert.deepEqual(zip.get(entry).bytes,bytes);
      }
      const metadata=JSON.parse(new TextDecoder().decode(zip.get('manifest.json').bytes));
      assert.equal(metadata.selectionOrder[0].metadata.palette,'UNKNOWN');
      pixels+=asset.width*asset.height;
      painted+=asset.metadata.sourcePaintedPixels;
    }
    assert.equal(pixels,2050843);
    assert.equal(painted,996697);
    assert.equal(result.report.unexplainedBytesAfterRowTables,1611110);
    console.log(JSON.stringify({
      pass:'P76_ORIGINAL',status:'PASS',
      sourceSha256:oracle.originalSourceWholeSha256,
      originalBaselineAssets:baseline.assets.length,
      recoveredOptInIndexedImages:result.assets.length,
      newVisibleAssetCount:result.report.newCatalogueAssets,
      indexedPositionsPerPlane:pixels,paintedPixels:painted,
      independentOriginalP75Oracle:true,
      originalIndexedMaskRowAndStreamHashesMatched:true,
      indexedZIPSourceEvidenceParity:true,
      paletteAndOriginalRendererOwnershipClaimed:false,
      chromeBrowserWorkflowVerified:false,
    },null,2));
  }finally{fs.rmSync(scratch,{force:true,recursive:true});}
}
main().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
