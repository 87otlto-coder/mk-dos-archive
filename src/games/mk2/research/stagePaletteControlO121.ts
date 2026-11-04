/** O121: conditional executable control graph for stage graphics and palette source.
 * Matches the authenticated MK2.EXE and original GRA resource pool only.
 * O119 independently demonstrated the 80-color record's visual effect in gameplay;
 * this graph does not establish a live setup pointer, palette handle or VGA bank.
 */
import type { MK2ObservedStage } from './observedStageFloorPreviewO116';
export const O121_STAGE_SETUP_CONTROL = {
 tomb: { sourceRecord:0x893c6, sourceResource:'TOMB.GRA',resourceId:28,
   paletteSlot:2,setupRecords:6,controlEntries:87,distinctSpriteDescriptors:16,
   colorMatchingAlternativeRecord:0x8cdbe },
 portal: { sourceRecord:0x891e0,sourceResource:'PORTAL.GRA',resourceId:25,
   paletteSlot:2,setupRecords:2,controlEntries:28,distinctSpriteDescriptors:13,
   colorMatchingAlternativeRecord:0x8cd1e }
} as const;
export const O121_ALTERNATIVE_RESOURCE = {
 name:'IMAGES.GRA',resourceId:22,setupRecordsPerCandidate:1,controlEntriesPerCandidate:10,
 status:'Different original-resource ownership, NOT stage-graphics setup'
} as const;
export function mk2PaletteControlGraphStatusO121(stage: MK2ObservedStage): string {
 const c=O121_STAGE_SETUP_CONTROL[stage];
 return `O121 source graph: ${c.setupRecords} conditional setup records, ${c.controlEntries} controls, and ${c.distinctSpriteDescriptors} distinct graphics descriptors reference ${c.sourceResource} (resource ${c.resourceId}). Each control selects palette-table slot ${c.paletteSlot}, which points to the original 80-color EXE record. The RGB-matching 79-color candidate at 0x${c.colorMatchingAlternativeRecord.toString(16).toUpperCase()} instead belongs to ${O121_ALTERNATIVE_RESOURCE.name} (resource ${O121_ALTERNATIVE_RESOURCE.resourceId}); it is not a stage graphics setup. Actual runtime setup selection, palette handle, and DAC index remain unmeasured.`;
}
