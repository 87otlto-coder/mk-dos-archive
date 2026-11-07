#!/usr/bin/env node
/** P40 original-MK2 fixture integration and negative-control gate.
 * node scripts/verify-mk2-p40-portal-coverage.cjs <original MK2 folder> [private-report.json]
 * Source-only CI cannot replace this original-game test.
 */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),ts=require('typescript');
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{fileName:f,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,f);
if(!globalThis.crypto)globalThis.crypto=crypto.webcrypto;
const {scanAssets}=require('../src/core/assets/collection.ts');


const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const root=process.argv[2];assert.ok(root,'Provide original MK2 directory');const data=new Map();
function walk(dir,prefix=''){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=prefix?prefix+'/'+e.name:e.name,full=path.join(dir,e.name);if(e.isDirectory())walk(full,p);else if(e.isFile())data.set(p,new Uint8Array(fs.readFileSync(full)));}}
walk(root);
const source={directoryName:'P40 original MK2',isSynthetic:false,
 async listRecursive(){return [...data].map(([p,b])=>({path:p,name:path.basename(p),extension:path.extname(p).slice(1).toUpperCase(),size:b.length}));},
 async readSlice(p,start,count){const b=data.get(p);if(!b)throw Error('Missing '+p);return b.slice(start,start+count);}};

const {indexedAssetZip,selectedZip,metadata}=require('../src/core/assets/export.ts');
const {parseAnimationStoreZip}=require('../src/games/mk1/research/browserAnimationExportBundleValidation.ts');
const output=path.resolve(process.argv[3]||'');assert.ok(process.argv[3],'Private output required');
const inside=(a,b)=>{const rel=path.relative(a,b);return rel===''||(!rel.startsWith('..'+path.sep)&&rel!=='..'&&!path.isAbsolute(rel));};
let existing=output,tail=[];while(!fs.existsSync(existing)){tail.unshift(path.basename(existing));existing=path.dirname(existing);}
const target=path.resolve(fs.realpathSync(existing),...tail);
assert.ok(!inside(fs.realpathSync(path.join(__dirname,'..')),target)&&!inside(fs.realpathSync(root),target),'Output must be outside repository and fixtures');

(async()=>{
 fs.mkdirSync(target,{recursive:true});
 const c=await scanAssets(source,'mk3',()=>{});assert.equal(c.assets.length,9186);
 const pictures=c.assets.filter(a=>a.kind==='image');assert.equal(pictures.length,416);
 const cases=[];
 for(const [i,a]of pictures.entries()){
  const archive=indexedAssetZip(a),entries=parseAnimationStoreZip(archive.bytes);
  for(const field of ['indices','mask','paletteRgb'])assert.deepStrictEqual(Buffer.from(entries.get('indexed/00000_'+field+'.bin').bytes),Buffer.from(a.metadata[field]));
  const manifest=JSON.parse(new TextDecoder().decode(entries.get('manifest.json').bytes));
  assert.equal(manifest.selectionOrder[0].metadata.paletteRuntimeOwnershipKnown,false);
  fs.writeFileSync(path.join(target,i+'.zip'),archive.bytes);cases.push({file:i+'.zip',offset:a.source.offset,length:a.source.length,rgbaSha256:sha(a.rgba)});
 }
 fs.writeFileSync(path.join(target,'cases.json'),JSON.stringify(cases,null,2)+'\n');
 console.log(JSON.stringify({status:'PASS',assets:9186,iffPictures:416,paletteArchives:cases.length,nativeRuntimeOwnershipClaimed:false},null,2));
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
