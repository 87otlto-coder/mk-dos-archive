# MK DOS Extractor — P6 Cumulative Source Checkpoint

**Date:** 2026-11-04  
**Status:** HEADLESS REAL-FIXTURE VERIFIED; FULL REACT/VITE BROWSER BUILD NOT VALIDATED HERE  
**Previous source baseline:** P1 MK2 O94D audio integration (derived from frozen O270)  
**Preservation:** O270 original, P1 source, P5 interim working copy, O282 research archives and existing research modules remain unchanged.

## Goal and scope

Deliver a reliable, extractor-first MK1/MK2/MK3 application. Source-image/palette metadata, animations, stage resources, music and sounds are relevant. Gameplay mechanics, damage, controls, collision and speculative framebuffer archaeology are not work items unless they demonstrably block extraction.

P6 is **consolidation**, not a new research or architecture phase. P2–P4 were previously source-unshipped; P5 was a separate patch against P1. P6 merges the P2–P5 additions in one tested source tree.

## Source changes

- `src/core/assets/mk2StageVisualIntegrationP2P4.ts`: independent bounded extraction integration wrapping unchanged canonical O136/O177/O181 effects, O122 Tomb/Portal source setup layers, O132 Tomb/Portal native-width floor planes and O196 Forest source floor. Uncertainty is preserved in every asset's metadata.
- `src/core/assets/collection.ts`: adds P2–P4 stage assets and evidence packages to existing P1+P5 pipeline.
- `scripts/verify-mk2-p6-cumulative.cjs`: full original-installation test, compared with P2/P3/P4 archived ZIPs.
- `scripts/verify-mk2-p6-standalone.cjs` and `scripts/fixtures/mk2-p6-archived-export-parity.json`: self-contained archive-hash and asset-hash parity checks, requiring no old ZIPs.
- `scripts/verify-mk2-p6-negative.cjs`: missing/modified/ambiguous original source input rejection.
- This handoff document.

The original `src/games/mk2/research/` source decoders and `src/core/experiments/o196.ts` are untouched.

## Authenticated cumulative MK2 scanner

The original 614-file MK2 installation, including EXE SHA-256 `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`, produced **5,016 unique asset IDs**:

| Cohort | Asset count | Status |
|---|---:|---|
| P1 existing graphics/music/sound exports | 4,950 | No regression |
| P2 source-ordered original stage effects | 43 | Rebuilt / exact original archive SHA verified |
| P3 Tomb/Portal setup-local composites | 8 | Source decoder / archived PNG, index, opacity-mask parity |
| P4 Tomb/Portal/Forest native floor exports | 7 | Source decoder / archived PNG and index parity |
| P5 Battle/Tower/Armory/Arena floor exports | 8 | Source-index byte equality / source-identity hashes verified |
| **Total** | **5,016** | **HEADLESS VERIFIED** |

**P2:** Six original source sequences (16 Tomb, 20 Portal, 7 Tower) with indexed buffers and masks. Their original source order is known; animation speed and runtime activation are not. Tower palette is source-linked, not observed as selected by runtime DAC. Rebuilt O177 archive SHA-256 `68f99207aa5b9963c3d0ecb551680a9edb227f8f8969cfbe596b2c314d28be72`, equal to archived P2.

**P3:** Eight setup-local overlays (6 Tomb, 2 Portal), NOT finished playable scene compositions. All resulting PNG pixels, original index buffers and opacity masks match prior archived selected exports.

**P4:** Full 896-column original planes; Tomb/Portal carry O118/O132 source-linked colors; Forest has exact source indices and a palette *candidate* only. All seven asset exports match archived P4 bytes.

**P5:** Four additional 896-column original indexed planes and four grayscale **index-value** PNGs. Color, camera, draw order and timing are unqualified; previews are not original game RGB.

## Validation

- `node scripts/verify-mk2-p6-cumulative.cjs <canonical-game-dir> <old-P3-P4-archive-dir> [report-output-dir]` — **147 assertions PASS**, exact historical ZIP/asset comparison and 6-domain selected export ZIP.
- `node scripts/verify-mk2-p6-standalone.cjs <canonical-game-dir> [report.json]` — **121 assertions PASS**, needs only the source plus original game installation.
- `node scripts/verify-mk2-p6-negative.cjs <canonical-game-dir>` — **12 assertions PASS**, including missing Tower, corrupt Portal, duplicate Tomb, modified EXE; P3 independent from missing Tower.
- `node --experimental-strip-types scripts/verify-mk2-p5-source-floors.mjs <canonical-game-dir>` — existing P5 fixture verifier PASS (1,061 source/negative checks).
- `node scripts/verify-o196-fixture.cjs <canonical-game-dir>` — existing Forest fixture regression PASS.
- `python tools/mk2_native_stage_palettes/test_o132_scene_layer_pack.py --exe <MK2.EXE> --game-zip <MK2.zip> --o122-report research_outputs/O122_INDEXED_LAYER_REPORT.json --o121-report research_outputs/O121_STAGE_PALETTE_CONTROL_RESOURCE_BINDINGS.json` — existing 44 tests PASS.
- Targeted TypeScript `tsc --noEmit` for affected extraction code — PASS with temporary ambient `process.platform` shim (this environment lacks installed Node type packages).
- Selected export ZIP integrity PASS. Cumulative asset count and per-pass group counts verified.

**Not validated:** full Vite/React build, browser import/preview/export UI, MK1 or MK3 regression (this pass was scoped to MK2). In the current execution environment `npm run build` fails at `vite: not found` because `node_modules` are not installed. Do not interpret this as a source compile failure or a browser pass.

## Reproduction (recommended)

1. Install project dependencies from the existing lockfile in a normal development environment.
2. Supply a clean original MK2 installation whose `MK2.EXE` matches the canonical SHA-256 above.
3. Run `node scripts/verify-mk2-p6-standalone.cjs /path/to/mk2` and confirm the 5,016 asset census and all hash checks.
4. Run project build/UI regression in an environment with the installed Vite/React dependencies.
5. Treat the full P6 source ZIP as the next working checkpoint; retain all earlier snapshots as immutable historical reference.

The cumulative verifier additionally accepts the two previously delivered reference export ZIPs under the exact filenames `P3.zip` and `P4.zip` in a supplied reference directory.

## Next five-pass cycle

P7–P10: bounded, extractor-relevant research-to-feature integration and targeted validation. P11: next full-source checkpoint if changes justify release. Prioritize missing previewable/exportable asset relationships, not any arbitrary EXE mystery. Preserve the current research environment until a standalone extractor branch is justified.
