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
