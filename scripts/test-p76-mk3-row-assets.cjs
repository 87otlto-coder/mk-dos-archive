#!/usr/bin/env node
/** P76 synthetic fail-closed row-map controls; no copyrighted original files. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const ts=require('typescript');
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(m,f)=>m._compile(
 ts.transpileModule(fs.readFileSync(f,'utf8'),{fileName:f,
 compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
if(!globalThis.crypto)globalThis.crypto=crypto.webcrypto;
const {decodeMK3P76SourceRowRegion,recoverMK3P76RowMappedAssets,
 MK3_P76_ROW_MAP_FORMAT,MK3_P76_RECOVERED_COUNT}=
 require('../src/core/assets/mk3NonIffRowMappedP76.ts');
const {MemoryDirectorySource}=
 require('../src/core/filesystem/DirectorySource.ts');
const {selectedZip,indexedAssetZip}=
 require('../src/core/assets/export.ts');
const {parseAnimationStoreZip}=
 require('../src/games/mk1/research/browserAnimationExportBundleValidation.ts');
function s16(n){const b=Buffer.alloc(2);b.writeInt16LE(n);return b;}
function make(opts={}){
 const width=opts.width??10, height=opts.height??3;
 const first=opts.first??Buffer.concat([s16(3),Buffer.from([4,5,6]),s16(0)]);
 const last=opts.last??Buffer.concat([s16(2),Buffer.from([7,8]),s16(0)]);
 const tail=opts.tail??Buffer.from([0xa4]);
 const stream=Buffer.concat([first,last,tail]);
 const header=Buffer.alloc(24);
 header.writeUInt16LE(width,0);header.writeUInt16LE(height,2);
 header.writeUInt32LE(opts.declaredLength??stream.length,20);
 const xs=opts.xs??[2,-1,6],offsets=opts.offsets??[0,0,first.length];
 const xBytes=Buffer.alloc(height*4),pointerBytes=Buffer.alloc(height*4);
 for(let i=0;i<height;i++){xBytes.writeInt32LE(xs[i],i*4);pointerBytes.writeUInt32LE(offsets[i],i*4);}
 return new Uint8Array(Buffer.concat([header,Buffer.alloc(768),stream,xBytes,pointerBytes,Buffer.from('REMAINDER')]));
}
(async()=>{
 let positive=0,refusals=0;
 const raw=make(),q=decodeMK3P76SourceRowRegion(raw,0,raw.length);
 assert.equal(MK3_P76_RECOVERED_COUNT,19);
 assert.equal(q.width,10);assert.equal(q.height,3);
 assert.equal(q.packedRows,2);assert.equal(q.absentRows,1);
 assert.equal(q.paintedPixels,5);assert.equal(q.unexplainedFinalByteHex,'a4');
 assert.deepEqual(Array.from(q.indices.slice(2,5)),[4,5,6]);
 assert.deepEqual(Array.from(q.indices.slice(10,20)),Array(10).fill(0));
 assert.deepEqual(Array.from(q.indices.slice(26,28)),[7,8]);
 assert.deepEqual(Array.from(q.mask.slice(2,5)),[1,1,1]);
 assert.equal(q.mask.slice(10,20).every(v=>v===0),true);
 assert.deepEqual(Array.from(q.mask.slice(26,28)),[1,1]);
 assert.equal(q.afterTablesLength,9);
 assert.equal(q.firstStream.length,raw.length-(24+768+3*8+9));
 assert.deepEqual(q.firstStream,raw.slice(792,792+q.firstStreamLength));
 assert.deepEqual(q.rowXTable,raw.slice(q.rowXTableOffset,q.rowPointerTableOffset));
 assert.deepEqual(q.rowPointerTable,raw.slice(q.rowPointerTableOffset,q.afterTablesOffset));
 assert.equal(q.rgba[4*(10+2)+3],0,'absent row stays transparent');
 assert.equal(q.rgba[4*2+3],255,'source positive index is opaque');
 assert.equal(q.rgba[4*2],32+Math.round(4*223/255));
 positive++;
 const originalFile=fs.readFileSync(require.resolve('../src/core/assets/mk3Collection.ts'),'utf8');
 assert.doesNotMatch(originalFile,/mk3NonIffRowMappedP76/,'legacy scanner must not add P76 assets');
 const browserFile=fs.readFileSync(require.resolve('../src/components/AssetBrowser.tsx'),'utf8');
 assert.match(browserFile,/Show 19 recovered indexed graphics/);
 assert.match(browserFile,/source\.directoryName/);
 positive++;
 const sha='a'.repeat(64);
 const asset={id:'DATA.MK3:p76:row-mapped:01:1024',name:'P76 synthetic indexed',
   group:'DATA.MK3 · recovered indexed (P76)',kind:'image',format:'Source-row-mapped indexed RLE',
   confidence:'Synthetic test; palette UNKNOWN',
   source:{path:'DATA.MK3',offset:1024,length:raw.length,sha256:sha},
   filename:'test.png',width:10,height:3,rgba:q.rgba,
   metadata:{indices:q.indices,mask:q.mask,firstStream:q.firstStream,
     rowXTable:q.rowXTable,rowPointerTable:q.rowPointerTable,
     sourceAdjacentRgb8Candidate:q.rgb8Candidate,
     palette:'UNKNOWN',visualization:'GRAYSCALE_INDEX_MAP',
     sourceRowMapFormat:MK3_P76_ROW_MAP_FORMAT,
     nativePaletteOwnershipVerified:false}};
 const archive=indexedAssetZip(asset);
 const parts=parseAnimationStoreZip(archive.bytes);
 for(const [field,expected] of [
   ['indices',q.indices],['mask',q.mask],['firstStream',q.firstStream],
   ['rowXTable',q.rowXTable],['rowPointerTable',q.rowPointerTable],
   ['sourceAdjacentRgb8Candidate',q.rgb8Candidate]
 ]){
   const paths=[...parts.keys()].filter(n=>n.endsWith('_'+field+'.bin'));
   assert.equal(paths.length,1,field+' sidecar must be unique');
   assert.deepEqual(parts.get(paths[0]).bytes,expected);
 }
 const manifest=JSON.parse(new TextDecoder().decode(parts.get('manifest.json').bytes));
 assert.equal(manifest.selectionOrder[0].metadata.palette,'UNKNOWN');
 assert.equal(manifest.selectionOrder[0].metadata.nativePaletteOwnershipVerified,false);
 assert.equal(manifest.selectionOrder[0].metadata.sourceRowMapFormat,MK3_P76_ROW_MAP_FORMAT);
 assert.equal(manifest.selectionOrder[0].metadata.paletteRgb,undefined);
 positive++;
 function reject(label,mutate,pattern){
  const v=make();mutate(v);
  assert.throws(()=>decodeMK3P76SourceRowRegion(v,0,v.length),pattern,label);
  refusals++;
 }
 function at(v){const length=v[20]+v[21]*256+v[22]*65536+v[23]*16777216;
   return {x:792+length,p:792+length+12};}
 reject('zero width',v=>{v[0]=0;v[1]=0;},/dimensions/);
 reject('bad compressed length',v=>{new DataView(v.buffer).setUint32(20,v.length,true);},/exceed original region/);
 reject('unsupported row X negative sentinel',v=>{const t=at(v);new DataView(v.buffer).setInt32(t.x+4,-2,true);},/row X/);
 reject('absent row pointer not zero',v=>{const t=at(v);new DataView(v.buffer).setUint32(t.p+4,1,true);},/absent source row/);
 reject('first active row pointer not zero',v=>{const t=at(v);new DataView(v.buffer).setUint32(t.p,1,true);},/first active/);
 reject('duplicate active pointer',v=>{const t=at(v);new DataView(v.buffer).setUint32(t.p+8,0,true);},/strictly increasing/);
 reject('active row pointer outside stream',v=>{const t=at(v);new DataView(v.buffer).setUint32(t.p+8,900,true);},/strictly increasing/);
 reject('row X outside canvas',v=>{const t=at(v);new DataView(v.buffer).setInt32(t.x,11,true);},/row X/);
 reject('run outside row width',v=>{const t=at(v);new DataView(v.buffer).setInt32(t.x,9,true);},/literal run/);
 reject('positive run not bounded by row pointer',v=>{new DataView(v.buffer).setInt16(792,7,true);},/literal run/);
 reject('negative skip outside canvas',v=>{new DataView(v.buffer).setInt16(792,-11,true);},/transparent run/);
 reject('missing terminator',v=>{new DataView(v.buffer).setInt16(792+5,1,true);},/bounded terminator|literal run/);
 const badTail=make({tail:Buffer.from([1,2])});
 assert.throws(()=>decodeMK3P76SourceRowRegion(badTail,0,badTail.length),/trailing bytes/);
 refusals++;
 assert.throws(()=>decodeMK3P76SourceRowRegion(raw,raw.length+1,1),/region extent/);
 refusals++;
 const memory=new MemoryDirectorySource('synthetic');
 await assert.rejects(recoverMK3P76RowMappedAssets(memory,[]),/9,186-asset/);
 refusals++;
 const baseline=Array.from({length:9186},(_,i)=>({
  id:'placeholder-'+i,name:'placeholder',kind:'raw',
  source:{path:'INVALID.MK3',offset:0,length:1,sha256:sha},
  metadata:{},filename:'placeholder.bin'
 }));
 await assert.rejects(recoverMK3P76RowMappedAssets(memory,baseline),/9,186-asset/);
 refusals++;
 assert.equal(selectedZip([asset]).length>q.indices.length,true);
 console.log(JSON.stringify({pass:'P76_SOURCE',status:'PASS',
   positiveSourceIndexAndIndexedZipControls:positive,
   rejectedMalformedSourceAndFalseProvenanceCases:refusals,
   nativePaletteOwnershipClaimed:false,baselineCatalogueAutoModified:false,
   originalCommercialGameDataUsed:false},null,2));
})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
