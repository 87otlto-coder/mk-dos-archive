#!/usr/bin/env node
/** P69 original MK3 fighter indexed bundle — source-only positive and refusal checks. */
const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict'),ts=require('typescript');
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(m,p)=>m._compile(
 ts.transpileModule(fs.readFileSync(p,'utf8'),{fileName:p,
 compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,p);
if(!globalThis.crypto)globalThis.crypto=crypto.webcrypto;
const {buildMK3FighterIndexedBundleP69,MK3_P69_FORMAT}=
 require('../src/core/assets/mk3FighterIndexedBundleP69.ts');
const {parseAnimationStoreZip}=
 require('../src/games/mk1/research/browserAnimationExportBundleValidation.ts');
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
function mkFrame(path,header,index,offset,indices,mask){
 const sourceSha='f'.repeat(64),name=path.split('/').at(-1),key='FHDS'+index;
 return {id:path+':'+key+':'+index,name:name+' / '+key+' / '+index,
   group:name+' · '+key,kind:'sprite',format:'Indexed sprite',
   confidence:'Decoded; palette unresolved',filename:name+'_'+index+'_index-preview.png',
   source:{path,offset,length:16,sha256:sourceSha},width:2,height:2,
   metadata:{headerOffset:header,descriptorIndex:index,descriptorX:index,
     descriptorY:-1,mode:0,group:1,model:0,expandedSize:12,bitDepth:5,
     indices:new Uint8Array(indices),mask:new Uint8Array(mask),
     palette:'UNKNOWN',visualization:'GRAYSCALE_INDEX_MAP'}};
}
function source(){
 const a=mkFrame('BLADE.FTR',48,1,500,[0,2,3,4],[0,1,1,1]);
 const b=mkFrame('BLADE.FTR',12,0,300,[4,3,2,1],[1,1,1,0]);
 const c=mkFrame('other/JADE.FTR',80,0,100,[1,2,3,4],[1,0,1,0]);
 return [a,b,c];
}
async function expectRefusal(label,mutate,pattern){
 const data=source();let name='BLADE.FTR';
 const n=mutate(data);if(typeof n==='string')name=n;
 await assert.rejects(buildMK3FighterIndexedBundleP69(data,name),pattern,label);
}
(async()=>{
 const original=source();
 const p=await buildMK3FighterIndexedBundleP69(original,'BLADE.FTR');
 assert.equal(p.report.status,'VERIFIED');
 assert.equal(p.report.frames,2);
 assert.equal(p.report.originalIndexedPlanesPreserved,true);
 assert.equal(p.report.runtimeAnimationOrPaletteClaimed,false);
 assert.equal(p.name,'MK3_P69_BLADE_ORIGINAL_INDEXED_SPRITES.zip');
 const z=parseAnimationStoreZip(p.bytes);
 assert.equal(z.size,6); // 2*indices/mask + manifest + README
 const m=JSON.parse(new TextDecoder().decode(z.get('manifest.json').bytes));
 assert.equal(m.format,MK3_P69_FORMAT);
 assert.equal(m.spriteCount,2);
 assert.equal(m.originalFtrWholeFileSha256,'f'.repeat(64));
 assert.equal(m.originalDescriptors.length,2);
 assert.deepEqual(m.originalDescriptors.map(x=>x.originalFhdsDescriptorHeaderOffset),[12,48]);
 assert.equal(m.sourceDescriptorOrder,'FHDS_RECORD_ENCOUNTER_ORDER_ONLY');
 assert.equal(m.nativePaletteOwnershipVerified,false);
 assert.equal(m.nativeAnimationSequenceOrderVerified,false);
 assert.equal(m.nativeAnimationTimingVerified,false);
 assert.equal(m.runtimeWorldPlacementOrCompositorOrderVerified,false);
 assert.equal(m.sourceIndexAndMaskBytes,16);
 assert.equal(p.report.indexAndMaskBytes,16);
 for(const [j,record]of m.originalDescriptors.entries()){
  const a=original.find(x=>x.metadata.headerOffset===record.originalFhdsDescriptorHeaderOffset);
  assert(a);
  assert.equal(record.sourceAssetId,a.id);
  assert.equal(record.originalSourceOffset,a.source.offset);
  assert.equal(record.originalCompressedByteLength,a.source.length);
  assert.equal(record.originalDescriptorX,a.metadata.descriptorX);
  assert.equal(record.originalDescriptorY,a.metadata.descriptorY);
  assert.deepStrictEqual(z.get(record.indicesPath).bytes,a.metadata.indices);
  assert.deepStrictEqual(z.get(record.maskPath).bytes,a.metadata.mask);
  assert.equal(record.indicesSha256,digest(a.metadata.indices));
  assert.equal(record.maskSha256,digest(a.metadata.mask));
  assert.equal(record.runtimeAnimationOrderVerified,false);
 }
 // A single independently selected container gets no assets from any other FTR.
 const jade=await buildMK3FighterIndexedBundleP69(original,'other/JADE.FTR');
 assert.equal(jade.report.frames,1);
 assert.equal(parseAnimationStoreZip(jade.bytes).size,4);
 let refusals=0;
 const refuse=async(label,mutate,pattern)=>{await expectRefusal(label,mutate,pattern);refusals++;};
 await refuse('path traversal',()=> '../BLADE.FTR',/invalid original FTR source path/);
 await refuse('wrong extension',()=> 'BLADE.EXE',/invalid original FTR source path/);
 await refuse('no matching source',()=> 'MISSING.FTR',/no original indexed fighter/);
 await refuse('wrong container SHA',a=>{a[0].source.sha256='0'.repeat(64)},/exact original container SHA/);
 await refuse('missing SHA',a=>{delete a[0].source.sha256;delete a[1].source.sha256},/exact original container SHA/);
 await refuse('duplicate ID',a=>{a[1].id=a[0].id},/duplicate source sprite asset ID/);
 await refuse('missing original byte interval',a=>{a[0].source.length=0},/original compressed source byte interval/);
 await refuse('wrong width',a=>{a[0].width=3},/invalid original indexed sprite dimensions|source indexed pixels/);
 await refuse('missing native indices',a=>{delete a[0].metadata.indices},/source indexed pixels/);
 await refuse('missing paint mask',a=>{delete a[0].metadata.mask},/source indexed pixels/);
 await refuse('nonbinary mask',a=>{a[0].metadata.mask[0]=7},/opacity mask must be binary/);
 await refuse('forged palette assignment',a=>{a[0].metadata.palette='VGA_ASSIGNED'},/cannot promote display palette/);
 await refuse('incomplete descriptor',a=>{delete a[0].metadata.mode},/frame descriptor provenance/);
 await refuse('bad source coordinate',a=>{a[0].metadata.descriptorX=Infinity},/original descriptor X\/Y/);
 await refuse('duplicate FHDS key',a=>{a[0].metadata.headerOffset=a[1].metadata.headerOffset;a[0].metadata.descriptorIndex=a[1].metadata.descriptorIndex},/duplicate original FHDS/);
 assert.equal(refusals,15);
 console.log(JSON.stringify({pass:'P69_SOURCE',status:'PASS',negativeCasesRejected:refusals,
   separateOriginalFtrBundles:2,originalIndicesAndMasksByteIdentical:true,
   sourceFrameDescriptorOrderPreserved:true,exportedNativePaletteOrRuntimeOrderClaimed:false,
   sourceOnly:true},null,2));
})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
