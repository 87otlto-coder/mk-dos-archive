#!/usr/bin/env node
/** P55 original-MK1 gallery-to-preview acceptance, run only with private original game files.
 * Usage: node scripts/verify-mk1-p55-stage-navigation.cjs <original MK1 folder> [private-result.json]
 */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),ts=require('typescript');
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{fileName:f,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,f);
if(!globalThis.crypto)globalThis.crypto=crypto.webcrypto;
const {scanAssets}=require('../src/core/assets/collection.ts');
const {discoverStageGallery,verifiedMK1HeaderPreviewLinks}=require('../src/components/stageGalleryModel.ts');
const {matchesAssetSearchP55,exactAssetSearchP55}=require('../src/core/assets/assetSearchP55.ts');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const root=process.argv[2];assert(root,'Provide original MK1 directory');
const files=new Map();
function walk(dir,prefix=''){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=prefix?prefix+'/'+e.name:e.name,full=path.join(dir,e.name);if(e.isDirectory())walk(full,p);else if(e.isFile())files.set(p,new Uint8Array(fs.readFileSync(full)));}}
walk(root);
const source={directoryName:'P55 original MK1',isSynthetic:false,
 async listRecursive(){return [...files].map(([p,b])=>({path:p,name:path.basename(p),extension:path.extname(p).slice(1).toUpperCase(),size:b.length}));},
 async readSlice(p,start,count){const b=files.get(p);if(!b)throw Error('Missing original '+p);return b.slice(start,start+count);}};
(async()=>{
 const exe=[...files].filter(([p])=>path.basename(p).toUpperCase()==='MK1.EXE');
 assert.equal(exe.length,1);
 assert.equal(sha(exe[0][1]),'750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14');
 const c=await scanAssets(source,'mk1',()=>{});
 assert.equal(c.assets.length,2656);assert.equal(new Set(c.assets.map(a=>a.id)).size,2656);
 const report=c.reports.stageHeaderBindings;
 assert(report&&report.schema==='mk1_p54_header_module_preview_joins_v1');
 const pkg=c.packages.find(p=>p.name==='MK1_P54_VERIFIED_HEADER_MODULE_PREVIEW_JOINS.json');
 assert(pkg);assert.deepStrictEqual(JSON.parse(new TextDecoder().decode(pkg.bytes)),report);
 assert.equal(sha(pkg.bytes),'bb180450381a7f43ecca1f3bc6282bb1c6b0bc1d48cc77e8f9ad5e27092269db',
  'P54 original fixture report identity changed');
 const links=verifiedMK1HeaderPreviewLinks(report);
 assert.equal(links.size,15,'all original P54 header resources must be navigable');
 const cards=discoverStageGallery((await source.listRecursive()).map(e=>({name:e.name})), 'mk1');
 const byFile=new Map(cards.map(x=>[x.file,x]));
 let checked=0;
 for(const [header,targets] of links){
  assert(byFile.has(header),'header not shown by inventory gallery: '+header);
  assert(targets.length>0);
  for(const link of targets){
   const a=c.assets.filter(x=>x.id===link.assetId);
   assert.equal(a.length,1,'exact normalized preview not registered');
   assert.equal(a[0].kind,'stage');
   assert(a[0].rgba&&a[0].width&&a[0].height&&a[0].rgba.length===a[0].width*a[0].height*4);
   const matching=c.assets.filter(x=>matchesAssetSearchP55(x,exactAssetSearchP55(link.assetId)));
   assert.equal(matching.length,1,'ID route is not exact');
   assert.equal(matching[0].id,link.assetId);
   checked++;
  }
 }
 assert.equal(checked,24);
 const missing=verifiedMK1HeaderPreviewLinks({...report,arcadeStageNamesVerified:true});
 assert.equal(missing.size,0,'false arcade-stage claim should disable links');
 assert.equal(verifiedMK1HeaderPreviewLinks(null).size,0,'unscanned app must show no links');
 const result={pass:'P55',status:'PASS',originalMk1Assets:c.assets.length,
  exactNavigableModulePreviews:checked,linkedHeaders:links.size,
  allHeadersInOriginalInventory:true,p54ReportSha256:sha(pkg.bytes),falseClaimRejected:true,
  sourceReportByteIdentical:true,actualBrowserClickVerified:false,arcadeStageNamesAssigned:false};
 if(process.argv[3])fs.writeFileSync(process.argv[3],JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify(result,null,2));
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
