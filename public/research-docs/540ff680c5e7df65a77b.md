# O118 — Native EXE palette source bridge

This version inherits O117 in full and adds independent identification of counted palette source records whose native DAC color outputs reproduce every O115 Tomb/Portal floor RGB witness. The source-only preview matches all 28,160 pixels of the O116 browser previews.

- Main research: `research_outputs/O118_EXE_NATIVE_STAGE_PALETTE_BRIDGE.json`
- Independent audit: `research_outputs/O118_INDEPENDENT_PALETTE_AUDIT.json`
- Python source/tests: `tools/mk2_native_stage_palettes/`
- Browser source/tests: `src/games/mk2/research/nativeStageFloorPaletteO118.ts` and `scripts/run-mk2-o118-native-stage-palette-bridge.mjs`
- Application panel: `src/components/MK2ObservedStageFloorPanel.tsx`, now checking the source EXE palettes before showing a preview.
- Full project handoff: `MK_DOS_Archive_MASTER_HANDOFF_2026-10-11_THROUGH_O118_NATIVE_EXE_PALETTES.md`

The complete runtime disambiguation kit is separately distributed as `MK2_O118_80vs79_Palette_Runtime_Test_Kit_2026-10-11.zip` (five isolated full game directories, all 614 files each). The project includes the kit builder and an independent strict verifier; the game files are not shipped inside this **source** release.

**Important:** These source palettes are not proven to be the records used by the live DOS game, because other valid counted palette records duplicate observed colors. Source index zero and live VGA palette bank ownership remain unknown. This checkpoint is targeted development with independent verification; it is not another claimed 50-pass research batch.
