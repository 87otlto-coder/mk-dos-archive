#!/usr/bin/env node
/** P72 original MK3 fixture: 416 IFF CMAP images, distinct palette tables,
 * and one independent original fighter source/selected IFF comparison ZIP.
 *
 * node scripts/verify-mk3-p72-cmap.cjs <original MK3 dir> <PRIVATE-work-dir>
 */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const assert=require('node:assert/strict'),ts=require('typescript');
const {spawnSync}=require('node:child_process');
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(mod,file)=>mod._compile(
 ts.transpileModule(fs.readFileSync(file,'utf8'),{fileName:file,
 compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
if(!globalThis.crypto)globalThis.crypto=crypto.webcrypto;
const {scanAssets}=require('../src/core/assets/collection.ts');
const {listMK3IffPaletteComparisonsP72,exportMK3PaletteComparisonP72}=
 require('../src/core/assets/mk3SourcePaletteComparisonP72.ts');
const {parseAnimationStoreZip}=
 require('../src/games/mk1/research/browserAnimationExportBundleValidation.ts');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
assert.equal(process.argv.length,4,'Original MK3 and private output dir required');
const checkout=fs.realpathSync(path.resolve(__dirname,'..'));
const originals=fs.realpathSync(path.resolve(process.argv[2]));
let work=path.resolve(process.argv[3]);
const inside=(a,b)=>{const relative=path.relative(a,b);
 return relative===''||(!relative.startsWith('..'+path.sep)&&relative!=='..'&&!path.isAbsolute(relative));};
function canonical(target){let current=target,tail=[];
 while(!fs.existsSync(current)){const parent=path.dirname(current);assert.notEqual(parent,current);
  tail.unshift(path.basename(current));current=parent;}
 return path.resolve(fs.realpathSync(current),...tail);
}
work=canonical(work);
assert(fs.statSync(originals).isDirectory()&&!inside(checkout,originals)&&
 !inside(checkout,work)&&!inside(originals,work)&&!inside(work,originals),
 'Original/private folders must be outside Git source and nonoverlapping');
const data=new Map();
function walk(folder,prefix=''){for(const e of fs.readdirSync(folder,{withFileTypes:true})){
 const name=prefix?prefix+'/'+e.name:e.name,full=path.join(folder,e.name);
 if(e.isDirectory())walk(full,name);
 else if(e.isFile())data.set(name,new Uint8Array(fs.readFileSync(full)));
}}walk(originals);
const entries=[...data].map(([p,b])=>({path:p,name:path.basename(p),
 extension:path.extname(p).slice(1).toUpperCase(),size:b.length}));
const exe=entries.filter(e=>e.name.toUpperCase()==='MK3.EXE');
assert.equal(exe.length,1);
assert.equal(sha(data.get(exe[0].path)),
 '8aa7f3d45a086e7373afc120dc88378bda3d7766d5b69badbc707bb4570bdef0');
const source={directoryName:'P72 canonical MK3',isSynthetic:false,
 async listRecursive(){return entries;},
 async readSlice(p,start,count){const b=data.get(p);if(!b)throw Error('Missing '+p);
  return b.slice(start,start+count);}};
(async()=>{
 const collection=await scanAssets(source,'mk3',()=>{});
 assert.equal(collection.assets.length,9186,'canonical MK3 catalogue cannot change');
 const images=collection.assets.filter(a=>a.kind==='image'&&a.metadata.paletteFormat==='IFF_CMAP_RGB8');
 assert.equal(images.length,416,'original embedded-CMAP IFF images');
 const originalChoices=listMK3IffPaletteComparisonsP72(collection.assets);
 assert.equal(originalChoices.length,125,'original distinct embedded IFF CMAP fingerprints');
 assert.equal(originalChoices.reduce((n,x)=>n+x.identicalSourceCmaps,0),416);
 const sprite=collection.assets.find(a=>a.kind==='sprite'&&a.source.path==='BLADE.FTR');
 assert(sprite,'original BLADE fighter sprite unavailable');
 const iff=originalChoices[0].sourceIffAsset;
 assert.equal(iff.source.path,'DATA.MK3');
 assert.equal(iff.source.offset,0);
 const exported=await exportMK3PaletteComparisonP72(sprite,iff);
 const entriesZip=parseAnimationStoreZip(exported.bytes);
 assert.equal(entriesZip.size,6);
 assert.deepStrictEqual(entriesZip.get('original/fighter-indices.bin').bytes,sprite.metadata.indices);
 assert.deepStrictEqual(entriesZip.get('original/fighter-mask.bin').bytes,sprite.metadata.mask);
 assert.deepStrictEqual(entriesZip.get('reference/iff-cmap-rgb8.bin').bytes,iff.metadata.paletteRgb);
 const manifest=JSON.parse(new TextDecoder().decode(entriesZip.get('manifest.json').bytes));
 assert.equal(manifest.nativeFighterPaletteOwnershipVerified,false);
 assert.equal(manifest.originalIffPalette.originalFighterOwnership,'UNKNOWN');
 assert.equal(manifest.originalFighter.sourceWholeFileSha256,sha(data.get(sprite.source.path)));
 assert.equal(manifest.originalIffPalette.sourceWholeFileSha256,sha(data.get(iff.source.path)));
 fs.mkdirSync(work,{recursive:true});
 const archive=path.join(work,exported.name);
 fs.writeFileSync(archive,exported.bytes);
 const report=path.join(work,'p72-original-independent.json');
 const result=spawnSync(process.env.PYTHON||'python',
  ['scripts/verify-mk3-p72-iff-cmap-independent.py',originals,archive,report],
  {cwd:checkout,encoding:'utf8',timeout:300000,maxBuffer:2*1024*1024,windowsHide:true});
 if(result.error||result.status!==0)
  throw Error('Independent original MK3 sprite/CMAP source acceptance FAILED:\n'+
   [result.error?.message,result.stderr,result.stdout].filter(Boolean).join('\n'));
 const checked=JSON.parse(fs.readFileSync(report,'utf8'));
 assert.equal(checked.status,'PASS');
 assert.equal(checked.sourceCmapEntries,256);
 assert.equal(checked.allSourceIndicesMaskPaletteAndPngBytesMatched,true);
 assert.equal(checked.nativeFighterPaletteOwnershipClaimed,false);
 const summary={pass:'P72',status:'PASS',mk3Assets:9186,
  originalIffImagesWithEmbeddedCmaps:416,
  uniqueOriginalIffCmapByteTables:125,
  originalFtrComparisonSource:sprite.source.path,
  originalIffComparisonFormOffset:iff.source.offset,
  originalFighterPixelsIndependentlyDecoded:checked.sourceIndexedPixels,
  originalIffPaletteBytesAndComparisonPngVerified:true,
  originalFighterIndexAndOpacityBytesPreserved:true,
  nativeFighterPaletteOwnershipClaimed:false,
  browserDownloadVerified:false,privateWorkDirectory:work};
 fs.writeFileSync(path.join(work,'p72-summary.json'),JSON.stringify(summary,null,2)+'\n');
 console.log(JSON.stringify(summary,null,2));
})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
