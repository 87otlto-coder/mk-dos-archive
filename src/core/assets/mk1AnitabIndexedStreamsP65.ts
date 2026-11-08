/**
 * P65 — MK1 authenticated ANITAB stream source and original indexed frame planes.
 * Joins existing O17 source grammar, O18 original decoded descriptors and O60
 * indexed binary, without interpreting native FPS, palette or runtime playback.
 * All original O60 indexed bytes are copied unchanged; no decoded art in Git.
 */
import type { MK1FighterAnimationTableComparisonReport } from '../../games/mk1/research/fighterAnimationTableComparison';
import type { MK1AnimationResourceDecodeCensusReport } from '../../games/mk1/research/animationResourceDecodeCensus';
import { parseAnimationStoreZip } from '../../games/mk1/research/browserAnimationExportBundleValidation';
import { buildStoredZip } from '../research/researchArtifactDownloads';
import { hash, utf8 } from './model';

const CANONICAL_EXE='750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14';
export const MK1_P65_PACKAGE='MK1_P65_INDEXED_ANITAB_SOURCE_STREAMS.zip';

type O17=MK1FighterAnimationTableComparisonReport;
type O18=MK1AnimationResourceDecodeCensusReport;
type Desc=O18['descriptors'][number];
type Table=O17['tables'][number];
type Event=Table['streams'][number]['events'][number];

export interface MK1P65Result {
  name: typeof MK1_P65_PACKAGE;
  bytes: Uint8Array;
  report: {status:'VERIFIED';originalTables:8;originalTableEntries:739;
    uniqueSourceStreams:514;indexedDescriptors:1102;sourceFrameEvents:number;
    executableSourceSha256:string; originalIndexedBytesPreserved:true;
    nativePaletteOrFrameTimingAsserted:false};
}

function demand(ok:unknown, reason:string): asserts ok {
  if (!ok) throw new Error('P65 original indexed stream export: '+reason);
}
function u8Equal(a:Uint8Array,b:Uint8Array){
  return a.length===b.length&&a.every((v,i)=>v===b[i]);
}
function key(tab:string,offset:number){return tab+':'+offset;}
function exact<T>(map:ReadonlyMap<string,T>,k:string,label:string):T{
  const value=map.get(k);demand(value!==undefined,label+' '+k);return value;
}
function checkedSortedOffset<T extends {watcomOffset:number}>(arr:readonly T[],label:string){
  const offsets=new Set<number>();
  for(const row of arr){
    demand(Number.isSafeInteger(row.watcomOffset)&&row.watcomOffset>=0,label+' offset');
    demand(!offsets.has(row.watcomOffset),label+' duplicate offset');
    offsets.add(row.watcomOffset);
  }
}

/** Original caller passes only canonical, verified O17/O18 and O60. */
export async function buildMK1IndexedAnimationStreamsP65(
  o17:O17, o18:O18, originalO60Zip:Uint8Array,
):Promise<MK1P65Result>{
  demand(o17.status==='SUCCESS'&&o17.validation.allChecksPassed&&
    o17.commandGrammar.verifiedAgainstCanonicalExecutable&&
    o17.decision.boundedMK1AnitabExportMechanismEstablished,
    'unverified original executable animation grammar');
  demand(o18.status==='SUCCESS'&&o18.validation.allChecksPassed&&
    o18.decision.allO17DescriptorsResourceBackedAndDecodable,
    'unverified original sprite descriptor decoding');
  demand(o17.provenance.sha256===CANONICAL_EXE&&o18.provenance.sha256===CANONICAL_EXE,
    'canonical original MK1.EXE SHA-256');
  demand(o17.tables.length===8&&o18.descriptors.length===1102,
    'canonical ANITAB table and descriptor counts');
  demand(o17.crossTable.totalUniqueStreamStartsAcrossTables===514&&
    o17.crossTable.totalUniqueDescriptorsAcrossTables===1102,
    'canonical structural stream and descriptor census');
  demand(o17.tables.reduce((n,t)=>n+t.entries.length,0)===739,
    'canonical table entry count');

  const z=parseAnimationStoreZip(originalO60Zip);
  const originalManifest=z.get('indexed/descriptor_manifest.json')?.bytes;
  const originalPixels=z.get('indexed/descriptor_pixels.bin')?.bytes;
  demand(originalManifest instanceof Uint8Array&&originalPixels instanceof Uint8Array,
    'O60 original indexed payload and manifest must be present');
  const decoded=JSON.parse(new TextDecoder().decode(originalManifest)) as {
    format:string;descriptorCount:number;binaryFile:string;
    descriptors:Array<{tableSymbol:string;descriptorWatcomOffset:number;
      resourcePath:string;graOffset:number;width:number;height:number;
      x:number;y:number;decodeChecksum:string;
      indicesOffset:number;maskOffset:number;pixelCount:number}>;
  };
  demand(decoded.format==='mk1_animation_indexed_descriptor_payload_manifest_v1'&&
    decoded.descriptorCount===1102&&decoded.descriptors.length===1102&&
    decoded.binaryFile==='descriptor_pixels.bin','O60 original indexed manifest identity');
  const byOriginal=new Map<string,Desc>();
  for(const d of o18.descriptors){
    const k=key(d.tableSymbol,d.watcomOffset);
    demand(!byOriginal.has(k),'duplicate O18 original descriptor');
    byOriginal.set(k,d);
  }
  const byPixels=new Map<string,typeof decoded.descriptors[number]>();
  let cursor=0;
  for(const row of decoded.descriptors){
    const k=key(row.tableSymbol,row.descriptorWatcomOffset);
    demand(!byPixels.has(k),'duplicate O60 indexed descriptor');
    const original=exact(byOriginal,k,'O18 source descriptor missing');
    demand(row.resourcePath===original.resourcePath&&row.graOffset===original.graOffset&&
      row.width===original.width&&row.height===original.height&&
      row.x===original.x&&row.y===original.y&&
      row.decodeChecksum===original.decode.checksum,
      'original resource geometry or decoded checksum mismatch '+k);
    demand(Number.isSafeInteger(row.width)&&row.width>0&&
      Number.isSafeInteger(row.height)&&row.height>0&&
      row.pixelCount===row.width*row.height,
      'original indexed descriptor geometry '+k);
    demand(row.indicesOffset===cursor&&row.maskOffset===cursor+row.pixelCount&&
      row.maskOffset+row.pixelCount<=originalPixels.length,
      'noncontiguous or truncated O60 original index and paint-mask planes '+k);
    let opaque=0;
    for(let j=0;j<row.pixelCount;j++){
      const m=originalPixels[row.maskOffset+j];
      demand(m===0||m===1,'nonbinary original transparency mask '+k);
      if(m)opaque++;
    }
    demand(opaque===original.decode.opaquePixelCount,'original source opacity evidence '+k);
    cursor=row.maskOffset+row.pixelCount;
    byPixels.set(k,row);
  }
  demand(cursor===originalPixels.length&&byPixels.size===byOriginal.size,
    'indexed original binary not fully accounted for');

  let frameEvents=0;
  const uniqueStreams=new Set<number>();
  const tables=o17.tables.map(table=>{
    checkedSortedOffset(table.streams,'O17 ANITAB stream');
    checkedSortedOffset(table.frameTargets,'O17 frame target');
    checkedSortedOffset(table.descriptors,'O17 table descriptor');
    const frames=new Map(table.frameTargets.map(x=>[x.watcomOffset,x]));
    const tableStreams=new Map(table.streams.map(x=>[x.watcomOffset,x]));
    const tableDescriptors=new Map(table.descriptors.map(x=>[x.watcomOffset,x]));
    for(const d of table.descriptors){
      const rec=exact(byPixels,key(table.symbol,d.watcomOffset),'original O60 table descriptor');
      demand(d.width===rec.width&&d.height===rec.height&&d.graOffset===rec.graOffset&&
        d.resourcePath===rec.resourcePath&&d.x===rec.x&&d.y===rec.y,
        'O17 original descriptor changed');
    }
    const tableEntries=table.entries.map((entry,ordinal)=>{
      demand(entry.index===ordinal&&entry.cellWatcomOffset===table.watcomStart+4*ordinal,
        'original ANITAB cell order or pointer');
      if(entry.streamWatcomOffset!==null)
        demand(tableStreams.has(entry.streamWatcomOffset),
          'ANITAB source stream reference unresolved');
      if(entry.descriptorWatcomOffset!==null)
        demand(tableDescriptors.has(entry.descriptorWatcomOffset),
          'ANITAB direct source descriptor reference unresolved');
      return {index:entry.index,cellWatcomOffset:entry.cellWatcomOffset,
        rawValue:entry.rawValue,classification:entry.classification,
        confidence:entry.confidence,
        sourceStreamWatcomOffset:entry.streamWatcomOffset,
        sourceDescriptorKey:entry.descriptorWatcomOffset===null?null:
          key(table.symbol,entry.descriptorWatcomOffset),
        canonicalGameplayName:null};
    });
    const streams=table.streams.map(stream=>{
      uniqueStreams.add(stream.watcomOffset);
      demand(stream.termination==='END'||stream.termination==='LOOP',
        'original source stream termination');
      const events=stream.events.map((ev:Event,eventOrdinal:number)=>{
        if(ev.kind!=='frame')return {eventOrdinal,...ev};
        const target=frames.get(ev.frameTargetWatcomOffset);
        demand(target,'original stream frame target missing');
        demand(target.partCount===target.descriptorOffsets.length&&
          target.descriptorOffsets.length>0,
          'original frame-target multipart count');
        for(const descOff of target.descriptorOffsets){
          demand(tableDescriptors.has(descOff),
            'original frame-part descriptor not present in table');
          exact(byPixels,key(table.symbol,descOff),'original indexed frame part');
        }
        frameEvents++;
        return {eventOrdinal,...ev,
          sourceFrameTargetMode:target.mode,
          sourceFramePartDescriptorKeys:target.descriptorOffsets.map(offset=>key(table.symbol,offset)),
          sourceFramePartOrder:'SOURCE_DESCRIPTOR_VECTOR_ONLY',
          frameTimingMilliseconds:null,nativePaletteSelected:null,
          runtimeCompositionVerified:false};
      });
      demand(events.length===stream.events.length,'all source control commands preserved');
      if(stream.termination==='END')
        demand(stream.loopTargetWatcomOffset===null&&stream.events.at(-1)?.kind==='end',
          'END event and original terminal marker');
      else demand(Number.isSafeInteger(stream.loopTargetWatcomOffset)&&
          stream.events.some(ev=>ev.watcomOffset===stream.loopTargetWatcomOffset),
        'source graph loop must target an observed instruction');
      return {sourceStreamWatcomOffset:stream.watcomOffset,
        sourceStreamPhysicalStart:stream.physicalStart,
        sourceStreamConfidence:stream.confidence,
        termination:stream.termination,
        loopTargetWatcomOffset:stream.loopTargetWatcomOffset,
        frameTargetMode:stream.frameTargetMode,events,
        sourceInstructionEncounterOrderOnly:true,nativeRuntimeTraversalVerified:false};
    });
    return {symbol:table.symbol,moduleName:table.moduleName,tableWatcomStart:table.watcomStart,
      originalTableEntryCount:table.entries.length,
      entries:tableEntries,sourceStreams:streams};
  });
  demand(uniqueStreams.size===514,'canonical unique executable stream count');
  const manifest={
    format:'mk1_p65_lossless_anitab_source_streams_v1',
    originalExeSha256:CANONICAL_EXE,
    sourceExecutablePath:o17.fixture.exePath,
    originalExeStaticDataFileBase:o17.coordinateModel.staticDataBase,
    sourceTableCount:tables.length,
    originalTableEntries:739,
    uniqueSourceExecutableStreams:uniqueStreams.size,
    tableLocalFrameInstructionOccurrences:frameEvents,
    indexedDescriptorCount:decoded.descriptorCount,
    originalIndexedBinaryByteLength:originalPixels.length,
    originalIndexedBinarySha256:await hash(originalPixels),
    originalIndexedManifestSha256:await hash(originalManifest),
    originalIndexedBinaryPath:'indexed/descriptor_pixels.bin',
    originalIndexedManifestPath:'indexed/descriptor_manifest.json',
    sourceFrameOrderMeaning:'ORIGINAL_EXECUTABLE_INSTRUCTION_ENCOUNTER_ORDER_NOT_NATIVE_RUNTIME_PLAYBACK',
    originalDescriptorPartOrderMeaning:'ORIGINAL_FRAME_TARGET_VECTOR_ORDER_NOT_RUNTIME_Z_ORDER',
    sourceTableEntriesRetainUnknownScalars:true,
    originalPalettesNotAssigned:true,
    nativeAnimationMillisecondsVerified:false,
    nativeLoopPeriodsVerified:false,
    gameplayEventNamesVerified:false,
    worldPlacementAndStageCompositionVerified:false,
    zeroAdditionalAssetRepresentations:true,
    tables,
  };
  const readme=`MK1 P65 original executable ANITAB source streams + original indexed descriptors

This ZIP joins authenticated O17 ANITAB structural instruction streams with the exact
existing O60 original indexed descriptor binaries and original source geometry.
Each frame command points to sourceFramePartDescriptorKeys; find each key in
indexed/descriptor_manifest.json (tableSymbol:descriptorWatcomOffset), then read
pixelCount original indices and mask bytes from the offsets in
indexed/descriptor_pixels.bin. Frame parts are never flattened or recolored.

Source instruction encounter order is NOT observed gameplay playback order;
jump controls may change traversal, loops have no verified wall-clock period.
Frame vector part order does NOT establish compositor Z ordering.
No universal native DAC palette, FPS, animation name, scene position, or stage
relationship is invented. Null frame timing/palette is intentional.
`;
  const name=MK1_P65_PACKAGE;
  const bytes=buildStoredZip([
    {name:'manifests/mk1_source_streams.json',bytes:utf8.encode(JSON.stringify(manifest,null,2)+'\n')},
    {name:'indexed/descriptor_manifest.json',bytes:originalManifest},
    {name:'indexed/descriptor_pixels.bin',bytes:originalPixels},
    {name:'README.txt',bytes:utf8.encode(readme)},
  ]);
  const parsed=parseAnimationStoreZip(bytes);
  demand(parsed.size===4,'P65 archive has exactly four verified source entries');
  demand(u8Equal(parsed.get('indexed/descriptor_manifest.json')!.bytes,originalManifest)&&
    u8Equal(parsed.get('indexed/descriptor_pixels.bin')!.bytes,originalPixels),
    'O60 original indexed payload must be copied byte-for-byte');
  return {name,bytes,report:{status:'VERIFIED',originalTables:8,
    originalTableEntries:739,uniqueSourceStreams:514,indexedDescriptors:1102,
    sourceFrameEvents:frameEvents,executableSourceSha256:CANONICAL_EXE,
    originalIndexedBytesPreserved:true,nativePaletteOrFrameTimingAsserted:false}};
}
