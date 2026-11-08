#!/usr/bin/env node
/** P65 ORIGINAL-MK1 full collection and independently decoded ANITAB pointer control proof.
 * node scripts/verify-mk1-p65-anitab-streams.cjs <original MK1 folder> [private report.json]
 * No original DOS media or derived copyrighted artwork written to Git.
 */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),ts=require('typescript');
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(mod,file)=>mod._compile(
 ts.transpileModule(fs.readFileSync(file,'utf8'),{fileName:file,
 compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
if(!globalThis.crypto)globalThis.crypto=crypto.webcrypto;
const {scanAssets}=require('../src/core/assets/collection.ts');
const {parseAnimationStoreZip}=require('../src/games/mk1/research/browserAnimationExportBundleValidation.ts');
const {MK1_P65_PACKAGE}=require('../src/core/assets/mk1AnitabIndexedStreamsP65.ts');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const argv=process.argv.slice(2);
assert(argv.length===1||argv.length===2,'original MK1 directory and optional private result path');
const checkout=fs.realpathSync(path.resolve(__dirname,'..')),folder=fs.realpathSync(argv[0]);
const inside=(a,b)=>{const rel=path.relative(a,b);return rel===''||(!rel.startsWith('..'+path.sep)&&rel!=='..'&&!path.isAbsolute(rel));};
assert(fs.statSync(folder).isDirectory()&&!inside(checkout,folder),'original folder must remain outside source checkout');
const resultPath=argv[1]&&path.resolve(argv[1]);
if(resultPath)assert(!inside(checkout,resultPath)&&!inside(folder,resultPath),'report must remain private');
const data=new Map();
function walk(dir,prefix=''){for(const e of fs.readdirSync(dir,{withFileTypes:true})){
 const n=prefix?prefix+'/'+e.name:e.name,file=path.join(dir,e.name);
 if(e.isDirectory())walk(file,n);else if(e.isFile())data.set(n,new Uint8Array(fs.readFileSync(file)));
}}walk(folder);
const entries=[...data].map(([p,b])=>({path:p,name:path.basename(p),extension:path.extname(p).slice(1).toUpperCase(),size:b.length}));
const canonical='750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14';
const exeMatches=entries.filter(e=>e.name.toUpperCase()==='MK1.EXE');
assert.equal(exeMatches.length,1,'one original MK1.EXE');
const exe=data.get(exeMatches[0].path);
assert.equal(sha(exe),canonical,'canonical original MK1.EXE must match');
const source={directoryName:'P65 canonical MK1 DOS',isSynthetic:false,
 async listRecursive(){return entries;},
 async readSlice(p,start,len){const b=data.get(p);if(!b)throw Error('missing '+p);return b.slice(start,start+len);}};
function pkg(c,name){const p=c.packages.filter(x=>x.name===name);assert.equal(p.length,1,'exactly one '+name);return parseAnimationStoreZip(p[0].bytes);}
const member=(z,k)=>{const m=z.get(k);assert(m,'missing '+k);return m.bytes;};
const base=0x8ca54;
function u32(at){assert(at>=0&&at+4<=exe.length,'u32 original exe offset');return new DataView(exe.buffer,exe.byteOffset+at,4).getUint32(0,true);}
function i16(at){assert(at>=0&&at+2<=exe.length,'i16 original exe offset');return new DataView(exe.buffer,exe.byteOffset+at,2).getInt16(0,true);}
function read(at,expected,context){assert.equal(u32(at),expected,'original source opcode/pointer mismatch: '+context);}
(async()=>{
 const c=await scanAssets(source,'mk1',()=>{});
 assert.equal(c.assets.length,2656,'MK1 asset census changed');assert.equal(new Set(c.assets.map(x=>x.id)).size,2656);
 assert.equal(c.reports.p65IndexedAnitabStreams.status,'VERIFIED');
 const p65=pkg(c,MK1_P65_PACKAGE),p60=pkg(c,'MK1_animations_evidence.zip');
 assert.equal(p65.size,4);
 for(const name of ['indexed/descriptor_manifest.json','indexed/descriptor_pixels.bin'])
  assert.deepStrictEqual(member(p65,name),member(p60,name),'O60 existing original indexed bytes altered '+name);
 const manifest=JSON.parse(new TextDecoder().decode(member(p65,'manifests/mk1_source_streams.json')));
 const old=JSON.parse(new TextDecoder().decode(member(p60,'indexed/descriptor_manifest.json')));
 assert.equal(manifest.format,'mk1_p65_lossless_anitab_source_streams_v1');
 assert.equal(manifest.originalExeSha256,canonical);
 assert.equal(manifest.originalExeStaticDataFileBase,base);
 assert.equal(manifest.originalIndexedBinarySha256,sha(member(p60,'indexed/descriptor_pixels.bin')));
 assert.equal(manifest.originalIndexedManifestSha256,sha(member(p60,'indexed/descriptor_manifest.json')));
 assert.equal(manifest.sourceTableCount,8);assert.equal(manifest.originalTableEntries,739);
 assert.equal(manifest.uniqueSourceExecutableStreams,514);assert.equal(manifest.indexedDescriptorCount,1102);
 assert.equal(old.descriptors.length,1102);
 assert.equal(manifest.originalIndexedBinaryByteLength,member(p60,'indexed/descriptor_pixels.bin').length);
 assert.equal(manifest.originalPalettesNotAssigned,true);
 assert.equal(manifest.nativeAnimationMillisecondsVerified,false);
 assert.equal(manifest.nativeLoopPeriodsVerified,false);
 assert.equal(manifest.worldPlacementAndStageCompositionVerified,false);
 const desc=new Map(old.descriptors.map(x=>[x.tableSymbol+':'+x.descriptorWatcomOffset,x]));
 assert.equal(desc.size,1102);
 const oldPlanes=member(p60,'indexed/descriptor_pixels.bin');
 let checkedEntries=0,checkedFrameInstructions=0,checkedControlInstructions=0,checkedDescriptorParts=0;
 const streamOffsets=new Set(),sourceEventAddresses=new Set(),linkedDescriptors=new Set();
 for(const table of manifest.tables){
  for(const cell of table.entries){
   const at=base+cell.cellWatcomOffset;
   read(at,cell.rawValue,'ANITAB '+table.symbol+'/'+cell.index);
   checkedEntries++;
   if(cell.sourceStreamWatcomOffset!==null)
    assert(table.sourceStreams.some(s=>s.sourceStreamWatcomOffset===cell.sourceStreamWatcomOffset));
   if(cell.sourceDescriptorKey!==null)assert(desc.has(cell.sourceDescriptorKey));
  }
  for(const stream of table.sourceStreams){
   streamOffsets.add(stream.sourceStreamWatcomOffset);
   assert.equal(stream.sourceStreamPhysicalStart,base+stream.sourceStreamWatcomOffset);
   const visited=new Set();
   for(const e of stream.events){
    const at=base+e.watcomOffset;visited.add(e.watcomOffset);
    if(e.kind==='frame'){
     if(e.noSleep){read(at,5,'source no-sleep opcode');read(at+4,e.frameTargetWatcomOffset,'source no-sleep descriptor pointer');}
     else read(at,e.frameTargetWatcomOffset,'source original frame pointer');
     assert.equal(e.frameTimingMilliseconds,null);
     assert.equal(e.nativePaletteSelected,null);
     assert.equal(e.runtimeCompositionVerified,false);
     assert(e.sourceFramePartDescriptorKeys.length>0);
     const fp=base+e.frameTargetWatcomOffset;
     if(e.sourceFrameTargetMode==='DIRECT_WITH_XY_DESCRIPTOR'){
      assert.equal(e.sourceFramePartDescriptorKeys.length,1);
      assert.equal(e.sourceFramePartDescriptorKeys[0].split(':').at(-1),String(e.frameTargetWatcomOffset));
     }else{
      assert.equal(e.sourceFrameTargetMode,'ZERO_TERMINATED_DESCRIPTOR_VECTOR');
      for(let i=0;i<e.sourceFramePartDescriptorKeys.length;i++)
       read(fp+i*4,Number(e.sourceFramePartDescriptorKeys[i].split(':').at(-1)),'frame descriptor vector');
      read(fp+e.sourceFramePartDescriptorKeys.length*4,0,'source vector zero terminator');
     }
     for(const k of e.sourceFramePartDescriptorKeys){
      const d=desc.get(k);assert(d,'original frame descriptor missing '+k);
      const raw=base+d.descriptorWatcomOffset;
      assert.equal(i16(raw),d.width,'original descriptor width');
      assert.equal(i16(raw+2),d.height,'original descriptor height');
      assert.equal(i16(raw+4),d.x,'original descriptor x');
      assert.equal(i16(raw+6),d.y,'original descriptor y');
      assert.equal(u32(raw+8)&0xffffff,d.graOffset,'original GRA byte source offset');
      assert(d.indicesOffset>=0&&d.maskOffset+d.pixelCount<=oldPlanes.length);
      linkedDescriptors.add(k);checkedDescriptorParts++;
     }
     checkedFrameInstructions++;
    }else{
     const op={'end':0,'jump':1,'flip-multi':2,'adjust-x':3,
       'adjust-xy':4,'callback':6}[e.kind];
     assert(op!==undefined,'unknown native opcode');
     read(at,op,'original control opcode');
     if(e.kind==='jump')read(at+4,e.targetWatcomOffset,'original jump target');
     if(e.kind==='adjust-x')assert.equal(i16(at+4),e.x);
     if(e.kind==='adjust-xy'){assert.equal(i16(at+4),e.x);assert.equal(i16(at+6),e.y);}
     if(e.kind==='callback')read(at+4,e.callbackWatcomOffset,'original callback');
     checkedControlInstructions++;
    }
    sourceEventAddresses.add(e.watcomOffset);
   }
   if(stream.termination==='END')assert.equal(stream.events.at(-1).kind,'end');
   if(stream.termination==='LOOP')assert(visited.has(stream.loopTargetWatcomOffset));
   assert.equal(stream.nativeRuntimeTraversalVerified,false);
   assert.equal(stream.sourceInstructionEncounterOrderOnly,true);
  }
 }
 assert.equal(checkedEntries,739);assert.equal(streamOffsets.size,514);
 assert.equal(checkedFrameInstructions,manifest.tableLocalFrameInstructionOccurrences);
 assert(checkedDescriptorParts>0&&linkedDescriptors.size>0);
 const summary={pass:'P65',status:'PASS',mk1Assets:2656,originalTables:8,
  verifiedAnitabCells:checkedEntries,uniqueOriginalSourceStreams:streamOffsets.size,
  sourceInstructionFrameOccurrences:checkedFrameInstructions,
  sourceInstructionControlOccurrences:checkedControlInstructions,
  indexedDescriptorRecords:desc.size,indexedSourceFramePartsVerified:checkedDescriptorParts,
  distinctLinkedDescriptorKeys:linkedDescriptors.size,
  originalExecutableOpcodesAndPointersMatched:true,originalO60IndexedBytesByteIdentical:true,
  noOriginalPaletteOrTimingAssigned:true,fullThreeGameRegressionPerformed:false,
  browserPackageDownloadVerified:false};
 if(resultPath){fs.mkdirSync(path.dirname(resultPath),{recursive:true});
  fs.writeFileSync(resultPath,JSON.stringify(summary,null,2)+'\n');}
 console.log(JSON.stringify(summary,null,2));
})().catch(error=>{console.error(error.stack||error);process.exitCode=1;});
