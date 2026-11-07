#!/usr/bin/env node
const fs=require('node:fs'),assert=require('node:assert/strict'),ts=require('typescript');
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{fileName:f,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,f);
const {indexedAssetZip,selectedZip}=require('../src/core/assets/export.ts');
const {parseAnimationStoreZip}=require('../src/games/mk1/research/browserAnimationExportBundleValidation.ts');
const asset={id:'dummy',name:'Dummy plane',kind:'image',group:'Test',format:'index8',confidence:'Dummy only',
 source:{path:'dummy',offset:0,length:2},metadata:{indices:new Uint8Array([3,7]),runtimePaletteKnown:false},
 width:2,height:1,bytes:new Uint8Array([3,7]),filename:'../dummy.bin'};
const plain=indexedAssetZip(asset);assert.deepStrictEqual(plain.bytes,selectedZip([asset]));assert.ok(!plain.filename.includes('/'));
const entries=parseAnimationStoreZip(plain.bytes);assert.ok(entries.has('indexed/00000_indices.bin'));assert.ok(!entries.has('indexed/00000_mask.bin'));assert.ok(!entries.has('indexed/00000_paletteKnownMask.bin'));
const malformed=[
 {...asset,metadata:{}},{...asset,width:0},{...asset,width:1.5},{...asset,height:undefined},
 {...asset,metadata:{...asset.metadata,indices:new Uint8Array(1)}},
 {...asset,metadata:{...asset.metadata,mask:new Uint8Array(1)}},
 {...asset,metadata:{...asset.metadata,paletteKnownMask:[0,0]}},
];
for(const a of malformed)assert.throws(()=>indexedAssetZip(a),/Indexed export/);
const complete={...asset,metadata:{...asset.metadata,mask:new Uint8Array([1,0]),paletteKnownMask:new Uint8Array([0,0])}};
assert.deepStrictEqual(indexedAssetZip(complete).bytes,selectedZip([complete]));
console.log(JSON.stringify({status:'PASS',invalidPlanesRejected:malformed.length,missingMasksNotInvented:true,legacyArchiveByteParity:true,dummyDataOnly:true},null,2));

