#!/usr/bin/env node
/** Standalone P6 cumulative smoke. No P2/P3/P4 archived ZIPs needed: archived hashes
 * are preserved in scripts/fixtures/mk2-p6-archived-export-parity.json.
 * Usage: node scripts/verify-mk2-p6-standalone.cjs <canonical-MK2-directory> [report.json]
 */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
let ts;try{ts=require('typescript')}catch{ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript')}
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{fileName:file,
 compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true,allowImportingTsExtensions:true}}).outputText,file);
if(!globalThis.crypto)globalThis.crypto=crypto.webcrypto;
const {scanAssets}=require('../src/core/assets/collection.ts');
const {selectedZip,assetBytes}=require('../src/core/assets/export.ts');
const {parseAnimationStoreZip}=require('../src/games/mk1/research/browserAnimationExportBundleValidation.ts');
const specs=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/mk2-p6-archived-export-parity.json'),'utf8'));
const dir=process.argv[2];if(!dir)throw Error('Usage: verify-mk2-p6-standalone.cjs <MK2 directory> [report.json]');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const source={directoryName:'mk2',isSynthetic:false,
 async listRecursive(){const out=[];function walk(d,sub=''){
  for(const item of fs.readdirSync(d,{withFileTypes:true})){
   const rel=sub?sub+'/'+item.name:item.name,full=path.join(d,item.name);
   if(item.isDirectory())walk(full,rel);else if(item.isFile())out.push({path:rel,name:item.name,extension:item.name.split('.').at(-1).toUpperCase(),size:fs.statSync(full).size});
  }
 }walk(dir);return out;},
 async readSlice(p,offset,length){const fd=fs.openSync(path.join(dir,p),'r');try{const b=Buffer.alloc(length),n=fs.readSync(fd,b,0,length,offset);return new Uint8Array(b.subarray(0,n));}finally{fs.closeSync(fd);}}
};
(async()=>{const start=Date.now();let checks=0;
 function eq(a,b,msg){assert.deepStrictEqual(a,b,msg);checks++}
 const r=await scanAssets(source,'mk2',()=>{}),byId=new Map(r.assets.map(a=>[a.id,a]));
 eq(r.assets.length,5016,'P6 cumulative asset total');eq(byId.size,5016,'no duplicate ids');
 for(const [prefix,count] of [['mk2-stage-effect:',43],['mk2-stage-setup:',8],['mk2-floor:',15],['u8:',312]])
  eq(r.assets.filter(a=>a.id.startsWith(prefix)).length,count,`${prefix} count`);
 for(const [pass,count] of [['P2',43],['P3',8],['P4',7]]){
  eq(r.reports.p2p4StageVisuals[pass].status,'VERIFIED',`${pass} status`);
  eq(r.reports.p2p4StageVisuals[pass].count,count,`${pass} count`);
 }
 eq(r.reports.p5SourceFloors.filter(x=>x.status==='VERIFIED').length,4,'P5 stage statuses');
 eq(sha(r.packages.find(p=>p.name==='MK2_O177_ALL_43_ORIGINAL_EFFECT_FRAMES.zip').bytes),specs.p2ArchiveSHA256,'P2 archive SHA-256');
 for(const [pass,rows] of Object.entries(specs.packages))for(const s of rows){
  const a=byId.get(s.id);assert(a,`missing archived ${pass} ${s.id}`);checks++;
  eq(a.width??null,s.width??null,`${pass} width ${s.id}`);eq(a.height??null,s.height??null,`${pass} height ${s.id}`);
  eq(sha(assetBytes(a)),s.sha256,`${pass} PNG or raw bytes ${s.id}`);
  for(const fld of ['indices','mask'])if(s[fld+'SHA256']){
   eq(a.metadata[fld] instanceof Uint8Array,true,`${pass} ${fld} buffer ${s.id}`);
   eq(sha(a.metadata[fld]),s[fld+'SHA256'],`${pass} ${fld} SHA ${s.id}`);
  }
 }
 const p5=r.assets.filter(a=>/^mk2-floor:(battle|tower|armory|arena):indices$/.test(a.id));eq(p5.length,4,'P5 floor byte sources');
 for(const a of p5){const raw=fs.readFileSync(path.join(dir,a.source.path));eq(sha(a.bytes),sha(raw.subarray(a.source.offset,a.source.offset+a.source.length)),`P5 source parity ${a.id}`)}
 const sample=[r.assets.find(a=>a.id.startsWith('mk2-stage-effect:')),r.assets.find(a=>a.id.startsWith('mk2-stage-setup:')),
  r.assets.find(a=>a.id==='mk2-floor:tomb:rgba'),r.assets.find(a=>a.id==='mk2-floor:forest:indices'),
  r.assets.find(a=>a.id==='mk2-floor:tower:indices'),r.assets.find(a=>a.id.startsWith('u8:'))];
 eq(sample.every(Boolean),true,'selected mixed-domain sources');
 const zip=parseAnimationStoreZip(selectedZip(sample));eq([...zip.keys()].filter(k=>k.startsWith('assets/')).length,6,'selected ZIP members');
 const report={pass:'P6',status:'PASS',checks,scannedAssets:5016,uniqueIds:true,
  groups:{p2:43,p3:8,p4:7,p5:8,mk2SoundWAV:312},referenceParity:'P2 O177 ZIP SHA + all P3/P4 asset byte hashes',
  selectedZipMemberCount:6,sourceVerifiedOnly:true,browserUIVerified:false,elapsedMs:Date.now()-start};
 if(process.argv[3])fs.writeFileSync(process.argv[3],JSON.stringify(report,null,2));
 console.log(JSON.stringify(report,null,2));
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
