/**
 * MK1 background orientation + CHOP/STATUE static-extra qualification — Pass 1E.3O.49.
 *
 * Correction pass prompted by product-export visual review. It proves that BAKGND
 * placement control bit 0x0010 selects the flipped WrtNonZero rasterizer and that
 * O44/O46 had omitted this per-object horizontal orientation. It also closes the
 * shared CHOP_MOD / STATUE_MOD init callback at 0x4850 as one no-scroll moon object.
 */
import { DirectorySource } from '../../../core/filesystem/DirectorySource';
import { createOperationId } from '../../../core/diagnostics/diagnosticLogger';
import { sha256Bytes } from './paletteRoundTripCodec';
import { decodeUgraSprite, computeSpriteChecksum } from '../graphics/ugraDecoder';
import { MK1BackgroundTimeAwareSceneIrReport } from './backgroundTimeAwareSceneIr';
import { MK1FreshInitialOrdinaryBakCompositorCensusReport } from './freshInitialOrdinaryBakCompositorCensus';

const CANONICAL_SHA='750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14';
const CODE_BASE=0x00050a54, STATIC_BASE=0x0008ca54;
const DISPATCH_TABLE=0x00009024, STATIC_EXTRA_RECORD=0x00000c86;
function hx(v:number){return `0x${(v>>>0).toString(16).padStart(8,'0').toUpperCase()}`;}
function u16(b:Uint8Array,o:number){return (b[o]|(b[o+1]<<8))>>>0;}
function i16v(v:number){return v&0x8000?v-0x10000:v;}
function u32(b:Uint8Array,o:number){return ((b[o]|(b[o+1]<<8)|(b[o+2]<<16)|(b[o+3]<<24))>>>0);}
function bytesAt(b:Uint8Array,p:number,expected:number[]){if(p<0||p+expected.length>b.length)return false;for(let i=0;i<expected.length;i++)if(b[p+i]!==expected[i])return false;return true;}
function norm(s:string){return s.replace(/\\/g,'/').toUpperCase();}
function rgbWord(w:number):[number,number,number]{return [Math.round(((w>>>10)&31)*255/31),Math.round(((w>>>5)&31)*255/31),Math.round((w&31)*255/31)];}
function colorize(indices:Uint8Array,mask:Uint8Array,words:number[]){const rgba=new Uint8Array(indices.length*4);let out=0,opaque=0,max=0;for(let i=0;i<indices.length;i++){if(!mask[i])continue;opaque++;const idx=indices[i];if(idx>max)max=idx;if(idx<1||idx>words.length){out++;continue;}const [r,g,b]=rgbWord(words[idx-1]),p=i*4;rgba[p]=r;rgba[p+1]=g;rgba[p+2]=b;rgba[p+3]=255;}return{rgba,out,opaque,max};}
function derivePlacementObjectFlags(controlWord:number){return (controlWord&0x0030)|0x0002|((controlWord&0x0040)?0:1);}

export interface MK1BackgroundOrientationStaticExtraQualificationReport{
 format:'mk1_background_orientation_static_extra_qualification_v1';timestamp:string;operationId:string;
 provenance:{sourceKind:'user-loaded-directory';fileName:string;byteLength:number;sha256:string;synthetic:false;artifactGeneratedByTest:false;timestamp:string;operationId:string};
 prerequisite:{o31OperationId:string;o31Verdict:string;o43OperationId:string;o43Verdict:string};
 orientationProof:{
  bakgndControlTransform:string;canonicalPlacementDerivedFlagValues:number[];controlBit0010Meaning:'HORIZONTAL_FLIP';controlBit0020ObservedInCanonicalPlacements:false;controlBit0040Meaning:'ACTIVE_RENDER_DISPATCH_SELECTOR_BIT';
  dispatchTableWatcomOffset:number;dispatchTableWatcomOffsetHex:string;dispatchRows:Array<{selector:number;selectorHex:string;watcomTarget:number;watcomTargetHex:string;symbol:string;module:string;classification:string}>;
  writerDirectionEvidence:Array<{symbol:string;watcomOffset:number;watcomOffsetHex:string;classification:string;instructionEvidence:string}>;
  instantiatedPlacementCount:number;instantiatedHorizontalFlipCount:number;visiblePlacementCount:number;visibleHorizontalFlipCount:number;modulesWithVisibleHorizontalFlips:number;
  visibleFlipCensus:Array<{moduleSymbol:string;visiblePlacementCount:number;visibleHorizontalFlipCount:number}>;
 };
 staticExtra:{
  initCallbackWatcomOffset:number;initCallbackWatcomOffsetHex:string;topLevelModules:string[];objectBuilderWatcomOffset:number;objectBuilderWatcomOffsetHex:string;
  setupRecordWatcomOffset:number;setupRecordWatcomOffsetHex:string;rawRecordHex:string;objectFlags:number;objectFlagsHex:string;noScroll:true;horizontalFlip:false;
  insertionListWatcomOffset:number;insertionListWatcomOffsetHex:string;rendererPlaneIndex:4;screenX:number;screenY:number;primarySortKey:number;
  descriptor:{watcomOffset:number;watcomOffsetHex:string;width:number;height:number;x:number;y:number;packedReference:number;packedReferenceHex:string;fileId:2;resourcePath:'GRAPHICS/MISC.GRA';graOffset:number;graOffsetHex:string;decodeSuccess:true;checksum:string;opaquePixelCount:number;maxOpaquePaletteIndex:number};
  palette:{watcomOffset:number;watcomOffsetHex:string;colorCount:number;colorWords15:number[];allOpaqueIndicesInRange:true};
  classification:'STATIC_NO_SCROLL_MOON_OBJECT';
 };
 correctionImpact:{o44OrdinaryRasterOrientationIncomplete:true;o46CombinedRasterOrientationIncompleteForAffectedModules:true;o48ProductPackageSupersededForRasterPixels:true;sourceSpriteDecodesRemainValid:true;rendererOrderEvidenceRemainsValid:true;affectedVisibleModuleVariants:string[]};
 summary:{instantiatedHorizontalFlipCount:number;visibleHorizontalFlipCount:number;visibleAffectedModuleCount:number;staticExtraObjectCountPerAffectedModule:1;staticExtraAffectedModuleCount:2};
 decision:{horizontalFlipSemanticsEstablished:true;staticExtraObjectSemanticsEstablished:true;oldRasterOrientationBugEstablished:true;descriptorOrPaletteBugEstablished:false;correctedPackageRequired:true;verdict:'MK1_BACKGROUND_HORIZONTAL_FLIP_AND_CHOP_STATUE_STATIC_EXTRA_ESTABLISHED';narrative:string};
 status:'SUCCESS';validation:{allChecksPassed:boolean;checks:Array<{checkId:string;passed:boolean;detail?:string}>};
}

export async function executeBackgroundOrientationStaticExtraQualification(source:DirectorySource,o31:MK1BackgroundTimeAwareSceneIrReport,o43:MK1FreshInitialOrdinaryBakCompositorCensusReport):Promise<MK1BackgroundOrientationStaticExtraQualificationReport>{
 if(source.isSynthetic!==false)throw new Error('O49 requires authentic MK1 installation');
 if(o31.status!=='SUCCESS'||!o31.validation.allChecksPassed||o31.decision.verdict!=='MK1_TIME_AWARE_BACKGROUND_SCENE_IR_ESTABLISHED')throw new Error('O49 requires verified O31');
 if(o43.status!=='SUCCESS'||!o43.validation.allChecksPassed||o43.decision.verdict!=='MK1_FRESH_INITIAL_ORDINARY_BAK_COMPOSITOR_CENSUS_ESTABLISHED')throw new Error('O49 requires verified O43');
 const files=await source.listRecursive(),exeEntry=files.find(f=>f.name.toUpperCase()==='MK1.EXE');if(!exeEntry)throw new Error('O49 requires MK1.EXE');const exe=await source.readSlice(exeEntry.path,0,exeEntry.size),sha=await sha256Bytes(exe);if(sha!==CANONICAL_SHA||sha!==o31.provenance.sha256||sha!==o43.provenance.sha256)throw new Error('O49 canonical provenance mismatch');
 const sigs=[
  {id:'BAKGND_CONTROL_TO_FLAGS',off:0x4558,bytes:[0xba,0x02,0x00,0x00,0x00,0xc1,0xe9,0x04,0xc1,0xe1,0x1e,0x72,0x01,0x42,0xc1,0xe9,0x1a,0x0b,0xd1]},
  {id:'FWRITENONZERO_RIGHT_EDGE_SETUP',off:0x20398,bytes:[0xba,0x40,0x01,0x00,0x00,0x03,0xd1,0x8d,0x7c,0x0f,0xff]},
  {id:'WRITENONZERO_FORWARD_STRIDE_SETUP',off:0x23f34,bytes:[0xba,0x40,0x01,0x00,0x00,0x2b,0xd1]},
  {id:'STATIC_EXTRA_RECORD_LOAD',off:0x4850,bytes:[0xc7,0x05,0x60,0x4b,0x02,0x00,0x86,0x0c,0x00,0x00]},
  {id:'STATIC_EXTRA_INSERT_PLANE4',off:0x4861,bytes:[0xc7,0x05,0x74,0x4b,0x02,0x00,0xa8,0x63,0x05,0x00]},
  {id:'OBJECT_BUILDER_4002_ENTRY',off:0x19e30,bytes:[0xba,0x02,0x40,0x00,0x00,0xeb,0x05]},
 ];for(const s of sigs)if(!bytesAt(exe,CODE_BASE+s.off,s.bytes))throw new Error(`O49 signature mismatch ${s.id}`);
 const table=STATIC_BASE+DISPATCH_TABLE;const dispatchExpected=[
  {selector:0x02,target:0x23f34,symbol:'WrtNonZero',module:'RLL_WNZ.ASM',classification:'FORWARD_NONZERO_WRITER'},
  {selector:0x12,target:0x20398,symbol:'fWrtNonZero',module:'RLL_FWNZ.ASM',classification:'HORIZONTALLY_FLIPPED_NONZERO_WRITER'},
  {selector:0x42,target:0x23fb4,symbol:'ClpWrtNonZero',module:'RLL_WNZ.ASM',classification:'FORWARD_CLIPPED_NONZERO_WRITER'},
  {selector:0x52,target:0x2041c,symbol:'fClpWrtNonZero',module:'RLL_FWNZ.ASM',classification:'HORIZONTALLY_FLIPPED_CLIPPED_NONZERO_WRITER'},
 ];for(const d of dispatchExpected){const got=u32(exe,table+d.selector*4);if(got!==d.target)throw new Error(`O49 dispatch mismatch selector ${d.selector}`);}
 const allPlacements=o31.modules.flatMap(m=>m.planeSlots.flatMap(s=>s.placements??[]));const flagValues=[...new Set(allPlacements.map(p=>derivePlacementObjectFlags(p.controlWord)))].sort((a,b)=>a-b);const instantiatedFlip=allPlacements.filter(p=>(p.controlWord&0x10)!==0).length;const bit20=allPlacements.filter(p=>(p.controlWord&0x20)!==0).length,bit40Clear=allPlacements.filter(p=>(p.controlWord&0x40)===0).length;
 const o31By=new Map<string,{controlWord:number}>();for(const m of o31.modules)for(const s of m.planeSlots)for(const p of s.placements??[])o31By.set(p.id,p);
 const visibleFlipCensus=o43.modules.map(m=>{let flips=0;for(const pc of m.planeCensus)for(const p of pc.visiblePlacements){const src=o31By.get(p.id);if(!src)throw new Error(`O49 O31 join missing ${p.id}`);if(src.controlWord&0x10)flips++;}return{moduleSymbol:m.topLevelModuleSymbol,visiblePlacementCount:m.visiblePlacementCount,visibleHorizontalFlipCount:flips};});const affected=visibleFlipCensus.filter(x=>x.visibleHorizontalFlipCount>0).map(x=>x.moduleSymbol),visibleFlip=visibleFlipCensus.reduce((a,b)=>a+b.visibleHorizontalFlipCount,0);
 // Shared CHOP/STATUE static-extra record.
 const rp=STATIC_BASE+STATIC_EXTRA_RECORD,descriptorRef=u32(exe,rp),paletteRef=u32(exe,rp+4),screenX=i16v(u16(exe,rp+0x0a)),screenY=i16v(u16(exe,rp+0x0c)),primary=i16v(u16(exe,rp+0x0e));if(descriptorRef!==0x1a13c||paletteRef!==0xfb6e||screenX!==72||screenY!==15||primary!==0)throw new Error('O49 static-extra record changed');
 const dp=STATIC_BASE+descriptorRef,width=u16(exe,dp),height=u16(exe,dp+2),dx=i16v(u16(exe,dp+4)),dy=i16v(u16(exe,dp+6)),packed=u32(exe,dp+8),fileId=packed>>>24,graOffset=packed&0xffffff;if(width!==62||height!==58||dx!==0||dy!==0||fileId!==2||graOffset!==0x7764)throw new Error('O49 static-extra descriptor changed');
 const pp=STATIC_BASE+paletteRef,palCount=u16(exe,pp);if(palCount!==14)throw new Error('O49 static-extra palette changed');const words:number[]=[];for(let i=0;i<palCount;i++)words.push(u16(exe,pp+2+i*2));
 const fileMap=new Map(files.map(f=>[norm(f.path),f] as const)),misc=fileMap.get('GRAPHICS/MISC.GRA');if(!misc)throw new Error('O49 MISC.GRA missing');const gra=await source.readSlice(misc.path,0,misc.size),dec=decodeUgraSprite(gra,graOffset,width,height);if(!dec.success)throw new Error(`O49 static-extra decode failed ${dec.failureReason}`);const col=colorize(dec.indices,dec.opaqueMask,words);if(col.out)throw new Error('O49 static-extra palette range failure');
 const rawRecord=Array.from(exe.slice(rp,rp+16)).map(x=>x.toString(16).padStart(2,'0').toUpperCase()).join(' ');
 const checks=[
  {checkId:'CANONICAL_AUTHENTIC_SOURCE',passed:true},{checkId:'O31_O43_PREREQUISITES',passed:true},{checkId:'BAKGND_CONTROL_FLAG_TRANSFORM',passed:true},{checkId:'DISPATCH_02_FORWARD_12_FLIPPED_42_CLIPPED_52_FLIPPED_CLIPPED',passed:true},
  {checkId:'CANONICAL_PLACEMENT_FLAG_DOMAIN',passed:flagValues.join(',')==='2,18'&&bit20===0&&bit40Clear===0,detail:`flags=${flagValues.join(',')}, bit20=${bit20}, bit40Clear=${bit40Clear}`},
  {checkId:'EXPECTED_INSTANTIATED_FLIP_COUNT',passed:allPlacements.length===4488&&instantiatedFlip===801,detail:`placements=${allPlacements.length}, flips=${instantiatedFlip}`},
  {checkId:'EXPECTED_VISIBLE_FLIP_COUNT',passed:o43.summary.visiblePlacementInstances===2153&&visibleFlip===201&&affected.length===14,detail:`visible=${o43.summary.visiblePlacementInstances}, flips=${visibleFlip}, modules=${affected.length}`},
  {checkId:'STATIC_EXTRA_SHARED_CHOP_STATUE',passed:o31.modules.filter(m=>['CHOP_MOD','STATUE_MOD'].includes(m.topLevelModuleSymbol)&&m.initCallback.watcomOffset===0x4850).length===2},
  {checkId:'STATIC_EXTRA_MOON_DECODE',passed:dec.success&&computeSpriteChecksum(dec.indices,dec.opaqueMask)==='fdc1634a',detail:`checksum=${computeSpriteChecksum(dec.indices,dec.opaqueMask)}`},
  {checkId:'STATIC_EXTRA_PALETTE_RANGE',passed:col.out===0&&palCount===14,detail:`max=${col.max}`},{checkId:'NO_WRITE_PATH',passed:true},
 ];if(!checks.every(c=>c.passed))throw new Error(`O49 validation failed: ${checks.filter(c=>!c.passed).map(c=>c.checkId).join(', ')}`);
 const timestamp=new Date().toISOString(),operationId=createOperationId('background_orientation_static_extra_qualification');
 return{format:'mk1_background_orientation_static_extra_qualification_v1',timestamp,operationId,provenance:{sourceKind:'user-loaded-directory',fileName:exeEntry.name,byteLength:exeEntry.size,sha256:sha,synthetic:false,artifactGeneratedByTest:false,timestamp,operationId},prerequisite:{o31OperationId:o31.operationId,o31Verdict:o31.decision.verdict,o43OperationId:o43.operationId,o43Verdict:o43.decision.verdict},orientationProof:{bakgndControlTransform:'object flags = (controlWord & 0x0030) | 0x0002 | ((controlWord & 0x0040) ? 0 : 1); canonical placement records always set 0x0040 and never set 0x0020, leaving dispatch selectors 0x02 or 0x12 before clipping',canonicalPlacementDerivedFlagValues:flagValues,controlBit0010Meaning:'HORIZONTAL_FLIP',controlBit0020ObservedInCanonicalPlacements:false,controlBit0040Meaning:'ACTIVE_RENDER_DISPATCH_SELECTOR_BIT',dispatchTableWatcomOffset:DISPATCH_TABLE,dispatchTableWatcomOffsetHex:hx(DISPATCH_TABLE),dispatchRows:dispatchExpected.map(d=>({selector:d.selector,selectorHex:hx(d.selector),watcomTarget:d.target,watcomTargetHex:hx(d.target),symbol:d.symbol,module:d.module,classification:d.classification})),writerDirectionEvidence:[{symbol:'WrtNonZero',watcomOffset:0x23f34,watcomOffsetHex:hx(0x23f34),classification:'FORWARD',instructionEvidence:'uses row stride 320-width and transparent skip advances destination with ADD'},{symbol:'fWrtNonZero',watcomOffset:0x20398,watcomOffsetHex:hx(0x20398),classification:'HORIZONTAL_FLIP',instructionEvidence:'moves destination to x+width-1, uses row stride 320+width and transparent skip retreats destination with SUB'}],instantiatedPlacementCount:allPlacements.length,instantiatedHorizontalFlipCount:instantiatedFlip,visiblePlacementCount:o43.summary.visiblePlacementInstances,visibleHorizontalFlipCount:visibleFlip,modulesWithVisibleHorizontalFlips:affected.length,visibleFlipCensus},staticExtra:{initCallbackWatcomOffset:0x4850,initCallbackWatcomOffsetHex:hx(0x4850),topLevelModules:['CHOP_MOD','STATUE_MOD'],objectBuilderWatcomOffset:0x19e30,objectBuilderWatcomOffsetHex:hx(0x19e30),setupRecordWatcomOffset:STATIC_EXTRA_RECORD,setupRecordWatcomOffsetHex:hx(STATIC_EXTRA_RECORD),rawRecordHex:rawRecord,objectFlags:0x4002,objectFlagsHex:hx(0x4002),noScroll:true,horizontalFlip:false,insertionListWatcomOffset:0x563a8,insertionListWatcomOffsetHex:hx(0x563a8),rendererPlaneIndex:4,screenX,screenY,primarySortKey:primary,descriptor:{watcomOffset:descriptorRef,watcomOffsetHex:hx(descriptorRef),width,height,x:dx,y:dy,packedReference:packed,packedReferenceHex:hx(packed),fileId:2,resourcePath:'GRAPHICS/MISC.GRA',graOffset,graOffsetHex:hx(graOffset),decodeSuccess:true,checksum:computeSpriteChecksum(dec.indices,dec.opaqueMask),opaquePixelCount:col.opaque,maxOpaquePaletteIndex:col.max},palette:{watcomOffset:paletteRef,watcomOffsetHex:hx(paletteRef),colorCount:palCount,colorWords15:words,allOpaqueIndicesInRange:true},classification:'STATIC_NO_SCROLL_MOON_OBJECT'},correctionImpact:{o44OrdinaryRasterOrientationIncomplete:true,o46CombinedRasterOrientationIncompleteForAffectedModules:true,o48ProductPackageSupersededForRasterPixels:true,sourceSpriteDecodesRemainValid:true,rendererOrderEvidenceRemainsValid:true,affectedVisibleModuleVariants:affected},summary:{instantiatedHorizontalFlipCount:instantiatedFlip,visibleHorizontalFlipCount:visibleFlip,visibleAffectedModuleCount:affected.length,staticExtraObjectCountPerAffectedModule:1,staticExtraAffectedModuleCount:2},decision:{horizontalFlipSemanticsEstablished:true,staticExtraObjectSemanticsEstablished:true,oldRasterOrientationBugEstablished:true,descriptorOrPaletteBugEstablished:false,correctedPackageRequired:true,verdict:'MK1_BACKGROUND_HORIZONTAL_FLIP_AND_CHOP_STATUE_STATIC_EXTRA_ESTABLISHED',narrative:`O49 resolves the visual-review mismatch without changing descriptor or palette ownership. BAKGND transforms placement control bits into the renderer selector byte; canonical placement records yield selector 0x02 for ordinary WrtNonZero and 0x12 when control bit 0x0010 is set. The dispatch table maps 0x12/0x52 to fWrtNonZero/fClpWrtNonZero, whose raster loops start at the right edge and retreat across each row, proving horizontal flip semantics. ${instantiatedFlip} of ${allPlacements.length} instantiated placement objects and ${visibleFlip} of ${o43.summary.visiblePlacementInstances} fresh-visible objects carry that flip across ${affected.length} module variants. O44/O46 had preserved the correct descriptors, palettes, positions and draw order but omitted this final raster orientation. Separately, CHOP_MOD and STATUE_MOD share init callback 0x4850, which creates one 62x58 no-scroll MISC.GRA moon at screen (72,15), palette-bound to a 14-colour record and inserted on renderer plane 4. The moon decodes correctly and is not horizontally flipped. A corrected product raster/package pass is therefore required.`},status:'SUCCESS',validation:{allChecksPassed:true,checks}};
}
export function createMK1BackgroundOrientationStaticExtraQualificationExport(report:MK1BackgroundOrientationStaticExtraQualificationReport){if(report.status!=='SUCCESS'||!report.validation.allChecksPassed)throw new Error('O49 export blocked');return report;}
