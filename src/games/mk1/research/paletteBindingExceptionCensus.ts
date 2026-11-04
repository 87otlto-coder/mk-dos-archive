/**
 * MK1 palette-binding exception census — Pass 1E.3O.25.
 *
 * Read-only export-safety pass. It enumerates the descriptors that O24
 * deliberately excluded from dominant-resource character palette rendering,
 * overlays only already-qualified O23 effect palette evidence, and records a
 * same-resource counterexample (Rayden lightning) so dominant resource identity
 * cannot be mistaken for universal body-palette ownership.
 */
import { DirectorySource } from '../../../core/filesystem/DirectorySource';
import { createOperationId } from '../../../core/diagnostics/diagnosticLogger';
import { enumerateMK1WatcomPermanentClasses } from './watcomPermanentClassInventory';
import { sha256Bytes } from './paletteRoundTripCodec';
import { MK1AnimationResourceDecodeCensusReport } from './animationResourceDecodeCensus';
import { MK1AnimationExportManifestReport } from './characterAnimationExportManifest';
import { MK1VerifiedPaletteBoundExportFixturesReport } from './verifiedPaletteBoundExportFixtures';
import { MK1CharacterPaletteContextVariantRendererReport } from './characterPaletteContextVariantRenderer';

const CANONICAL_SHA='750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14';
function hx(v:number){return `0x${(v>>>0).toString(16).padStart(8,'0').toUpperCase()}`;}

export type O25PaletteStatus =
  | 'QUALIFIED_EFFECT_PALETTE_BINDING'
  | 'UNRESOLVED_CROSS_RESOURCE_PALETTE'
  | 'QUALIFIED_SAME_RESOURCE_EFFECT_PALETTE_OVERRIDE';

export interface MK1PaletteBindingExceptionCensusReport {
 format:'mk1_palette_binding_exception_census_v1'; timestamp:string; operationId:string;
 provenance:MK1AnimationResourceDecodeCensusReport['provenance'];
 prerequisite:{o18OperationId:string;o22OperationId:string;o23OperationId:string;o24OperationId:string;validationPassed:true};
 dominantResources:Array<{anitabSymbol:string;resourcePath:string;dominantDescriptorCount:number;otherResourceDescriptorCount:number}>;
 crossResourceDescriptors:Array<{
  tableSymbol:string;watcomOffset:number;watcomOffsetHex:string;symbol:string|null;resourcePath:string;width:number;height:number;x:number;y:number;
  paletteStatus:Extract<O25PaletteStatus,'QUALIFIED_EFFECT_PALETTE_BINDING'|'UNRESOLVED_CROSS_RESOURCE_PALETTE'>;
  paletteSymbols:string[];evidencePass:string|null;scope:string|null;
 }>;
 sameResourceQualifiedOverrides:Array<{
  tableSymbol:string;watcomOffset:number;watcomOffsetHex:string;symbol:string;resourcePath:string;
  paletteStatus:'QUALIFIED_SAME_RESOURCE_EFFECT_PALETTE_OVERRIDE';paletteSymbols:string[];evidencePass:string;scope:string;
 }>;
 offTableQualifiedEffectDescriptors:Array<{symbol:string;resourcePath:string;paletteSymbols:string[];evidencePass:string;reason:string}>;
 resourceSummary:Array<{resourcePath:string;crossResourceDescriptorCount:number;qualifiedDescriptorCount:number;unresolvedDescriptorCount:number;tables:string[];symbols:string[]}>;
 summary:{
  uniqueO18DescriptorCount:number;dominantResourceDescriptorCount:number;crossResourceDescriptorCount:number;
  qualifiedCrossResourceDescriptorCount:number;unresolvedCrossResourceDescriptorCount:number;unresolvedCrossResourceResourceCount:number;
  sameDominantResourceQualifiedOverrideDescriptorCount:number;offTableQualifiedEffectDescriptorCount:number;
  heartQualifiedO18DescriptorCount:number;lightningQualifiedO18DescriptorCount:number;
 };
 decision:{
  crossResourcePaletteBindingSurfaceCensused:true;qualifiedHeartCrossResourceBindingRetained:true;
  sameResourceEffectOverrideCounterexampleEstablished:true;dominantResourceDoesNotImplyUniversalBodyPalette:true;
  unresolvedCrossResourceBindingsRemain:true;automaticCompatibilityBasedPalettePromotionRejected:true;
  universalCorrectColorExportEstablished:false;verdict:'MK1_PALETTE_BINDING_EXCEPTION_SURFACE_BOUNDED';narrative:string;
 };
 status:'SUCCESS';validation:{allChecksPassed:boolean;checks:Array<{checkId:string;passed:boolean;detail?:string}>};
}

export async function executePaletteBindingExceptionCensus(
 source:DirectorySource,
 o18:MK1AnimationResourceDecodeCensusReport,
 o22:MK1AnimationExportManifestReport,
 o23:MK1VerifiedPaletteBoundExportFixturesReport,
 o24:MK1CharacterPaletteContextVariantRendererReport,
):Promise<MK1PaletteBindingExceptionCensusReport>{
 if(source.isSynthetic!==false)throw new Error('O25 requires authentic MK1 installation');
 for(const [name,r] of [['O18',o18],['O22',o22],['O23',o23],['O24',o24]] as const){if(r.status!=='SUCCESS'||!r.validation.allChecksPassed||r.provenance.sha256!==CANONICAL_SHA)throw new Error(`O25 requires canonical verified ${name}`);}
 const files=await source.listRecursive(),exeE=files.find(f=>f.name.toUpperCase()==='MK1.EXE');if(!exeE)throw new Error('O25 requires MK1.EXE');const exe=await source.readSlice(exeE.path,0,exeE.size);if(await sha256Bytes(exe)!==CANONICAL_SHA)throw new Error('O25 MK1.EXE is not canonical');
 const inv=await enumerateMK1WatcomPermanentClasses(source);if(inv.status!=='SUCCESS'||!inv.result.overallValid)throw new Error('O25 Watcom inventory failed');
 const symbolByOffset=new Map<number,string[]>();for(const s of inv.result.globalSymbols.symbols){if(!s.valid||s.segment!==2||!s.kindBits.isData)continue;const a=symbolByOffset.get(s.addressOffset)??[];a.push(s.name);symbolByOffset.set(s.addressOffset,a);}
 const dominantByTable=new Map<string,{resourcePath:string;dominantDescriptorCount:number;otherResourceDescriptorCount:number}>();
 for(const c of o24.contexts){const prev=dominantByTable.get(c.anitabSymbol);if(prev&&prev.resourcePath!==c.dominantAnimationResource)throw new Error(`O25 inconsistent O24 dominant resource ${c.anitabSymbol}`);dominantByTable.set(c.anitabSymbol,{resourcePath:c.dominantAnimationResource,dominantDescriptorCount:c.dominantDescriptorCount,otherResourceDescriptorCount:c.otherResourceDescriptorCount});}
 const heartSymbols=new Set(o23.heart.frames.flatMap(f=>f.partSymbols));const lightningSymbols=new Set(o23.lightning.sprites.map(s=>s.symbol));
 const heartPrimaryBinding=o22.characters.flatMap(c=>c.qualifiedPaletteBindings).find(b=>b.characterId===1&&b.animationIndex===67&&b.paletteSymbols.includes('BLOOD_P'));
 const lightningBindings=o22.characters.flatMap(c=>c.qualifiedPaletteBindings).filter(b=>b.characterId===2&&[34,60].includes(b.animationIndex)&&b.paletteSymbols.includes('MORPH_P'));
 if(!heartPrimaryBinding||lightningBindings.length!==2)throw new Error('O25 qualified O22 palette bindings changed');
 const cross:MK1PaletteBindingExceptionCensusReport['crossResourceDescriptors']=[];const sameOverrides:MK1PaletteBindingExceptionCensusReport['sameResourceQualifiedOverrides']=[];
 const o18Symbols=new Set<string>();
 for(const d of o18.descriptors){const names=symbolByOffset.get(d.watcomOffset)??[];const symbol=names.length===1?names[0]:null;if(symbol)o18Symbols.add(symbol);const dom=dominantByTable.get(d.tableSymbol);if(!dom)throw new Error(`O25 missing dominant resource ${d.tableSymbol}`);
  if(d.resourcePath!==dom.resourcePath){const qualified=symbol!==null&&heartSymbols.has(symbol)&&d.tableSymbol==='KANO_ANITAB'&&d.resourcePath===o23.heart.resourcePath;cross.push({tableSymbol:d.tableSymbol,watcomOffset:d.watcomOffset,watcomOffsetHex:d.watcomOffsetHex,symbol,resourcePath:d.resourcePath,width:d.width,height:d.height,x:d.x,y:d.y,paletteStatus:qualified?'QUALIFIED_EFFECT_PALETTE_BINDING':'UNRESOLVED_CROSS_RESOURCE_PALETTE',paletteSymbols:qualified?[o23.heart.paletteSymbol]:[],evidencePass:qualified?'1E.3O.2':null,scope:qualified?heartPrimaryBinding.scope:null});}
  else if(symbol!==null&&lightningSymbols.has(symbol)&&d.tableSymbol==='RAIDEN_ANITAB'&&d.resourcePath===o23.lightning.resourcePath){sameOverrides.push({tableSymbol:d.tableSymbol,watcomOffset:d.watcomOffset,watcomOffsetHex:d.watcomOffsetHex,symbol,resourcePath:d.resourcePath,paletteStatus:'QUALIFIED_SAME_RESOURCE_EFFECT_PALETTE_OVERRIDE',paletteSymbols:[o23.lightning.paletteSymbol],evidencePass:'1E.3O.4',scope:'Qualified Rayden normal-lightning setup/travel/continuation/persistent-loop descriptor set rendered under MORPH_P; this is a same-resource counterexample to universal RAIDEN.GRA body-palette ownership.'});}
 }
 const offTable=[
  ...[...heartSymbols].filter(s=>!o18Symbols.has(s)).sort().map(symbol=>({symbol,resourcePath:o23.heart.resourcePath,paletteSymbols:[o23.heart.paletteSymbol],evidencePass:'1E.3O.2',reason:'Qualified heart-rip BEAT_LOOP descriptor is outside the O17/O18 ANITAB-reached graph but remains part of the established bounded heart effect.'})),
  ...[...lightningSymbols].filter(s=>!o18Symbols.has(s)).sort().map(symbol=>({symbol,resourcePath:o23.lightning.resourcePath,paletteSymbols:[o23.lightning.paletteSymbol],evidencePass:'1E.3O.4',reason:'Qualified lightning continuation/persistent-loop descriptor is outside the O17/O18 ANITAB-reached graph but remains part of the runtime-grounded lightning effect.'})),
 ];
 const rs=new Map<string,{q:number;u:number;tables:Set<string>;symbols:string[]}>();for(const d of cross){const r=rs.get(d.resourcePath)??{q:0,u:0,tables:new Set<string>(),symbols:[]};if(d.paletteStatus==='QUALIFIED_EFFECT_PALETTE_BINDING')r.q++;else r.u++;r.tables.add(d.tableSymbol);if(d.symbol)r.symbols.push(d.symbol);rs.set(d.resourcePath,r);}const resourceSummary=[...rs].sort((a,b)=>a[0].localeCompare(b[0])).map(([resourcePath,r])=>({resourcePath,crossResourceDescriptorCount:r.q+r.u,qualifiedDescriptorCount:r.q,unresolvedDescriptorCount:r.u,tables:[...r.tables].sort(),symbols:r.symbols.sort()}));
 const qualifiedCross=cross.filter(d=>d.paletteStatus==='QUALIFIED_EFFECT_PALETTE_BINDING').length,unresolved=cross.length-qualifiedCross;const summary={uniqueO18DescriptorCount:o18.summary.uniqueDescriptorCount,dominantResourceDescriptorCount:o24.summary.dominantResourceDescriptorCountAcrossUniqueTables,crossResourceDescriptorCount:cross.length,qualifiedCrossResourceDescriptorCount:qualifiedCross,unresolvedCrossResourceDescriptorCount:unresolved,unresolvedCrossResourceResourceCount:resourceSummary.filter(r=>r.unresolvedDescriptorCount>0).length,sameDominantResourceQualifiedOverrideDescriptorCount:sameOverrides.length,offTableQualifiedEffectDescriptorCount:offTable.length,heartQualifiedO18DescriptorCount:qualifiedCross,lightningQualifiedO18DescriptorCount:sameOverrides.length};
 const checks=[
  {checkId:'CANONICAL_AUTHENTIC_SOURCE',passed:true},{checkId:'O18_O22_O23_O24_PREREQUISITES',passed:true},
  {checkId:'O24_DOMINANT_RESOURCE_REMAINDER_RECONCILES',passed:summary.dominantResourceDescriptorCount+summary.crossResourceDescriptorCount===summary.uniqueO18DescriptorCount,detail:`${summary.dominantResourceDescriptorCount}+${summary.crossResourceDescriptorCount}=${summary.uniqueO18DescriptorCount}`},
  {checkId:'CROSS_RESOURCE_DESCRIPTOR_COUNT',passed:cross.length===86,detail:`cross=${cross.length}`},
  {checkId:'KANO_HEART_CROSS_RESOURCE_BINDING_RETAINED',passed:qualifiedCross===7&&cross.filter(d=>d.resourcePath==='GRAPHICS/MISC.GRA').every(d=>d.paletteStatus==='QUALIFIED_EFFECT_PALETTE_BINDING'),detail:`qualified=${qualifiedCross}`},
  {checkId:'OFF_TABLE_QUALIFIED_EFFECT_DESCRIPTORS_RETAINED',passed:offTable.length===10&&offTable.filter(d=>d.evidencePass==='1E.3O.2').length===2&&offTable.filter(d=>d.evidencePass==='1E.3O.4').length===8,detail:`offTable=${offTable.length}`},
  {checkId:'RAYDEN_SAME_RESOURCE_OVERRIDE_SET_RETAINED',passed:sameOverrides.length===5&&sameOverrides.every(d=>d.paletteSymbols[0]==='MORPH_P'),detail:`ANITAB-reached lightning=${sameOverrides.length}`},
  {checkId:'UNRESOLVED_CROSS_RESOURCE_NOT_PROMOTED',passed:unresolved===79&&cross.filter(d=>d.paletteStatus==='UNRESOLVED_CROSS_RESOURCE_PALETTE').every(d=>d.paletteSymbols.length===0),detail:`unresolved=${unresolved}`},
  {checkId:'NO_COMPATIBILITY_ONLY_BINDING',passed:true},{checkId:'NO_WRITE_PATH',passed:true},
 ];if(!checks.every(c=>c.passed))throw new Error(`O25 validation failed: ${checks.filter(c=>!c.passed).map(c=>c.checkId).join(', ')}`);
 const timestamp=new Date().toISOString(),operationId=createOperationId('palette_binding_exception_census');
 return{format:'mk1_palette_binding_exception_census_v1',timestamp,operationId,provenance:{...o18.provenance,timestamp,operationId},prerequisite:{o18OperationId:o18.operationId,o22OperationId:o22.operationId,o23OperationId:o23.operationId,o24OperationId:o24.operationId,validationPassed:true},dominantResources:[...dominantByTable].sort((a,b)=>a[0].localeCompare(b[0])).map(([anitabSymbol,d])=>({anitabSymbol,resourcePath:d.resourcePath,dominantDescriptorCount:d.dominantDescriptorCount,otherResourceDescriptorCount:d.otherResourceDescriptorCount})),crossResourceDescriptors:cross.sort((a,b)=>a.tableSymbol.localeCompare(b.tableSymbol)||a.watcomOffset-b.watcomOffset),sameResourceQualifiedOverrides:sameOverrides.sort((a,b)=>a.watcomOffset-b.watcomOffset),offTableQualifiedEffectDescriptors:offTable,resourceSummary,summary,decision:{crossResourcePaletteBindingSurfaceCensused:true,qualifiedHeartCrossResourceBindingRetained:true,sameResourceEffectOverrideCounterexampleEstablished:true,dominantResourceDoesNotImplyUniversalBodyPalette:true,unresolvedCrossResourceBindingsRemain:true,automaticCompatibilityBasedPalettePromotionRejected:true,universalCorrectColorExportEstablished:false,verdict:'MK1_PALETTE_BINDING_EXCEPTION_SURFACE_BOUNDED',narrative:`O24 leaves ${cross.length} O17/O18 descriptors outside each ANITAB's structurally dominant resource. O25 enumerates them exactly and promotes only previously qualified palette evidence: the seven ANITAB-reached Kano heart descriptors in MISC.GRA retain BLOOD_P, while ${unresolved} cross-resource descriptors remain unresolved (${resourceSummary.filter(r=>r.unresolvedDescriptorCount>0).map(r=>`${r.resourcePath}:${r.unresolvedDescriptorCount}`).join(', ')}). The qualified heart/lightning fixtures additionally contribute ${offTable.length} off-table descriptors (2 BLOOD_P heart-loop + 8 MORPH_P lightning continuation/loop). Separately, ${sameOverrides.length} ANITAB-reached qualified Rayden lightning descriptors live inside the dominant RAIDEN.GRA resource but use MORPH_P, providing direct counterevidence to any rule that a dominant resource universally implies the character body palette. Palette compatibility or shared resource naming is not used to fill the unresolved surface.`},status:'SUCCESS',validation:{allChecksPassed:true,checks}};
}
export function createMK1PaletteBindingExceptionCensusExport(report:MK1PaletteBindingExceptionCensusReport){if(report.status!=='SUCCESS'||!report.validation.allChecksPassed)throw new Error('O25 export blocked');return report;}
