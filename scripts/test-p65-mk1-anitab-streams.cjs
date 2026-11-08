#!/usr/bin/env node
/** P65 source-only faithful indexed-source-stream packaging and 15 false-evidence controls. */
const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict'),ts=require('typescript');
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(m,f)=>m._compile(
 ts.transpileModule(fs.readFileSync(f,'utf8'),{fileName:f,
 compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
if(!globalThis.crypto)globalThis.crypto=crypto.webcrypto;
const {buildMK1IndexedAnimationStreamsP65,MK1_P65_PACKAGE}=require('../src/core/assets/mk1AnitabIndexedStreamsP65.ts');
const {buildStoredZip}=require('../src/core/research/researchArtifactDownloads.ts');
const {parseAnimationStoreZip}=require('../src/games/mk1/research/browserAnimationExportBundleValidation.ts');
const canonical='750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14';
const enc=new TextEncoder();
function fixture(){
 const tables=[],originalDescriptors=[],indexed=[],binary=[],per=[65,65,64,64,64,64,64,64],
  perDesc=[138,138,138,138,138,138,137,137],entryCount=[93,93,93,92,92,92,92,92];
 let streamId=0,descriptorId=0,cursor=0;
 for(let i=0;i<8;i++){
  const symbol='TAB'+i+'_ANITAB',resourcePath='GRAPHICS/FAKE'+i+'.GRA';
  const desc=[],entries=[],streams=[];
  for(let j=0;j<perDesc[i];j++){
   const off=0x1000+(descriptorId++)*16,graOffset=(j*20);
   const d={tableSymbol:symbol,watcomOffset:off,resourcePath,graOffset,
    width:2,height:2,x:j%8,y:i,decode:{checksum:'checksum_'+off,opaquePixelCount:3}};
   originalDescriptors.push(d);
   desc.push({...d});
   indexed.push({tableSymbol:symbol,descriptorWatcomOffset:off,resourcePath,graOffset,
    width:2,height:2,x:j%8,y:i,decodeChecksum:'checksum_'+off,
    indicesOffset:cursor,maskOffset:cursor+4,pixelCount:4});
   binary.push(1,2,3,4,1,0,1,1);cursor+=8;
  }
  const frameOff=0x90000+i*16;
  const partOffsets=desc.slice(0,i===0?2:1).map(d=>d.watcomOffset);
  const frameTargets=[{watcomOffset:frameOff,mode:'ZERO_TERMINATED_DESCRIPTOR_VECTOR',
    partCount:partOffsets.length,descriptorOffsets:partOffsets}];
  for(let j=0;j<per[i];j++){
   const start=0xa0000+(streamId++)*24;
   const events=[{kind:'frame',watcomOffset:start,frameTargetWatcomOffset:frameOff,noSleep:false}];
   if(i===0&&j===0)events.push({kind:'flip-multi',watcomOffset:start+4});
   else events.push({kind:'end',watcomOffset:start+4});
   streams.push({watcomOffset:start,physicalStart:0x8ca54+start,confidence:'CORROBORATED',
    termination:i===0&&j===0?'LOOP':'END',
    loopTargetWatcomOffset:i===0&&j===0?start:null,
    frameTargetMode:'DESCRIPTOR_VECTOR',events});
  }
  for(let j=0;j<entryCount[i];j++){
   const ref=j<streams.length?streams[j].watcomOffset:null;
   entries.push({index:j,cellWatcomOffset:0xb0000+i*0x1000+j*4,
    rawValue:ref??0,classification:ref?'ANIMATION_STREAM_DESCRIPTOR_VECTOR':'ZERO_OR_UNASSIGNED_SLOT',
    confidence:ref?'CORROBORATED':'UNKNOWN',streamWatcomOffset:ref,
    descriptorWatcomOffset:null});
  }
  tables.push({symbol,moduleName:'FIGHTER'+i,watcomStart:0xb0000+i*0x1000,
    entries,streams,frameTargets,descriptors:desc});
 }
 const o17={status:'SUCCESS',validation:{allChecksPassed:true},
  commandGrammar:{verifiedAgainstCanonicalExecutable:true},
  decision:{boundedMK1AnitabExportMechanismEstablished:true},
  provenance:{sha256:canonical},fixture:{exePath:'MK1.EXE'},
  coordinateModel:{staticDataBase:0x8ca54},
  crossTable:{totalUniqueStreamStartsAcrossTables:514,totalUniqueDescriptorsAcrossTables:1102},
  tables};
 const o18={status:'SUCCESS',validation:{allChecksPassed:true},
  decision:{allO17DescriptorsResourceBackedAndDecodable:true},
  provenance:{sha256:canonical},descriptors:originalDescriptors};
 function pack(rows=indexed,b=binary){
  const m={format:'mk1_animation_indexed_descriptor_payload_manifest_v1',
    descriptorCount:rows.length,binaryFile:'descriptor_pixels.bin',descriptors:rows};
  return buildStoredZip([{name:'indexed/descriptor_manifest.json',bytes:enc.encode(JSON.stringify(m))},
    {name:'indexed/descriptor_pixels.bin',bytes:new Uint8Array(b)}]);
 }
 return {o17,o18,pack,indexed,binary};
}
(async()=>{
 const f=fixture(),zip=f.pack(),p=await buildMK1IndexedAnimationStreamsP65(f.o17,f.o18,zip);
 assert.equal(p.name,MK1_P65_PACKAGE);assert.equal(p.report.status,'VERIFIED');
 assert.equal(p.report.originalTables,8);assert.equal(p.report.originalTableEntries,739);
 assert.equal(p.report.uniqueSourceStreams,514);assert.equal(p.report.indexedDescriptors,1102);
 assert.equal(p.report.sourceFrameEvents,514);assert.equal(p.report.originalIndexedBytesPreserved,true);
 assert.equal(p.report.nativePaletteOrFrameTimingAsserted,false);
 const z=parseAnimationStoreZip(p.bytes),orig=parseAnimationStoreZip(zip);
 assert.equal(z.size,4);
 assert.deepStrictEqual(z.get('indexed/descriptor_manifest.json').bytes,orig.get('indexed/descriptor_manifest.json').bytes);
 assert.deepStrictEqual(z.get('indexed/descriptor_pixels.bin').bytes,orig.get('indexed/descriptor_pixels.bin').bytes);
 const man=JSON.parse(new TextDecoder().decode(z.get('manifests/mk1_source_streams.json').bytes));
 assert.equal(man.format,'mk1_p65_lossless_anitab_source_streams_v1');
 assert.equal(man.tables.length,8);assert.equal(man.uniqueSourceExecutableStreams,514);
 assert.equal(man.originalTableEntries,739);assert.equal(man.indexedDescriptorCount,1102);
 assert.equal(man.sourceFrameOrderMeaning,'ORIGINAL_EXECUTABLE_INSTRUCTION_ENCOUNTER_ORDER_NOT_NATIVE_RUNTIME_PLAYBACK');
 assert.equal(man.nativeAnimationMillisecondsVerified,false);assert.equal(man.originalPalettesNotAssigned,true);
 assert.equal(man.tables[0].sourceStreams[0].termination,'LOOP');
 assert.deepStrictEqual(man.tables[0].sourceStreams[0].events[0].sourceFramePartDescriptorKeys,
  f.o17.tables[0].descriptors.slice(0,2).map(d=>f.o17.tables[0].symbol+':'+d.watcomOffset));
 assert.equal(man.tables[0].sourceStreams[0].events[0].frameTimingMilliseconds,null);
 assert.equal(man.tables[0].sourceStreams[0].events[0].nativePaletteSelected,null);
 assert.equal(man.tables[0].sourceStreams[0].sourceInstructionEncounterOrderOnly,true);
 assert.equal(man.tables[0].sourceStreams[0].nativeRuntimeTraversalVerified,false);
 let rejects=0;
 async function refuse(label,edit,pattern){
  const s=fixture();edit(s);
  await assert.rejects(buildMK1IndexedAnimationStreamsP65(s.o17,s.o18,s.pack(),),pattern,label);
  rejects++;
 }
 await refuse('unverified O17',s=>s.o17.status='UNAVAILABLE',/unverified original executable/);
 await refuse('forged EXE SHA',s=>s.o17.provenance.sha256='0'.repeat(64),/canonical original/);
 await refuse('incorrect stream count',s=>s.o17.crossTable.totalUniqueStreamStartsAcrossTables=515,/canonical structural/);
 await refuse('short ANITAB table',s=>s.o17.tables[0].entries.pop(),/canonical table entry/);
 await refuse('duplicated O18 key',s=>s.o18.descriptors[1].watcomOffset=s.o18.descriptors[0].watcomOffset,/duplicate O18/);
 await refuse('O18 missing descriptor',s=>s.o18.descriptors.pop(),/canonical ANITAB/);
 await refuse('reordered ANITAB entry',s=>s.o17.tables[0].entries[0].index=3,/original ANITAB cell/);
 await refuse('unresolved stream pointer',s=>s.o17.tables[0].entries[0].streamWatcomOffset=123,/ANITAB source stream/);
 await refuse('missing descriptor part',s=>s.o17.tables[0].frameTargets[0].descriptorOffsets[0]=99999,/original frame-part descriptor/);
 await refuse('fabricated native loop',s=>s.o17.tables[0].streams[0].loopTargetWatcomOffset=999,/source graph loop/);
 await refuse('inferred source geometry',s=>s.o17.tables[0].descriptors[0].width=3,/O17 original descriptor changed/);
 await refuse('wrong source transparency',s=>s.o18.descriptors[0].decode.opaquePixelCount=4,/original source opacity evidence/);
 await refuse('forged O60 checksum',s=>s.o18.descriptors[0].decode.checksum='invalid',/original resource geometry or decoded checksum/);
 await refuse('duplicate frame source id',s=>s.o17.tables[0].frameTargets.push(s.o17.tables[0].frameTargets[0]),/duplicate offset/);
 await refuse('unsupported frame termination',s=>s.o17.tables[0].streams[1].events.at(-1).kind='flip-multi',/END event/);
 assert.equal(rejects,15);
 console.log(JSON.stringify({pass:'P65_SOURCE',status:'PASS',syntheticFalseEvidenceRejected:rejects,
  originalDescriptorIndexAndMaskBytesIdentical:true,joinedSourceStreams:514,
  validatedTableEntries:739,referencedDescriptorRecords:1102,sourceOnly:true,
  nativeRuntimeTimingOrPaletteClaimed:false},null,2));
})().catch(error=>{console.error(error.stack||error);process.exitCode=1;});
