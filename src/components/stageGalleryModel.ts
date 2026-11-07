/** O193: Museum-only source discovery. Never asserts unverified arcade-stage identities. */
import type { InventoryEntry } from '../core/models/InventoryEntry';
import type { GameDetectionResult } from '../core/models/GameDetection';
export type GalleryStage = {
  name: string; file: string; note: string;
  effectFrames: number | null; tracks: number | null;
};
const MK2_STAGES: GalleryStage[] = [
  { name: 'The Portal', file: 'PORTAL.GRA', note: 'Original animated objects and floor research', effectFrames: 20, tracks: 3 },
  { name: 'Kombat Tomb', file: 'TOMB.GRA', note: 'Source layers, animated effects and floor', effectFrames: 16, tracks: 2 },
  { name: 'The Tower', file: 'TOWER.GRA', note: 'Original effect frames, candidate source palette', effectFrames: 7, tracks: 1 },
  { name: 'Living Forest', file: 'FOREST.GRA', note: 'Stage resource and packed-row research', effectFrames: null, tracks: null },
  { name: 'The Armory', file: 'ARMORY.GRA', note: 'Stage resource and packed-row research', effectFrames: null, tracks: null },
  { name: 'The Arena', file: 'ARENA.GRA', note: 'Stage resource and packed-row research', effectFrames: null, tracks: null },
  { name: 'The Battleplan', file: 'BATTLE.GRA', note: 'Stage resource discovered; inspect original data', effectFrames: null, tracks: null },
  { name: 'Dead Pool', file: 'DEDPOOL.GRA', note: 'Stage resource discovered; inspect original data', effectFrames: null, tracks: null },
  { name: 'The Pit', file: 'PIT.GRA', note: 'Stage resource discovered; inspect original data', effectFrames: null, tracks: null },
  { name: 'The Cave', file: 'CAVE.GRA', note: 'Stage resource discovered; inspect original data', effectFrames: null, tracks: null },
];
/** Every gallery card must be backed by a real resource in the chosen installation. */
export function discoverStageGallery(inventory: readonly InventoryEntry[], game: GameDetectionResult['game'], filter = ''): GalleryStage[] {
  const terms = filter.trim().toLowerCase();
  const matches = (v: GalleryStage) => `${v.name} ${v.file} ${v.note}`.toLowerCase().includes(terms);
  const names = new Set(inventory.map(x => x.name.toUpperCase()));
  if (game === 'mk2') return MK2_STAGES.filter(s => names.has(s.file) && matches(s));
  if (game === 'mk1') {
    // O27 explicitly leaves arcade-stage-name mapping unresolved: display source identities only.
    return [...names].filter(name => /^[A-Z0-9_]+HDRS\.GRA$/.test(name)).sort()
      .map(name => ({ name: name.replace(/\.GRA$/, ''), file: name,
        note: 'MK1 background/header resource candidate; arcade-stage identity is not yet verified', effectFrames: null, tracks: null }))
      .filter(matches);
  }
  if (game === 'mk3') return [...names].filter(name => /STAGE|BACK|ARENA|TOMB|PIT|PORTAL|CAVE|TOWER|FOREST|PALACE|COURT|SKY/i.test(name) && name.endsWith('.GRA'))
    .sort().map(name => ({name, file: name, note: 'Stage candidate; scene membership unverified', effectFrames: null, tracks: null})).filter(matches);
  return [];
}

/** P55: Only trust exact, internally produced P54 header/module/preview joins.
 * The gallery never assigns an arcade stage name or predicts a missing preview.
 */
export type MK1StagePreviewLink = { moduleSymbol:string; assetId:string };
export function verifiedMK1HeaderPreviewLinks(report:unknown):Map<string,MK1StagePreviewLink[]> {
 const empty=()=>new Map<string,MK1StagePreviewLink[]>();
 if(!report||typeof report!=='object')return empty();
 const r=report as Record<string,unknown>;
 if(r.schema!=='mk1_p54_header_module_preview_joins_v1'||
  r.arcadeStageNamesVerified!==false||r.livePaletteOwnershipVerified!==false||
  r.canonicalGameplayScenesVerified!==false||!Array.isArray(r.resources)||!Array.isArray(r.modules))
  return empty();
 const symbols=new Set<string>(),seenAssets=new Set<string>();
 const mapped=new Map<string,MK1StagePreviewLink[]>();
 for(const raw of r.modules){
  if(!raw||typeof raw!=='object')return empty();
  const m=raw as Record<string,unknown>;
  if(typeof m.moduleSymbol!=='string'||!m.moduleSymbol||symbols.has(m.moduleSymbol)||
   typeof m.headerResource!=='string'||!/^[A-Z0-9_]+HDRS\.GRA$/.test(m.headerResource))
   return empty();
  symbols.add(m.moduleSymbol);
  if(m.status==='PREVIEW_UNAVAILABLE'&&m.normalizedPreviewAssetId===null)continue;
  const slug=m.moduleSymbol.toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'');
  const expected=`stages/${slug}/normalized_combined_background.png`;
  if(m.status!=='EXACT_JOIN'||m.normalizedPreviewAssetId!==expected||seenAssets.has(expected))return empty();
  seenAssets.add(expected);
  const rows=mapped.get(m.headerResource)??[];
  rows.push({moduleSymbol:m.moduleSymbol,assetId:expected});
  mapped.set(m.headerResource,rows);
 }
 if(!r.summary||typeof r.summary!=='object')return empty();
 const summary=r.summary as Record<string,unknown>;
 if(summary.sourceModules!==r.modules.length||summary.headerResources!==r.resources.length||
  summary.exactPreviewJoins!==seenAssets.size||
  summary.missingPreviewJoins!==r.modules.length-seenAssets.size||
  !Array.isArray(summary.unjoinedNormalizedPreviews)||
  summary.unjoinedNormalizedPreviews.length!==0)return empty();
 if(new Set(r.resources.map((raw:unknown)=>raw&&typeof raw==='object'?(raw as Record<string,unknown>).headerResource:null)).size!==r.resources.length)return empty();
 for(const raw of r.resources){
  if(!raw||typeof raw!=='object')return empty();
  const resource=raw as Record<string,unknown>;
  if(typeof resource.headerResource!=='string'||!Array.isArray(resource.moduleSymbols)||
   !Array.isArray(resource.normalizedPreviewAssetIds))return empty();
  const modules=(r.modules as Array<Record<string,unknown>>).filter(m=>m.headerResource===resource.headerResource);
  const linkRows=mapped.get(resource.headerResource)??[];
  const equal=(a:string[],b:string[])=>a.length===b.length&&a.every((v,i)=>v===b[i]);
  if(!modules.length||
   !equal([...modules.map(m=>m.moduleSymbol as string)].sort(),resource.moduleSymbols)||
   !equal([...linkRows.map(x=>x.assetId)].sort(),resource.normalizedPreviewAssetIds))
   return empty();
 }
 if([...mapped.keys()].some(k=>!(r.resources as Array<Record<string,unknown>>).some(x=>x.headerResource===k)))return empty();
 for(const rows of mapped.values())rows.sort((a,b)=>a.moduleSymbol.localeCompare(b.moduleSymbol));
 return mapped;
}
