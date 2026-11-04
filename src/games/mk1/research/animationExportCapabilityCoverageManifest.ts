/** MK1 animation export capability / coverage manifest — Pass 1E.3O.59. */
import { createOperationId } from '../../../core/diagnostics/diagnosticLogger';
import { MK1AnimationResourceDecodeCensusReport } from './animationResourceDecodeCensus';
import { MK1AnimationExportManifestReport } from './characterAnimationExportManifest';
import { MK1VerifiedPaletteBoundExportFixturesReport } from './verifiedPaletteBoundExportFixtures';
import { MK1CharacterPaletteContextVariantRendererReport } from './characterPaletteContextVariantRenderer';
import { MK1PaletteBindingExceptionCensusReport } from './paletteBindingExceptionCensus';
import { MK1AnimationStreamControlTimingCensusReport } from './animationStreamControlTimingCensus';

const CANONICAL_SHA='750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14';

export type MK1AnimationExportTier =
  | 'INDEXED_STRUCTURAL_EXPORT_READY'
  | 'EXPLICIT_CHARACTER_CONTEXT_RGBA_AVAILABLE'
  | 'VERIFIED_EFFECT_RGBA_AVAILABLE'
  | 'PALETTE_BINDING_UNRESOLVED_INDEXED_ONLY';

export interface MK1AnimationExportCapabilityCoverageManifestReport {
  format:'mk1_animation_export_capability_coverage_manifest_v1';
  timestamp:string; operationId:string;
  provenance:MK1AnimationResourceDecodeCensusReport['provenance'];
  prerequisite:{o18OperationId:string;o22OperationId:string;o23OperationId:string;o24OperationId:string;o25OperationId:string;o26OperationId:string;validationPassed:true};
  tiers:{
    indexedStructural:{tier:'INDEXED_STRUCTURAL_EXPORT_READY';anitabCount:number;tableEntryCount:number;indexedExportReadyEntryCount:number;uniqueDescriptorCount:number;resourceCount:number;paletteRequiredForCorrectColor:boolean};
    characterContextRgba:{tier:'EXPLICIT_CHARACTER_CONTEXT_RGBA_AVAILABLE';characterContextCount:number;distinctPaletteVariantCount:number;dominantResourceDescriptorCount:number;renderedDescriptorVariantCount:number;automaticPerAnimationPaletteBinding:false};
    verifiedEffectRgba:{tier:'VERIFIED_EFFECT_RGBA_AVAILABLE';rgbaPayloadCount:number;heartSequenceOccurrenceCount:number;lightningSpriteCount:number;paletteBindings:string[]};
    unresolvedPaletteExceptions:{tier:'PALETTE_BINDING_UNRESOLVED_INDEXED_ONLY';descriptorCount:number;resourceCount:number;resources:Array<{resourcePath:string;descriptorCount:number}>;rgbaExportBlocked:true};
  };
  characters:Array<{
    characterId:number;identityLabel:string;anitabSymbol:string;tableEntryCount:number;indexedExportReadyEntryCount:number;
    dominantAnimationResource:string;dominantDescriptorCount:number;otherResourceDescriptorCount:number;
    normalPaletteSymbols:string[];alternatePaletteSymbols:string[];characterPaletteVariantCount:number;renderedDescriptorVariantCount:number;
    qualifiedEffectBindingCount:number;unresolvedCrossResourceDescriptorCount:number;
    availableTiers:MK1AnimationExportTier[];
  }>;
  timing:{uniqueStreamCount:number;ordinaryFrameEventCount:number;noSleepFrameEventCount:number;directMframewTailTransferCount:number;immediateDwellTransferCount:number;dynamicDwellTransferCount:number;absoluteTimeUnitEstablished:false;exportPolicy:'PRESERVE_STRUCTURAL_EVENTS_AND_CALLER_DWELL_UNITS_ONLY'};
  packageContract:{
    includeVerifiedEffectPngs:true;includeExplicitCharacterContextPngs:true;includeLosslessIndexedDescriptorPayloads:true;
    includeO18ResourceDecodeReport:true;includeO22CharacterManifest:true;includeO25ExceptionCensus:true;includeO26TimingReport:true;
    unresolvedPaletteDescriptorsMustNotReceiveGuessedRgba:true;canonicalGameplayAnimationNamesEstablished:false;
  };
  summary:{characterContextCount:number;uniqueAnitabCount:number;tableEntryCount:number;indexedExportReadyEntryCount:number;uniqueDescriptorCount:number;renderedCharacterContextDescriptorVariantCount:number;verifiedEffectRgbaPayloadCount:number;unresolvedCrossResourceDescriptorCount:number;uniqueStreamCount:number};
  decision:{animationExportCoverageManifestEstablished:true;universalCorrectColorAnimationExportEstablished:false;unresolvedPaletteBindingsPreserved:true;absoluteWallClockTimingEstablished:false;verdict:'MK1_ANIMATION_EXPORT_CAPABILITY_COVERAGE_MANIFEST_ESTABLISHED';narrative:string};
  status:'SUCCESS'; validation:{allChecksPassed:boolean;checks:Array<{checkId:string;passed:boolean;detail?:string}>};
}

export function executeAnimationExportCapabilityCoverageManifest(
  o18:MK1AnimationResourceDecodeCensusReport,
  o22:MK1AnimationExportManifestReport,
  o23:MK1VerifiedPaletteBoundExportFixturesReport,
  o24:MK1CharacterPaletteContextVariantRendererReport,
  o25:MK1PaletteBindingExceptionCensusReport,
  o26:MK1AnimationStreamControlTimingCensusReport,
):MK1AnimationExportCapabilityCoverageManifestReport{
  for(const [name,r] of [['O18',o18],['O22',o22],['O23',o23],['O24',o24],['O25',o25],['O26',o26]] as const){
    if(r.status!=='SUCCESS'||!r.validation.allChecksPassed||r.provenance.sha256!==CANONICAL_SHA)throw new Error(`O59 requires canonical verified ${name}`);
  }
  const tableBySymbol=new Map(o22.tables.map(t=>[t.symbol,t] as const));
  const contextByCharacter=new Map(o24.contexts.map(c=>[c.characterId,c] as const));
  const unresolvedByTable=new Map<string,number>();
  for(const d of o25.crossResourceDescriptors.filter(d=>d.paletteStatus==='UNRESOLVED_CROSS_RESOURCE_PALETTE'))unresolvedByTable.set(d.tableSymbol,(unresolvedByTable.get(d.tableSymbol)??0)+1);
  const characters=o22.characters.map(c=>{
    const table=tableBySymbol.get(c.anitabSymbol); const context=contextByCharacter.get(c.characterId);
    if(!table||!context)throw new Error(`O59 missing table/context for character ${c.characterId}`);
    const unresolved=unresolvedByTable.get(c.anitabSymbol)??0;
    const tiers:MK1AnimationExportTier[]=['INDEXED_STRUCTURAL_EXPORT_READY','EXPLICIT_CHARACTER_CONTEXT_RGBA_AVAILABLE'];
    if(c.qualifiedPaletteBindings.length)tiers.push('VERIFIED_EFFECT_RGBA_AVAILABLE');
    if(unresolved)tiers.push('PALETTE_BINDING_UNRESOLVED_INDEXED_ONLY');
    return{characterId:c.characterId,identityLabel:c.identityLabel,anitabSymbol:c.anitabSymbol,tableEntryCount:table.entryCount,indexedExportReadyEntryCount:table.summary.indexedExportReadyEntryCount,dominantAnimationResource:context.dominantAnimationResource,dominantDescriptorCount:context.dominantDescriptorCount,otherResourceDescriptorCount:context.otherResourceDescriptorCount,normalPaletteSymbols:[...c.normalPaletteSymbols],alternatePaletteSymbols:[...c.alternatePaletteSymbols],characterPaletteVariantCount:context.paletteVariants.length,renderedDescriptorVariantCount:context.paletteVariants.reduce((n,v)=>n+v.renderedDescriptorCount,0),qualifiedEffectBindingCount:c.qualifiedPaletteBindings.length,unresolvedCrossResourceDescriptorCount:unresolved,availableTiers:tiers};
  });
  const unresolvedResources=o25.resourceSummary.filter(r=>r.unresolvedDescriptorCount>0).map(r=>({resourcePath:r.resourcePath,descriptorCount:r.unresolvedDescriptorCount}));
  const tiers={
    indexedStructural:{tier:'INDEXED_STRUCTURAL_EXPORT_READY' as const,anitabCount:o22.summary.uniqueAnitabCount,tableEntryCount:o22.summary.tableEntryCount,indexedExportReadyEntryCount:o22.summary.indexedExportReadyEntryCount,uniqueDescriptorCount:o18.summary.uniqueDescriptorCount,resourceCount:o18.summary.uniqueResourceCount,paletteRequiredForCorrectColor:true},
    characterContextRgba:{tier:'EXPLICIT_CHARACTER_CONTEXT_RGBA_AVAILABLE' as const,characterContextCount:o24.summary.characterContextCount,distinctPaletteVariantCount:o24.summary.distinctPaletteVariantCount,dominantResourceDescriptorCount:o24.summary.dominantResourceDescriptorCountAcrossUniqueTables,renderedDescriptorVariantCount:o24.summary.renderedDescriptorVariantCount,automaticPerAnimationPaletteBinding:false as const},
    verifiedEffectRgba:{tier:'VERIFIED_EFFECT_RGBA_AVAILABLE' as const,rgbaPayloadCount:o23.summary.rgbaPayloadCount,heartSequenceOccurrenceCount:o23.summary.heartSequenceOccurrenceCount,lightningSpriteCount:o23.summary.lightningSpriteCount,paletteBindings:[`${o23.heart.paletteSymbol}:KANO_HEART`,`${o23.lightning.paletteSymbol}:RAYDEN_LIGHTNING`]},
    unresolvedPaletteExceptions:{tier:'PALETTE_BINDING_UNRESOLVED_INDEXED_ONLY' as const,descriptorCount:o25.summary.unresolvedCrossResourceDescriptorCount,resourceCount:o25.summary.unresolvedCrossResourceResourceCount,resources:unresolvedResources,rgbaExportBlocked:true as const},
  };
  const timing={uniqueStreamCount:o26.summary.uniqueStreamCount,ordinaryFrameEventCount:o26.summary.ordinaryFrameEventCount,noSleepFrameEventCount:o26.summary.noSleepFrameEventCount,directMframewTailTransferCount:o26.summary.directMframewTailTransferCount,immediateDwellTransferCount:o26.summary.immediateDwellTransferCount,dynamicDwellTransferCount:o26.summary.dynamicDwellTransferCount,absoluteTimeUnitEstablished:false as const,exportPolicy:'PRESERVE_STRUCTURAL_EVENTS_AND_CALLER_DWELL_UNITS_ONLY' as const};
  const summary={characterContextCount:o24.summary.characterContextCount,uniqueAnitabCount:o22.summary.uniqueAnitabCount,tableEntryCount:o22.summary.tableEntryCount,indexedExportReadyEntryCount:o22.summary.indexedExportReadyEntryCount,uniqueDescriptorCount:o18.summary.uniqueDescriptorCount,renderedCharacterContextDescriptorVariantCount:o24.summary.renderedDescriptorVariantCount,verifiedEffectRgbaPayloadCount:o23.summary.rgbaPayloadCount,unresolvedCrossResourceDescriptorCount:o25.summary.unresolvedCrossResourceDescriptorCount,uniqueStreamCount:o26.summary.uniqueStreamCount};
  const checks=[
    {checkId:'CANONICAL_O18_O22_O23_O24_O25_O26_PREREQUISITES',passed:true},
    {checkId:'EIGHT_ANITABS',passed:summary.uniqueAnitabCount===8,detail:`count=${summary.uniqueAnitabCount}`},
    {checkId:'NINE_CHARACTER_CONTEXTS',passed:summary.characterContextCount===9,detail:`count=${summary.characterContextCount}`},
    {checkId:'ALL_739_TABLE_ENTRIES_PRESERVED',passed:summary.tableEntryCount===739,detail:`count=${summary.tableEntryCount}`},
    {checkId:'INDEXED_EXPORT_READY_ENTRY_SURFACE',passed:summary.indexedExportReadyEntryCount===592,detail:`count=${summary.indexedExportReadyEntryCount}`},
    {checkId:'ALL_1102_O18_DESCRIPTORS_PRESERVED',passed:summary.uniqueDescriptorCount===1102,detail:`count=${summary.uniqueDescriptorCount}`},
    {checkId:'O24_CHARACTER_CONTEXT_VARIANTS_PRESERVED',passed:summary.renderedCharacterContextDescriptorVariantCount===2263,detail:`count=${summary.renderedCharacterContextDescriptorVariantCount}`},
    {checkId:'O23_VERIFIED_EFFECT_PAYLOADS_PRESERVED',passed:summary.verifiedEffectRgbaPayloadCount===21,detail:`count=${summary.verifiedEffectRgbaPayloadCount}`},
    {checkId:'EXACT_79_UNRESOLVED_CROSS_RESOURCE_BINDINGS',passed:summary.unresolvedCrossResourceDescriptorCount===79,detail:`count=${summary.unresolvedCrossResourceDescriptorCount}`},
    {checkId:'O26_STREAM_SURFACE_PRESERVED',passed:summary.uniqueStreamCount===514,detail:`count=${summary.uniqueStreamCount}`},
    {checkId:'NO_GUESSED_RGBA_FOR_UNRESOLVED_BINDINGS',passed:tiers.unresolvedPaletteExceptions.rgbaExportBlocked},
    {checkId:'NO_WALL_CLOCK_PROMOTION',passed:!timing.absoluteTimeUnitEstablished},
    {checkId:'NO_CANONICAL_GAMEPLAY_NAME_PROMOTION',passed:o22.tables.every(t=>t.entries.every(e=>e.semanticLabel.canonicalGameplayName===null))},
    {checkId:'NO_WRITE_PATH',passed:true},
  ];
  if(!checks.every(c=>c.passed))throw new Error(`O59 validation failed: ${checks.filter(c=>!c.passed).map(c=>c.checkId).join(', ')}`);
  const timestamp=new Date().toISOString(),operationId=createOperationId('animation_export_capability_coverage_manifest');
  return{format:'mk1_animation_export_capability_coverage_manifest_v1',timestamp,operationId,provenance:{...o18.provenance,timestamp,operationId},prerequisite:{o18OperationId:o18.operationId,o22OperationId:o22.operationId,o23OperationId:o23.operationId,o24OperationId:o24.operationId,o25OperationId:o25.operationId,o26OperationId:o26.operationId,validationPassed:true},tiers,characters,timing,packageContract:{includeVerifiedEffectPngs:true,includeExplicitCharacterContextPngs:true,includeLosslessIndexedDescriptorPayloads:true,includeO18ResourceDecodeReport:true,includeO22CharacterManifest:true,includeO25ExceptionCensus:true,includeO26TimingReport:true,unresolvedPaletteDescriptorsMustNotReceiveGuessedRgba:true,canonicalGameplayAnimationNamesEstablished:false},summary,decision:{animationExportCoverageManifestEstablished:true,universalCorrectColorAnimationExportEstablished:false,unresolvedPaletteBindingsPreserved:true,absoluteWallClockTimingEstablished:false,verdict:'MK1_ANIMATION_EXPORT_CAPABILITY_COVERAGE_MANIFEST_ESTABLISHED',narrative:`O59 converts the O18-O26 animation research graph into an explicit export contract. All ${summary.uniqueDescriptorCount} authenticated descriptors and ${summary.indexedExportReadyEntryCount} image-bearing ANITAB entries remain available structurally/indexed; ${summary.renderedCharacterContextDescriptorVariantCount} dominant-resource descriptor variants are exportable under explicit character normal/alternate palette contexts; and ${summary.verifiedEffectRgbaPayloadCount} effect payloads have independently qualified palette bindings. The remaining ${summary.unresolvedCrossResourceDescriptorCount} cross-resource descriptors are retained as lossless indexed data only. O26 control events and caller dwell units are preserved structurally without converting them to milliseconds or FPS, and no canonical gameplay animation names are invented.`},status:'SUCCESS',validation:{allChecksPassed:true,checks}};
}
export function createMK1AnimationExportCapabilityCoverageManifestExport(report:MK1AnimationExportCapabilityCoverageManifestReport){if(report.status!=='SUCCESS'||!report.validation.allChecksPassed)throw new Error('O59 export blocked');return report;}
