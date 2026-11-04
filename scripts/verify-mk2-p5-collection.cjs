#!/usr/bin/env node
// Headless P1+P5 integration smoke. P2-P4 are interim source changes absent from P1.
// Usage: node scripts/verify-mk2-p5-collection.cjs /path/to/mk2 [output-selected.zip]
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),ts=require('typescript');
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(module,file)=>{
 const compiled=ts.transpileModule(fs.readFileSync(file,'utf8'),{fileName:file,
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true,allowImportingTsExtensions:true}}).outputText;
 module._compile(compiled,file);
};
const game=process.argv[2];if(!game)throw Error('Provide MK2 directory path');
const root=path.resolve(__dirname,'..');
const source={directoryName:'mk2',isSynthetic:false,
 async listRecursive(){const files=[];function scan(dir,relative=''){
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
   const full=path.join(dir,entry.name),rel=relative?relative+'/'+entry.name:entry.name;
   if(entry.isDirectory())scan(full,rel);else if(entry.isFile())files.push({path:rel,name:entry.name,extension:entry.name.split('.').at(-1).toUpperCase(),size:fs.statSync(full).size});
  }
 }scan(game);return files;},
 async readSlice(file,start,length){const fd=fs.openSync(path.join(game,file),'r');try{const bytes=Buffer.alloc(length);const n=fs.readSync(fd,bytes,0,length,start);return new Uint8Array(bytes.subarray(0,n));}finally{fs.closeSync(fd);}}
};
(async()=>{
 const {scanAssets}=require(path.join(root,'src/core/assets/collection.ts'));
 const {selectedZip}=require(path.join(root,'src/core/assets/export.ts'));
 const result=await scanAssets(source,'mk2',()=>{});
 const p5=result.assets.filter(x=>x.id.startsWith('mk2-floor:'));
 assert.equal(result.assets.length,4958,'P1+P5 baseline (does not include P2-P4)');
 assert.equal(p5.length,8);assert.equal(new Set(result.assets.map(x=>x.id)).size,4958);
 assert.equal(result.assets.filter(x=>x.id.startsWith('u8:')).length,312);
 assert.equal(result.reports.p5SourceFloors.length,4);
 assert(result.reports.p5SourceFloors.every(x=>x.status==='VERIFIED'));
 const sound=result.assets.find(x=>x.id.startsWith('u8:'));assert(sound);
 const zip=selectedZip([...p5,sound]);if(process.argv[3])fs.writeFileSync(process.argv[3],Buffer.from(zip));
 console.log(JSON.stringify({pass:'P5',status:'PASS',baseline:'P1+P5 only (P2-P4 interim source not included)',scannedAssets:result.assets.length,newFloors:p5.length,qualifiedSounds:312,uniqueAssetIds:true,selectedExportCount:9,selectedZipBytes:zip.length,sourceResults:result.reports.p5SourceFloors},null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
