#!/usr/bin/env node
/** Exact P76 production Vite bundle original-source/ZIP parity check.
 *
 * node scripts/verify-mk3-p76-compiled-original.cjs ORIGINAL_MK3_DIR BUILT_DIST_DIR VERIFIED_P75_PRIVATE_ZIP NEW_PRIVATE_WORK_DIR
 *
 * Deliberately pinned to the accepted source-only P76 build bytes. Isolates
 * the compiled indexed recovery, PNG and ZIP functions from the production
 * bundle in a constrained VM context and compares all 19 private exports to
 * the independently accepted P75 source-byte oracle. Does NOT run a browser,
 * the real full-catalogue scanner, or the official original-source checkpoint.
 */
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const vm=require('node:vm'),crypto=require('node:crypto'),{spawnSync}=require('node:child_process');
const assert=require('node:assert/strict');
const EXPECTED_DATA_SHA='72905bc96b752bceb0055296e26b904402909f73a1401541c0dd175135a55517';
const EXACT_BUNDLE_SHA='acb4692d99a0a3bfdb9da508bf730b858b3179607b34d2f3e0785dd9842c8884';
const EXPECTED_P75_ZIP_SHA='aeeed230c7d76adacebe9b33b5675c746b8248e2a3fdb2734b7253a9785904ed';
const root=fs.realpathSync(path.join(__dirname,'..'));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function requireOriginal(ok,why){assert(ok,'P76 compiled original: '+why)}
function within(folder,other){const rel=path.relative(folder,other);return rel===''||(!rel.startsWith('..'+path.sep)&&rel!=='..'&&!path.isAbsolute(rel))}
function canonical(newPath){let base=path.resolve(newPath),tail=[];while(!fs.existsSync(base)){const parent=path.dirname(base);requireOriginal(parent!==base,'invalid output ancestor');tail.unshift(path.basename(base));base=parent}return path.resolve(fs.realpathSync(base),...tail)}
function python(args){const r=spawnSync(process.env.PYTHON||'python',args,{cwd:root,encoding:'utf8',timeout:600000,maxBuffer:16*1024*1024,windowsHide:true,env:{...process.env,PYTHONDONTWRITEBYTECODE:'1'}});
 if(r.error||r.status!==0)throw Error('P76 independent original Python FAILED: '+[r.error?.message,r.stderr,r.stdout].filter(Boolean).join('\n'));
 return r.stdout.trim()}
function locateOriginal(source){const files=[];function visit(dir){for(const ent of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,ent.name);if(ent.isDirectory())visit(p);else if(ent.isFile()&&ent.name.toUpperCase()==='DATA.MK3')files.push(p)}}visit(source);requireOriginal(files.length===1,'one original DATA.MK3 file required');return files[0]}
function section(bundle,beg,end){const i=bundle.indexOf(beg),j=bundle.indexOf(end,i);requireOriginal(i>=0&&j>i,'exact compiled source fragment unavailable: '+beg);return bundle.slice(i,j)}
async function main(){
 requireOriginal(process.argv.length===6,'original game, compiled dist, verified P75 ZIP, new private work required');
 const original=fs.realpathSync(process.argv[2]),dist=fs.realpathSync(process.argv[3]),p75zip=fs.realpathSync(process.argv[4]),work=canonical(process.argv[5]);
 requireOriginal(fs.statSync(original).isDirectory()&&fs.statSync(dist).isDirectory(),'original/dist must be directories');
 requireOriginal(!fs.existsSync(work),'private output work folder already exists');
 requireOriginal(fs.statSync(p75zip).isFile()&&sha(fs.readFileSync(p75zip))===EXPECTED_P75_ZIP_SHA,'expected independently accepted original private P75 ZIP');
 requireOriginal(!within(root,original)&&!within(root,work)&&!within(original,work)&&!within(work,original)&&!within(dist,work),
  'originals and private evidence must remain separate from Git checkout and one another');
 const jsDir=path.join(dist,'assets');
 const scripts=fs.readdirSync(jsDir).filter(n=>/^index-.*\.js$/.test(n));
 requireOriginal(scripts.length===1,'exactly one production index JavaScript bundle required');
 const bundle=fs.readFileSync(path.join(jsDir,scripts[0]),'utf8');
 requireOriginal(sha(Buffer.from(bundle))===EXACT_BUNDLE_SHA,'P76 minified production bundle SHA not recognized');
 const originalData=new Uint8Array(fs.readFileSync(locateOriginal(original)));
 requireOriginal(sha(originalData)===EXPECTED_DATA_SHA,'original DOS MK3 DATA.MK3 SHA not recognized');
 fs.mkdirSync(work,{recursive:false});
 const p75manifest=JSON.parse(python(['-c',
  'import json,sys,zipfile; print(json.dumps(json.loads(zipfile.ZipFile(sys.argv[1]).read("manifest.json"))))',
  p75zip]));
 const parsedForms=[],parsedGaps=[];
 let offset=0;
 while(offset+12<=originalData.length){
  const isForm=Buffer.from(originalData.slice(offset,offset+4)).toString('ascii')==='FORM';
  const type=Buffer.from(originalData.slice(offset+8,offset+12)).toString('ascii');
  if(!isForm||!(type==='PBM '||type==='ILBM')){offset++;continue}
  const whole=new DataView(originalData.buffer,originalData.byteOffset,originalData.byteLength).getUint32(offset+4,false)+8;
  if(whole<20||whole>originalData.length-offset){offset++;continue}
  const end=offset+whole;let walk=offset+12;const tags=new Set();let valid=true;
  while(walk<end){
   if(walk+8>end){valid=false;break}
   const tag=Buffer.from(originalData.slice(walk,walk+4)).toString('ascii');
   const n=new DataView(originalData.buffer,originalData.byteOffset,originalData.byteLength).getUint32(walk+4,false);
   if(walk+8+n>end){valid=false;break}
   tags.add(tag);walk+=8+n+(n&1);
  }
  if(!valid||walk!==end||!['BMHD','CMAP','BODY'].every(t=>tags.has(t))){offset++;continue}
  parsedForms.push([offset,end]);offset=end;
 }
 let cursor=0;for(const [a,b] of parsedForms){if(a>cursor)parsedGaps.push([cursor,a]);cursor=b}
 if(cursor<originalData.length)parsedGaps.push([cursor,originalData.length]);
 const meta={forms:parsedForms,gaps:parsedGaps,manifest:p75manifest};
 requireOriginal(meta.forms.length===416&&meta.gaps.length===20&&meta.manifest.records.length===19,
  'original IFF/non-IFF source interval census changed');
 const ctx={Uint8Array,DataView,TextEncoder,TextDecoder,crypto:crypto.webcrypto,console,
   Jn:b=>new DataView(b.buffer,b.byteOffset,b.byteLength),
   At:async b=>sha(b),Yr:s=>s.replace(/[^a-zA-Z0-9_.-]/g,'_').slice(0,180),
   Yf:new TextEncoder(),oa:new TextEncoder()};
 const source=section(bundle,'function Z$(', 'function Q$(')+
  section(bundle,'function Xh(', 'async function D6(')+
  section(bundle,'function sM(', 'function ty(')+
  section(bundle,'const eh="'+EXPECTED_DATA_SHA+'"', 'const Tne=')+
  '\nglobalThis.p76={recover:jne,exportIndexed:Eae};';
 vm.runInNewContext(source,ctx,{timeout:4000});
 const forms=meta.forms.map(([offset,end])=>({id:'DATA.MK3@'+offset,kind:'image',source:{path:'DATA.MK3',offset,length:end-offset,sha256:EXPECTED_DATA_SHA},metadata:{paletteFormat:'IFF_CMAP_RGB8'}}));
 const gaps=meta.gaps.map(([offset,end])=>({id:'DATA.MK3:unknown:'+offset,kind:'raw',source:{path:'DATA.MK3',offset,length:end-offset,sha256:EXPECTED_DATA_SHA},metadata:{}}));
 const baseline=[...forms,...gaps];
 while(baseline.length<9186)baseline.push({id:'fixture-non-DATA-MK3:'+baseline.length,kind:'sprite',source:{path:'BLADE.FTR'},metadata:{}});
 const directory={listRecursive:async()=>[{path:'DATA.MK3',name:'DATA.MK3',size:originalData.length}],readSlice:async(p,o,n)=>{requireOriginal(p==='DATA.MK3','source read path');return originalData.slice(o,o+n)}};
 const recovered=await ctx.p76.recover(directory,baseline);
 requireOriginal(recovered.assets.length===19&&recovered.report.newCatalogueAssets===9205,'opt-in source canvas census');
 const exportDir=path.join(work,'indexed-zips');fs.mkdirSync(exportDir);
 let zipped=0;
 for(let i=0;i<19;i++){
  const a=recovered.assets[i],m=meta.manifest.records[i];
  requireOriginal(a.source.offset===m.regionOffset&&a.source.length===m.regionLength,
   'recovered index is not tied to original non-IFF source region');
  const result=ctx.p76.exportIndexed(a);
  const filename='region-'+String(i+1).padStart(2,'0')+'-indexed.zip';
  fs.writeFileSync(path.join(exportDir,filename),Buffer.from(result.bytes));
  zipped+=result.bytes.length;
 }
 const independent=JSON.parse(python([path.join(__dirname,'verify-mk3-p76-compiled-independent.py'),p75zip,exportDir]));
 requireOriginal(independent.status==='PASS'&&independent.originalSidecarsByteIdentical===114&&
  independent.compiledPngPixelsSourceMatched===2050843,'independent original ZIP/PNG parity failed');
 const report={pass:'P76_COMPILED_ORIGINAL',status:'PASS',
  sourceBundleSHA256:EXACT_BUNDLE_SHA,originalSourceSha256:EXPECTED_DATA_SHA,
  independentlyVerifiedP75ArchiveSHA256:EXPECTED_P75_ZIP_SHA,
  productionCompiledRecoveryFunctionsExecuted:true,productionCompiledIndexedZipAndPngWriterExecuted:true,
  originalSourceValidatingSyntheticCatalogueUsed:true,fullOriginalMK3ScannerReExecuted:false,
  recoveredSourceRowIndexedImages:19,originalIndexedPositionsPerPlane:2050843,
  originalOpaquePixels:996697,originalSourceAbsentRows:271,
  originalUndecodedBytesPreservedAfterRowTables:1611110,
  privateIndexedZIPs:19,privateZIPBytes:zipped,
  independentOriginalSidecarsByteVerified:114,
  independentOriginalSidecarBytesVerified:independent.originalSidecarBytesVerified,
  independentCompiledPngSourcePixelsVerified:2050843,
  nativePaletteOrOriginalRendererClaims:false,
  realChromeBrowserWorkflowExecuted:false,completeOriginalThreeGameCheckpointExecuted:false};
 fs.writeFileSync(path.join(work,'p76-production-original-summary.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report));
}
main().catch(e=>{console.error(e.stack||e);process.exitCode=1});
