/** O119: source-record color perturbation observed in user DOSBox gameplay.
 * Only the single tested color per record is directly perturbed; matching 80
 * full-record colors remain original-source-backed and O115 screenshot-matched.
 * This does NOT prove a particular VGA palette handle or DAC bank address.
 */
import type { MK2ObservedStage } from './observedStageFloorPreviewO116';
export const O119_RUNTIME_QUALIFICATION = 'USER_DOSBOX_80_COLOR_RECORD_PERTURBATION_VISIBLE;79_COLOR_ALTERNATIVE_NEGATIVE_IN_TESTED_FIGHT;LIVE_VGA_HANDLE_UNRESOLVED';
export const O119_RUNTIME_SOURCE_WITNESSES = {
  tomb: {sourceRecord:0x893c6, sourceColorIndex:41, positiveCase:41, negativeCase:42,
    positiveRgbPixelCount:24143, negativeRgbPixelCount:0,
    positiveScreenshotSHA256:'deb3d1a6e24b872b7d006332d585b8d85541619c7bc658ea283a7ca2bd25f764',
    negativeScreenshotSHA256:'9711e0afcbefdf85faede07985a48ca42666ca74af13c5dfa4a83796d8d6e541'},
  portal:{sourceRecord:0x891e0, sourceColorIndex:67, positiveCase:43, negativeCase:44,
    positiveRgbPixelCount:8887, negativeRgbPixelCount:0,
    positiveScreenshotSHA256:'d500d51dbc5b2e8418746254bae173788c831a1ed85f5a59bcff7d23093cc5f7',
    negativeScreenshotSHA256:'98e7f1bba2bffb47b887c33e41cbf85055c674d492f7cc92210db77f64dea988'}
} as const;
export function mk2PaletteRuntimeSourceStatusO119(stage: MK2ObservedStage): string {
 const w=O119_RUNTIME_SOURCE_WITNESSES[stage];
 return `Record at EXE 0x${w.sourceRecord.toString(16).toUpperCase()} has an O119 user-DOSBox color perturbation witness: case ${w.positiveCase} produced ${w.positiveRgbPixelCount.toLocaleString()} injected-color screenshot pixels, while the competing 79-color record (case ${w.negativeCase}) produced none. Live palette handle and DAC bank remain unknown.`;
}
