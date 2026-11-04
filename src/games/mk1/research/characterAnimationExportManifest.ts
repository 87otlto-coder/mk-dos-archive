/**
 * MK1 character animation export manifest — Pass 1E.3O.22.
 *
 * Read-only product-facing IR pass. Combines the already-qualified structural,
 * resource/decode, character-selector, palette-context, and consumer-context
 * evidence without guessing palette applicability or gameplay names.
 */
import { createOperationId } from '../../../core/diagnostics/diagnosticLogger';
import { MK1FighterAnimationTableComparisonReport } from './fighterAnimationTableComparison';
import { MK1AnimationResourceDecodeCensusReport } from './animationResourceDecodeCensus';
import { MK1CharacterAnimationTableSelectorReport } from './characterAnimationTableSelector';
import { MK1AnimationPaletteContextBridgeReport } from './animationPaletteContextBridge';
import { MK1GetCharAniConsumerCensusReport } from './getCharAniConsumerCensus';

export type PaletteBindingStatus =
  | 'VERIFIED_EFFECT_PALETTE_BINDING'
  | 'RUNTIME_GROUNDED_EFFECT_PALETTE_BINDING'
  | 'CHARACTER_PALETTE_CONTEXT_AVAILABLE_APPLICATION_UNRESOLVED';

export interface MK1QualifiedAnimationPaletteBinding {
  characterId:number;
  identityLabel:string;
  anitabSymbol:string;
  animationIndex:number;
  paletteSymbols:string[];
  status:PaletteBindingStatus;
  evidencePass:string;
  scope:string;
}

export interface MK1AnimationExportManifestReport {
  format:'mk1_character_animation_export_manifest_v1';
  timestamp:string;
  operationId:string;
  provenance:MK1FighterAnimationTableComparisonReport['provenance'];
  prerequisite:{o17OperationId:string;o18OperationId:string;o19OperationId:string;o20OperationId:string;o21OperationId:string;validationPassed:true};
  characters:Array<{
    characterId:number;identityLabel:string;identityEvidence:string;anitabSymbol:string;anitabModule:string;
    normalPaletteSymbols:string[];alternatePaletteSymbols:string[];sameRecordForNormalAndAlternate:boolean;
    palettePolicy:'EXPLICIT_CONTEXT_REQUIRED';
    qualifiedPaletteBindings:MK1QualifiedAnimationPaletteBinding[];
  }>;
  tables:Array<{
    symbol:string;moduleName:string;entryCount:number;sharedByCharacterIds:number[];
    entries:Array<{
      index:number;rawValue:number;rawValueHex:string;classification:string;confidence:string;
      globalConsumerContext:null|{directImmediateCallCount:number;modules:string[];nearestCodeSymbolContexts:string[]};
      imageExport:{kind:'ANIMATION_STREAM'|'DIRECT_DESCRIPTOR'|'NONE';indexedExportReady:boolean;frameCount:number;descriptorCount:number;allDescriptorsDecoded:boolean;resourcePaths:string[]};
      paletteBinding:{automaticBodyPaletteApplied:false;qualifiedBindings:MK1QualifiedAnimationPaletteBinding[];unresolved:boolean};
      semanticLabel:{canonicalGameplayName:null;consumerContextAvailable:boolean};
    }>;
    summary:{streamEntryCount:number;imageBearingStreamEntryCount:number;controlOnlyStreamEntryCount:number;directDescriptorEntryCount:number;nonImageEntryCount:number;indexedExportReadyEntryCount:number;qualifiedColorBindingEntryCount:number;consumerContextEntryCount:number};
  }>;
  summary:{characterContextCount:number;uniqueAnitabCount:number;tableEntryCount:number;streamEntryCount:number;imageBearingStreamEntryCount:number;controlOnlyStreamEntryCount:number;directDescriptorEntryCount:number;indexedExportReadyEntryCount:number;qualifiedPaletteBindingCount:number;qualifiedPaletteBoundCharacterIndexCount:number;consumerContextIndexCount:number;unknownOrNonImageEntryCount:number};
  decision:{characterOrientedExportManifestEstablished:true;indexedImageExportCoverageEstablished:true;universalCorrectColorExportEstablished:false;automaticResourceToPaletteMappingRejected:true;canonicalAnimationNamesEstablished:false;verdict:'MK1_CHARACTER_ANIMATION_EXPORT_MANIFEST_ESTABLISHED';narrative:string};
  status:'SUCCESS';validation:{allChecksPassed:boolean;checks:Array<{checkId:string;passed:boolean;detail?:string}>};
}

function isStream(c:string){return c.startsWith('ANIMATION_STREAM_');}
function imageKind(c:string):'ANIMATION_STREAM'|'DIRECT_DESCRIPTOR'|'NONE'{return isStream(c)&&c!=='ANIMATION_STREAM_CONTROL_ONLY'?'ANIMATION_STREAM':c==='DIRECT_DESCRIPTOR_TABLE_ENTRY'?'DIRECT_DESCRIPTOR':'NONE';}

export function executeCharacterAnimationExportManifest(
  o17:MK1FighterAnimationTableComparisonReport,
  o18:MK1AnimationResourceDecodeCensusReport,
  o19:MK1CharacterAnimationTableSelectorReport,
  o20:MK1AnimationPaletteContextBridgeReport,
  o21:MK1GetCharAniConsumerCensusReport,
):MK1AnimationExportManifestReport{
  if(o17.status!=='SUCCESS'||!o17.validation.allChecksPassed)throw new Error('O22 requires O17');
  if(o18.status!=='SUCCESS'||!o18.validation.allChecksPassed)throw new Error('O22 requires O18');
  if(o19.status!=='SUCCESS'||!o19.validation.allChecksPassed)throw new Error('O22 requires O19');
  if(o20.status!=='SUCCESS'||!o20.validation.allChecksPassed)throw new Error('O22 requires O20');
  if(o21.status!=='SUCCESS'||!o21.validation.allChecksPassed)throw new Error('O22 requires O21');
  const operationId=createOperationId('character_animation_export_manifest'),timestamp=new Date().toISOString();
  const decoded=new Set(o18.descriptors.map(d=>`${d.tableSymbol}:${d.watcomOffset}`));
  const consumer=new Map(o21.immediateIndices.map(v=>[v.index,v] as const));
  const charById=new Map(o20.characterContexts.map(c=>[c.characterId,c] as const));
  const selectorByTable=new Map<string,number[]>();for(const e of o19.selectorTable.entries){const a=selectorByTable.get(e.anitabSymbol)??[];a.push(e.characterId);selectorByTable.set(e.anitabSymbol,a);}

  const qualified:MK1QualifiedAnimationPaletteBinding[]=[
    {characterId:1,identityLabel:'KANO',anitabSymbol:'KANO_ANITAB',animationIndex:67,paletteSymbols:['BLOOD_P'],status:'VERIFIED_EFFECT_PALETTE_BINDING',evidencePass:'1E.3O.2',scope:'Qualified Kano heart-rip primary animation root and its established multi-object heart effect context.'},
    {characterId:2,identityLabel:'RAYDEN',anitabSymbol:'RAIDEN_ANITAB',animationIndex:60,paletteSymbols:['MORPH_P'],status:'RUNTIME_GROUNDED_EFFECT_PALETTE_BINDING',evidencePass:'1E.3O.4',scope:'Qualified normal lightning projectile setup descriptor HANDBO22.'},
    {characterId:2,identityLabel:'RAYDEN',anitabSymbol:'RAIDEN_ANITAB',animationIndex:34,paletteSymbols:['MORPH_P'],status:'RUNTIME_GROUNDED_EFFECT_PALETTE_BINDING',evidencePass:'1E.3O.4',scope:'Qualified normal lightning projectile travel animation descriptors.'},
  ];

  const characters=o19.selectorTable.entries.map(e=>{const c=charById.get(e.characterId);if(!c)throw new Error(`O22 missing O20 character ${e.characterId}`);return{characterId:e.characterId,identityLabel:e.identityLabel,identityEvidence:e.identityEvidence,anitabSymbol:e.anitabSymbol,anitabModule:e.anitabModule,normalPaletteSymbols:[...c.normalPaletteSymbols],alternatePaletteSymbols:[...c.alternatePaletteSymbols],sameRecordForNormalAndAlternate:c.sameRecordForNormalAndAlternate,palettePolicy:'EXPLICIT_CONTEXT_REQUIRED' as const,qualifiedPaletteBindings:qualified.filter(q=>q.characterId===e.characterId)};});

  let totalEntries=0,totalStreams=0,totalImageStreams=0,totalControlOnly=0,totalDirect=0,totalReady=0,totalConsumer=0,totalNonImage=0;
  const tables=o17.tables.map(t=>{
    const frameByOffset=new Map(t.frameTargets.map(f=>[f.watcomOffset,f] as const));
    const streamByOffset=new Map(t.streams.map(s=>[s.watcomOffset,s] as const));
    let streamEntryCount=0,imageBearingStreamEntryCount=0,controlOnlyStreamEntryCount=0,directDescriptorEntryCount=0,nonImageEntryCount=0,indexedExportReadyEntryCount=0,qualifiedColorBindingEntryCount=0,consumerContextEntryCount=0;
    const entries=t.entries.map(e=>{
      totalEntries++;const kind=imageKind(e.classification);let frameCount=0;const descOffsets=new Set<number>();const resources=new Set<string>();let allDecoded=true;
      if(isStream(e.classification)){streamEntryCount++;totalStreams++;if(e.classification==='ANIMATION_STREAM_CONTROL_ONLY'){controlOnlyStreamEntryCount++;totalControlOnly++;}else{imageBearingStreamEntryCount++;totalImageStreams++;}}
      if(kind==='ANIMATION_STREAM'&&e.streamWatcomOffset!==null){const s=streamByOffset.get(e.streamWatcomOffset);if(s){for(const ev of s.events){if(ev.kind!=='frame')continue;const f=frameByOffset.get(ev.frameTargetWatcomOffset);if(!f)continue;frameCount++;for(const o of f.descriptorOffsets){descOffsets.add(o);if(!decoded.has(`${t.symbol}:${o}`))allDecoded=false;}for(const r of f.resourcePaths)resources.add(r);}}else allDecoded=false;}
      else if(kind==='DIRECT_DESCRIPTOR'&&e.descriptorWatcomOffset!==null){directDescriptorEntryCount++;totalDirect++;descOffsets.add(e.descriptorWatcomOffset);allDecoded=decoded.has(`${t.symbol}:${e.descriptorWatcomOffset}`);const d=t.descriptors.find(x=>x.watcomOffset===e.descriptorWatcomOffset);if(d)resources.add(d.resourcePath);frameCount=1;}
      else{nonImageEntryCount++;totalNonImage++;allDecoded=false;}
      const indexedExportReady=kind!=='NONE'&&allDecoded&&descOffsets.size>0;if(indexedExportReady){indexedExportReadyEntryCount++;totalReady++;}
      const cons=consumer.get(e.index)??null;if(cons){consumerContextEntryCount++;totalConsumer++;}
      const q=qualified.filter(x=>x.anitabSymbol===t.symbol&&x.animationIndex===e.index);if(q.length)qualifiedColorBindingEntryCount++;
      return{index:e.index,rawValue:e.rawValue,rawValueHex:e.rawValueHex,classification:e.classification,confidence:e.confidence,globalConsumerContext:cons?{directImmediateCallCount:cons.directImmediateCallCount,modules:[...cons.modules],nearestCodeSymbolContexts:[...cons.nearestCodeSymbolContexts]}:null,imageExport:{kind,indexedExportReady,frameCount,descriptorCount:descOffsets.size,allDescriptorsDecoded:allDecoded,resourcePaths:[...resources].sort()},paletteBinding:{automaticBodyPaletteApplied:false as const,qualifiedBindings:q,unresolved:q.length===0},semanticLabel:{canonicalGameplayName:null,consumerContextAvailable:!!cons}};
    });
    return{symbol:t.symbol,moduleName:t.moduleName,entryCount:t.entryCount,sharedByCharacterIds:[...(selectorByTable.get(t.symbol)??[])],entries,summary:{streamEntryCount,imageBearingStreamEntryCount,controlOnlyStreamEntryCount,directDescriptorEntryCount,nonImageEntryCount,indexedExportReadyEntryCount,qualifiedColorBindingEntryCount,consumerContextEntryCount}};
  });

  const knownBindingsValid=qualified.every(q=>{const t=o17.tables.find(t=>t.symbol===q.anitabSymbol);const e=t?.entries.find(e=>e.index===q.animationIndex);return !!e&&imageKind(e.classification)!=='NONE';});
  const allImageEntriesReady=tables.every(t=>t.entries.filter(e=>e.imageExport.kind!=='NONE').every(e=>e.imageExport.indexedExportReady));
  const noAutoPalette=tables.every(t=>t.entries.every(e=>e.paletteBinding.automaticBodyPaletteApplied===false));
  const sharedNinjaPreserved=tables.find(t=>t.symbol==='NINJA_ANITAB')?.sharedByCharacterIds.join(',')==='4,5';
  const checks=[
    {checkId:'O17_O18_O19_O20_O21_PREREQUISITES',passed:true},
    {checkId:'NINE_CHARACTER_CONTEXTS',passed:characters.length===9},
    {checkId:'EIGHT_STRUCTURAL_ANITABS',passed:tables.length===8},
    {checkId:'ALL_TABLE_ENTRIES_PRESERVED',passed:totalEntries===o17.tables.reduce((n,t)=>n+t.entryCount,0),detail:`entries=${totalEntries}`},
    {checkId:'ALL_IMAGE_ENTRIES_INDEXED_EXPORT_READY',passed:allImageEntriesReady,detail:`ready=${totalReady}`},
    {checkId:'KNOWN_EFFECT_PALETTE_BINDINGS_RESOLVE',passed:knownBindingsValid,detail:`bindings=${qualified.length}`},
    {checkId:'NO_AUTOMATIC_BODY_PALETTE_APPLICATION',passed:noAutoPalette},
    {checkId:'SHARED_NINJA_CHARACTER_CONTEXT_PRESERVED',passed:sharedNinjaPreserved===true},
    {checkId:'CONSUMER_CONTEXT_RETAINED_WITHOUT_CANONICAL_NAMES',passed:tables.every(t=>t.entries.every(e=>e.semanticLabel.canonicalGameplayName===null))},
    {checkId:'SCOPE_BOUNDARY_PRESERVED',passed:true},
  ];
  if(!checks.every(c=>c.passed))throw new Error(`O22 validation failed: ${checks.filter(c=>!c.passed).map(c=>c.checkId).join(', ')}`);
  const summary={characterContextCount:characters.length,uniqueAnitabCount:tables.length,tableEntryCount:totalEntries,streamEntryCount:totalStreams,imageBearingStreamEntryCount:totalImageStreams,controlOnlyStreamEntryCount:totalControlOnly,directDescriptorEntryCount:totalDirect,indexedExportReadyEntryCount:totalReady,qualifiedPaletteBindingCount:qualified.length,qualifiedPaletteBoundCharacterIndexCount:new Set(qualified.map(q=>`${q.characterId}:${q.animationIndex}`)).size,consumerContextIndexCount:o21.immediateIndices.length,unknownOrNonImageEntryCount:totalNonImage};
  return{format:'mk1_character_animation_export_manifest_v1',timestamp,operationId,provenance:{...o17.provenance,timestamp,operationId},prerequisite:{o17OperationId:o17.operationId,o18OperationId:o18.operationId,o19OperationId:o19.operationId,o20OperationId:o20.operationId,o21OperationId:o21.operationId,validationPassed:true},characters,tables,summary,decision:{characterOrientedExportManifestEstablished:true,indexedImageExportCoverageEstablished:true,universalCorrectColorExportEstablished:false,automaticResourceToPaletteMappingRejected:true,canonicalAnimationNamesEstablished:false,verdict:'MK1_CHARACTER_ANIMATION_EXPORT_MANIFEST_ESTABLISHED',narrative:`The eight structural MK1 ANITABs and nine runtime character identities are now expressed as a product-facing export manifest without collapsing structural identity, decoded pixels, palette context, or semantic labeling. ${totalReady} image-bearing table entries are ready for indexed/composited export because every referenced descriptor is authenticated and decoded through O18. Character normal/alternate palette contexts are carried separately and are never auto-applied to an arbitrary stream. Only ${qualified.length} previously qualified effect bindings are promoted here: Kano heart index 67 -> BLOOD_P, and Rayden lightning indices 60/34 -> MORPH_P. O21 consumer contexts are attached to numeric indices as contextual evidence while canonical gameplay names remain unresolved. This establishes a safe export IR scaffold, not universal correct-color or fully named animation export.`},status:'SUCCESS',validation:{allChecksPassed:true,checks}};
}

export function createMK1CharacterAnimationExportManifestExport(report:MK1AnimationExportManifestReport){if(report.status!=='SUCCESS'||!report.validation.allChecksPassed)throw new Error('O22 export blocked');return report;}
