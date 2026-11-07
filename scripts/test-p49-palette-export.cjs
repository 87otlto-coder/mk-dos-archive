#!/usr/bin/env node
const fs=require('node:fs'),assert=require('node:assert/strict'),ts=require('typescript');
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{fileName:f,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,f);
const {indexedAssetZip,selectedZip}=require('../src/core/assets/export.ts');
const {parseAnimationStoreZip}=require('../src/games/mk1/research/browserAnimationExportBundleValidation.ts');

const palette=new Uint8Array([0,0,0,12,34,56]);
const a={id:'dummy',name:'Dummy',kind:'image',group:'test',format:'IFF',confidence:'dummy',source:{path:'dummy',offset:0,length:2},
 metadata:{indices:new Uint8Array([0,1]),paletteRgb:palette,paletteFormat:'IFF_CMAP_RGB8',paletteRuntimeOwnershipKnown:false},
 width:2,height:1,bytes:new Uint8Array([0,1]),filename:'dummy.bin'};
const zip=indexedAssetZip(a),entries=parseAnimationStoreZip(zip.bytes);
assert.deepStrictEqual(Buffer.from(entries.get('indexed/00000_paletteRgb.bin').bytes),Buffer.from(palette));
let rejected=0;
for(const patch of [{paletteRgb:[0,0,0]},{paletteRgb:new Uint8Array(2)},{paletteRgb:new Uint8Array(771)},{paletteRgb:new Uint8Array(3)},{paletteFormat:'UNKNOWN'}]){
 assert.throws(()=>indexedAssetZip({...a,metadata:{...a.metadata,...patch}}),/invalid embedded palette/);rejected++;
}
console.log(JSON.stringify({status:'PASS',invalidPalettesRejected:rejected,exactCmapSidecar:true,runtimeOwnershipNotPromoted:true,dummyDataOnly:true},null,2));
