#!/usr/bin/env node
/** P6 real-installation, independent-archive parity and selected export regression.
 * Run: NODE_PATH=/opt/nvm/versions/node/v22.16.0/lib/node_modules node scripts/verify-mk2-p6-cumulative.cjs <MK2 dir> <archive dir> [output dir]
 * archive dir contains P2, P3, P4 previously verified exported ZIPs.
 */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const crypto=require('node:crypto');
let ts;try{ts=require('typescript')}catch{ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript')}
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(module,file)=>{
 const compiled=ts.transpileModule(fs.readFileSync(file,'utf8'),{fileName:file,
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true,allowImportingTsExtensions:true}}).outputText;
 module._compile(compiled,file);
};
if(!globalThis.crypto)globalThis.crypto=crypto.webcrypto;
const game=process.argv[2],ref=process.argv[3],out=process.argv[4];if(!game||!ref)throw Error('Usage: verify-mk2-p6-cumulative.cjs <MK2 dir> <reference-zip-dir> [out-dir]');
const root=path.resolve(__dirname,'..');
const {scanAssets}=require('../src/core/assets/collection.ts');
const {selectedZip}=require('../src/core/assets/export.ts');
const {parseAnimationStoreZip}=require('../src/games/mk1/research/browserAnimationExportBundleValidation.ts');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
let checks=0;
function check(a,b,label){assert.deepStrictEqual(a,b,label);checks++}
function zipfile(name){return parseAnimationStoreZip(new Uint8Array(fs.readFileSync(path.join(ref,name))))}
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
 const progress=[];const start=Date.now();
 const result=await scanAssets(source,'mk2',(s)=>progress.push(s));
 const groups={p1:result.assets.length,p2:result.assets.filter(a=>a.id.startsWith('mk2-stage-effect:')),
  p3:result.assets.filter(a=>a.id.startsWith('mk2-stage-setup:')),
  p4:result.assets.filter(a=>a.id.startsWith('mk2-floor:')&&!a.id.includes(':battle:')&&!a.id.includes(':tower:')&&!a.id.includes(':armory:')&&!a.id.includes(':arena:')),
  p5:result.assets.filter(a=>a.id.startsWith('mk2-floor:')&&['battle','tower','armory','arena'].some(x=>a.id.startsWith(`mk2-floor:${x}:`))),
  u8:result.assets.filter(a=>a.id.startsWith('u8:'))};
 check(result.assets.length,5016,'total cumulative assets');
 check(new Set(result.assets.map(a=>a.id)).size,5016,'all asset ids unique');
 for(const [k,n] of Object.entries({p2:43,p3:8,p4:7,p5:8,u8:312}))check(groups[k].length,n,`group count ${k}`);
 for(const [k,n] of Object.entries({P2:43,P3:8,P4:7})){
  check(result.reports.p2p4StageVisuals[k].status,'VERIFIED',`P2-P4 status ${k}`);
  check(result.reports.p2p4StageVisuals[k].count,n,`P2-P4 count ${k}`);
 }
 check(result.reports.p5SourceFloors.filter(x=>x.status==='VERIFIED').length,4,'P5 floor statuses');
 check(groups.p2.filter(a=>a.metadata.runtimePaletteSelected===false).length,43,'P2 palette limitation');
 check(groups.p3.every(a=>a.metadata.finalDrawOrderKnown===false),true,'P3 scene uncertainty');
 check(groups.p4.find(a=>a.id==='mk2-floor:forest:candidate-rgba').metadata.paletteRuntimeSelected,false,'Forest candidate status');
 const p2Package=result.packages.find(x=>x.name==='MK2_O177_ALL_43_ORIGINAL_EFFECT_FRAMES.zip');
 check(Boolean(p2Package),true,'O177 package exists');
 check(sha(p2Package.bytes),'68f99207aa5b9963c3d0ecb551680a9edb227f8f8969cfbe596b2c314d28be72','P2 exact historical package SHA');
 const p3Reference=zipfile('P3.zip');const p4Reference=zipfile('P4.zip');
 // Ref archives are selectedZip format, entry paths based on the historical source selection order.
 const p3Man=JSON.parse(Buffer.from(p3Reference.get('manifest.json').bytes).toString('utf8'));
 const p4Man=JSON.parse(Buffer.from(p4Reference.get('manifest.json').bytes).toString('utf8'));
 for(const [pass,refzip,man] of [['p3',p3Reference,p3Man],['p4',p4Reference,p4Man]]){
  for(let i=0;i<man.selectionOrder.length;i++){
   const expected=man.selectionOrder[i],actual=groups[pass].find(a=>a.id===expected.id);
   check(Boolean(actual),true,`${pass} saved asset id ${expected.id}`);
   check(actual.width??null,expected.width??null,`${pass} width ${expected.id}`);
   check(actual.height??null,expected.height??null,`${pass} height ${expected.id}`);
   const file=[...refzip.keys()].find(p=>p.startsWith(`assets/${String(i).padStart(5,'0')}_`));
   check(Boolean(file),true,`${pass} reference member ${i}`);
   const bytes=actual.rgba?require('../src/core/assets/export.ts').assetBytes(actual):actual.bytes;
   check(sha(bytes),sha(refzip.get(file).bytes),`${pass} exact PNG/bytes ${expected.id}`);
   for(const field of ['indices','mask']){
    const p=`indexed/${String(i).padStart(5,'0')}_${field}.bin`;
    if(refzip.has(p)){
     check(Boolean(actual.metadata[field] instanceof Uint8Array),true,`${pass} metadata ${field} present`);
     check(sha(actual.metadata[field]),sha(refzip.get(p).bytes),`${pass} exact ${field} ${expected.id}`);
    }
   }
  }
 }
 const p5Floors=groups.p5.filter(a=>a.id.endsWith(':indices'));
 for(const a of p5Floors){
  const original=fs.readFileSync(path.join(game,a.source.path));
  check(sha(a.bytes),sha(original.subarray(a.source.offset,a.source.offset+a.source.length)),`P5 original bytes ${a.id}`);
 }
 const selected=[groups.p2[0],groups.p3[0],groups.p4[0],groups.p4.find(a=>a.id==='mk2-floor:forest:indices'),groups.p5[0],groups.u8[0]];
 check(selected.every(Boolean),true,'cross-pass selection');
 const zip=selectedZip(selected),parsed=parseAnimationStoreZip(zip);
 const selectedMan=JSON.parse(Buffer.from(parsed.get('manifest.json').bytes).toString('utf8'));
 check(selectedMan.selectionOrder.length,selected.length,'cross-pass selected ZIP manifest');
 check([...parsed.keys()].filter(x=>x.startsWith('assets/')).length,selected.length,'cross-pass ZIP assets count');
 for(const a of selected){check(selectedMan.selectionOrder.some(x=>x.id===a.id),true,`cross-pass ZIP member ${a.id}`)}
 if(out){fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'MK2_P6_SELECTED_EXPORT_SMOKE.zip'),Buffer.from(zip));}
 const report={pass:'P6',status:'PASS',checks,totalAssets:result.assets.length,uniqueAssetIds:true,
  counts:{p1:4950,p2:groups.p2.length,p3:groups.p3.length,p4:groups.p4.length,p5:groups.p5.length,u8:groups.u8.length},
  stageFamilyStatus:result.reports.p2p4StageVisuals,p5FloorStatus:result.reports.p5SourceFloors,
  referenceParity:{p2ExactPackageSha256:sha(p2Package.bytes),p3AssetsExact:true,p4AssetsExact:true},
  selectedZip:{assets:selected.length,bytes:zip.length,sha256:sha(zip)},
  runtimeClaimed:false,fullBrowserBuildTested:false,elapsedMs:Date.now()-start,progress};
 if(out)fs.writeFileSync(path.join(out,'MK2_P6_CUMULATIVE_SMOKE.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify(report,null,2));
})().catch(e=>{console.error(e&&e.stack||e);process.exitCode=1;});
