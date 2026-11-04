# MK DOS Archive — P8 original Pit II lower-wall source extraction

**Date:** 2026-11-04  
**Baseline:** P7 interim on preserved P6 source. This is **P8 of P7–P11**; no full source release before P11.  
**Purpose:** carry source-proven Pit II imagery into the extractor without pursuing further framebuffer/video-timing internals.

## Included capability

- **Seven original FALL.GRA graphics**: 54 (post-selector crack overlay), 55–60 (lower-wall transition tiles), original 64/80/96-pixel dimensions.
- Canonical `MK2.EXE` and `FALL.GRA` SHA-256 hard gates. The builder validates **all 61** consecutive packed sprite streams, their original descriptor starts and full GRA coverage, rather than accepting unrelated byte patterns.
- All seven source graphics are linked to the **81-color original PIT palette record** at `MK2.EXE:0x895AC`, through original descriptor palette-reference value `0x27958`; DOS capture comparisons corroborate that source palette, but no direct live DAC observation is claimed.
- **32 source-ordered wall selector steps** (`60 ×12, 59 ×6, 58 ×5, 57 ×4, 56 ×3, 55 ×2`) are preserved only as metadata; sprite 54 is separately available. The original one-yield-per-selector-step source behavior is **not** converted into milliseconds or runtime frame rate.
- Each source sprite is available as a palette-linked PNG preview with original unmodified index plane and 0/1 opacity mask. The supplemental evidence ZIP contains all 7 PNGs, 7 index planes, 7 masks, a source-selector manifest, and a caveat README.
- The existing source broad indexed corpus remains intact. P8 offers **human-readable source-identified** stage assets while keeping generic index-only sprite assets unchanged.

## Validation

- `node scripts/verify-mk2-p8-pit-source-integration.cjs <untouched mk2 dir> <report.json> <source_zip>` **PASS 137 checks**. Full canonical headless scan **5,033 assets**, 7 new P8 assets beyond P7 5,026; unique IDs and all prior category counts preserved.
- Independent `python scripts/verify-mk2-p8-source-parity.py <original mk2 zip> <p8 source zip>` **PASS 68 checks**, comparing original O210 Python 61-sprite stream decoder with the actual P8 index/mask/RGBA PNGs and 32 source-selector values.
- Targeted `tsc` compilation of `src/core/assets/mk2PitLowerWallP8.ts` and `src/core/assets/collection.ts` **PASS** using local process declaration shim where required.
- Negative tests: missing/corrupted/duplicate FALL.GRA, modified/duplicate MK2.EXE → no falsely qualified P8 assets. Missing Portal leaves P8 qualified. Three-asset selected ZIP export works.
- No full Vite/browser build in this environment; **headless-verified only**.

## What is still NOT claimed

- Runtime DAC selection; exact frame intervals, continuous displayed frame order or sprite 58 visibility; tile-grid composition; full upper/lower Pit II stage reconstruction, final camera, foreground, palette transitions, or gameplay controls.
- P8 does not replace the research archive's O210–O282 evidence or alter the older decoding modules. Source GIF/APNG timing must not be generated using guessed game timing.

## Next direction

P9 should prioritize actual extractor stage composition previews based on **existing authenticated source placements and layers** (e.g. qualified Pit II upper-scene source compositions), but should not invent complete-stage transforms. Reuse independently supported geometry/parser mechanisms across stages. Preserve P7 UI backlog for P11 review; do not refactor navigation during P9.
