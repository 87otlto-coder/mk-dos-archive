# MK DOS Extractor — P10 original Pit II bridge actor sprite loops

**Date:** 2026-11-04  
**Base:** P9 interim work, itself based on P8/P7 over frozen P6 source.  
**Release discipline:** P10 is **an interim pass**, not a new full application source release. The next full source checkpoint is P11.

## Extractor-facing result

Exactly **14 original PIT.GRA native frames** are registered in the MK2 asset library, as two independently authenticated seven-frame original source loops. They are *background actors*, not playable characters:

- Original green bridge actor: 7 frames, **16 × 24** pixels per frame.
- Original flame bridge actor: 7 frames, **16 × 32** pixels per frame.
- All 14 original sprite descriptors reside in `MK2.EXE:0xB98E4..0xB9994` (individual verified offsets in manifest). They cover the **final 7,764 bytes** of `PIT.GRA`, starting at offset **61,620**, through its exact end **69,384**.
- Resource ID 32 is authenticated through the original packed references. The original EXE pointer joins to its **81-color Pit palette record** at physical `0x895AC`; colors are source-linked previews, not a fresh live DAC trace.
- Two source list structures at Object 2 `0x18AFC` (green) and `0x18B20` (flame) each contain 7 original descriptor references, token 1, and a loop-back pointer. The O221 callback identity and literal six-scheduler-yield code are checked, but **not converted to milliseconds**.
- Every asset exposes original indices, original 0/1 paint coverage, palette-linked RGBA preview, descriptor provenance and original GRA source offset. The evidence ZIP includes all PNG/index/mask triplets, both source lists, and limitations.

The prior P9 MK2 scan contained **5,039** discoverable assets. P10's full canonical MK2 scan contains **5,053** unique assets. All earlier category counts remain present, including 312 source-domain sound effect WAVs, 43 stage effect frames, eight Tomb/Portal setup layers, 15 native floor assets, ten Forest representations, seven Pit lower-wall graphics and six Pit upper setup-local layers.

## Validation run

- `node scripts/verify-mk2-p10-pit-bridge.cjs <canonical MK2 directory> [report.json] [package.zip]` — **PASS, 225 checks**, including full 5,053-asset scan, ID uniqueness, mixed-asset selection ZIP, and negative tests for missing/mutated/duplicate EXE and PIT.GRA. The P10 builder remains qualified when unrelated `PORTAL.GRA` is missing.
- `python scripts/verify-mk2-p10-bridge-independent.py <canonical dir> <P10 package ZIP> <report.json> <preview PNG>` — **PASS, 61 independent checks**; compares all fourteen source descriptor stream indices, masks and PNG RGBA pixels against independent original O220 RLE/palette equations; verifies both EXE pointer-loop arrays.
- `python scripts/verify-o221-pit-bridge-animation-list-flow.py --game-zip <canonical MK2 zip> --out <fresh output dir>` — existing unchanged research verifier passed **both seven-descriptor lists and five deliberate EXE mutation controls**.
- Targeted TypeScript checking of the new module and integrated collection passed with a local `process` declaration shim for an unrelated Node diagnostics type gap.
- Full Vite/browser build and interactive UI tests are **not claimed**; no npm dependencies were installed for this pass.

## Scope and confidence limitations

**Proved:** original two source loops, exact sprite bytes, source-local dimensions, original descriptor offsets, original palette-word preview and asset-export preservation.

**Not proved by this pass:** exact runtime display intervals, stage activation time, inter-layer/world positioning, final bridge scene, actor direction/occlusion, or live palette DAC selection. Loop token/repeated callback is *source control evidence*, not a time-correct APNG animation export. Export frames in original order; allow user-chosen preview speed with an explicit 'noncanonical timing' label.

No combat, damage, player controls, collision or unrelated gameplay reverse engineering was performed.

## Change boundary

Only these source files change relative to P9:

1. New `src/core/assets/mk2PitBridgeActorsP10.ts`.
2. Updated `src/core/assets/collection.ts` to register the new qualified assets/package/status.
3. New `scripts/verify-mk2-p10-pit-bridge.cjs` and `scripts/verify-mk2-p10-bridge-independent.py`.
4. This P10 handoff file.

No O220/O221 research source or P7 UI-backlog content was modified.

**P11 next:** reconcile P7–P10 on P6, run canonical MK2 extraction and export regressions, then consider deferred asset-browser navigation/preview improvements *only where the code and UI tests can support them*. Produce a full source checkpoint only after cumulative verification.
