/** P54: exact O27 header -> BGND module -> O54 normalized preview provenance.
 * This is a join of qualified identifiers, NOT arcade stage naming or live scene reconstruction.
 */
import type {Asset} from './model';
import type {MK1StageBackgroundResourceGraphCensusReport} from '../../games/mk1/research/stageBackgroundResourceGraphCensus';

const slug=(s:string)=>s.toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'');
const basename=(s:string)=>s.replace(/\\/g,'/').split('/').pop()!.toUpperCase();
export function buildMK1StageHeaderBindingsP54(
 graph:MK1StageBackgroundResourceGraphCensusReport,
 assets:readonly Asset[],
){
 if(graph.status!=='SUCCESS'||!graph.validation.allChecksPassed||
  !graph.decision.backgroundModuleGrammarBounded||!graph.decision.packedRootResourcesResolved||
  !graph.decision.sceneBmodReferenceSurfaceEstablished||graph.decision.arcadeStageNameMappingEstablished)
  throw Error('P54 requires qualified O27 resource graph without an arcade-name claim');
 const modules=[] as Array<{moduleSymbol:string;headerResource:string;resourcePath:string;
  normalizedPreviewAssetId:string|null;status:'EXACT_JOIN'|'PREVIEW_UNAVAILABLE';sceneBmodSymbols:string[]}>;
 const previews=assets.filter(a=>a.kind==='stage'&&/^stages\/[^/]+\/normalized_combined_background\.png$/.test(a.id));
 const used=new Set<string>();
 const symbols=new Set<string>();
 for(const mod of graph.topLevelModules){
  if(symbols.has(mod.symbol))throw Error('P54 duplicate O27 module symbol '+mod.symbol);
  symbols.add(mod.symbol);
  const expected=`stages/${slug(mod.symbol)}/normalized_combined_background.png`;
  const matching=previews.filter(a=>a.id===expected);
  if(matching.length>1)throw Error('P54 duplicate normalized preview '+expected);
  if(matching.length===1){
   const a=matching[0];
   if(!a.rgba||!a.width||!a.height||a.rgba.length!==a.width*a.height*4)
    throw Error('P54 invalid normalized preview geometry '+expected);
   if(used.has(a.id))throw Error('P54 reused normalized preview '+expected);
   used.add(a.id);
  }
  const header=basename(mod.resourcePath);
  if(!/^[A-Z0-9_]+HDRS\.GRA$/.test(header))throw Error('P54 non-header root '+header);
  modules.push({moduleSymbol:mod.symbol,headerResource:header,resourcePath:mod.resourcePath,
   normalizedPreviewAssetId:matching[0]?.id??null,status:matching.length?'EXACT_JOIN':'PREVIEW_UNAVAILABLE',
   sceneBmodSymbols:mod.sceneEntries.filter(e=>e.kind==='BMOD_WITH_PACKED_I16_PAIR')
    .map(e=>e.bmodSymbol)});
 }
 const headerNames=[...new Set(modules.map(m=>m.headerResource))].sort();
 const resources=headerNames.map(name=>({
  headerResource:name,
  moduleSymbols:modules.filter(m=>m.headerResource===name).map(m=>m.moduleSymbol).sort(),
  normalizedPreviewAssetIds:modules.filter(m=>m.headerResource===name)
   .flatMap(m=>m.normalizedPreviewAssetId?[m.normalizedPreviewAssetId]:[]).sort(),
 }));
 return {schema:'mk1_p54_header_module_preview_joins_v1' as const,
  qualification:'O27 source-header -> BGND module; exact O54 normalized preview ID where present',
  arcadeStageNamesVerified:false,livePaletteOwnershipVerified:false,canonicalGameplayScenesVerified:false,
  modules,resources,summary:{sourceModules:modules.length,headerResources:resources.length,
   exactPreviewJoins:used.size,missingPreviewJoins:modules.length-used.size,
   unjoinedNormalizedPreviews:previews.filter(p=>!used.has(p.id)).map(p=>p.id).sort()}};
}
