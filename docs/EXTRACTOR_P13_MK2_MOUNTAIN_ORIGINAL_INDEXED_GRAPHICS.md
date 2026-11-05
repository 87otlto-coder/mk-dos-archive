# MK DOS Extractor — P13 original MOUNTAIN.GRA object-source images

**Date:** 2026-11-05  
**Base:** P12 `develop` after P11 verified `main` source checkpoint  
**Classification:** Interim extractor implementation based on independent O96S/O96T/O96U original binary research. Preserve the original workbench and P12/P11 source. No complete source-release packaging.

## Extractor value

Fifteen original, 35×41 indexed images from `MOUNTAIN.GRA` become ordinary searchable Asset Library sprites, with original indices, full source-coverage masks, native compressed extents, diagnostic grayscale PNG previews and selection ZIP export. The independent original executable's selector table **references only 14 distinct descriptors**; the fifteenth image is a valid adjacent record, **not an O96S selected image**.

This pass applies verified research to previously unavailable source graphics. **No correct RGB assignment is made**: source indices reach 96, disproving any *unmodified direct* 63-colour palette application. The normalized grayscale preview is `floor(index * 255 / 96)` solely to visualize values. An exported `paletteKnownMask` of all zeros makes unknown colour attribution explicit; indexed source pixels are unchanged in the export.

## Original-file identification and source linkage

- Canonical original `MK2.EXE` SHA-256: `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65` (861,133 bytes).
- Canonical `MOUNTAIN.GRA` SHA-256: `0dc92ef698a139eacaf57d1b7ebe47b40c8b1c08952251d8274c818be05c2ff6` (191,748 bytes).
- Original EXE filename pool slot **37** names `MOUNTAIN.GRA`. O96S pointer table has 15 slots but **14 distinct target records**; slot 14 aliases record 13. Fifteen exact 16-byte descriptor records encode a 35×41 image and source id 37; original descriptor trailing DWORD `0x0002B52A` is not semantically interpreted.
- All 15 streams decode with the native transparent-skip/indexed-RLE/aligned-literal grammar. They consecutively tile original `MOUNTAIN.GRA` bytes **168,724 to 191,748** without gaps or source mutation: **23,024 encoded bytes**, **21,525 decoded pixels**. The 168,724-byte earlier source prefix remains unresolved by this specific mechanism.
- O96R/O96U preserve **six source-list alternatives**, five distinct token orders. Their runtime selection and conditional consumer outcomes are unverified. Token 14 aliases descriptor 13; it does not select the physically adjacent fifteenth record. The 14 high-word inputs are `771, 724, …, 160` at decrement 47, but are not proven screen coordinates or frame times.
- The prior **94/124 exact-full source GRA classification does not change**. Partial decoding of a suffix is not complete MOUNTAIN resource support.

## Implemented source and evidence

1. `src/core/assets/mk2MountainSourceP13.ts` — bounded source-native RLE/literal decoder and exact original EXE/GRA identity gates. Emits 15 `sprite` assets (not a fabricated stage), a source manifest and 15 PNG/index/mask/palette-known-mask exports.
2. `src/core/assets/collection.ts` — appends the source-qualified Mountain cohort, its evidence package and confidence/availability status to existing P11/P12 output. No existing decoder or research logic replaced.
3. `scripts/verify-mk2-p13-mountain-independent.py` — independent Python original-file decoder, pointer/variant audit, source-boundary checks and SHA-256 parity against a hash-only reference.
4. `scripts/fixtures/mk2-p13-mountain-independent-parity.json` — only source offsets, descriptor/plane/preview hashes, variant token numbers, confidence statements; **no game pixels, executable bytes or extracted artwork**.
5. `scripts/verify-mk2-p13-mountain.cjs` — independently compares TypeScript original-index output, preview grayscale and source-selection metadata against Python reference; checks source ZIP and selected-asset ZIP indices/masks/unknown palettes; rejects missing, altered and ambiguous original inputs.
6. `scripts/verify-mk2-p13-cumulative.cjs` — cumulative P7–P13 scanner, historical evidence package parity and selected ZIP regression (separate from the older P12 and P11 scripts).

## Verified test results

- Independent Python original-binary re-decode, O96S/O96U table joins, bounds, per-record SHA-256 and source order: **2,198 checks PASS**.
- New TypeScript adapter vs independent Python index/mask/diagnostic-preview hashes, selected ZIP and evidence-package integrity: **358 checks PASS**. Zero false-qualified assets from altered/missing/duplicate source files. The P13 ZIP SHA-256 is `e7eabb5d6444d249b7b08a1197c7cc7767a8e70df668f661d5d0eff762d67c86`.
- Cumulative original-MK2 full scanner: **5,099 unique assets / 57 checks PASS**. The prior 5,084 P12 assets remain, every registered P7–P13 cohort remains discoverable, the historical P8/P9/P10 package ZIP SHA-256 values are byte-identical, and a six-asset selected ZIP retains original index/mask/colour-known data across old and new cohorts.
- Full Vite/TypeScript and browser onboarding: **CI validation is separate from original-file parity**. Source-only local tests do not authenticate runtime Chrome previews.

## Confidence and next work

**VERIFIED:** 15 original indexed buffers, 14 conditionally selected consumer descriptors, the structurally adjacent fifteenth, exact 23,024-byte suffix, six original conditional source orders, binary-source provenance, source-index and opacity preservation.  
**INFERRED ONLY:** diagnostic contrast-stretched grayscale values for *visual inspection*, never an actual original colour table.  
**UNKNOWN:** valid runtime palette/transform, selected variant, object creation and display activation, source high-word field meaning, screen/world coordinates, scene identity, live camera or animation timing.  
**INCOMPLETE:** MOUNTAIN resource prefix, colour-authentic display and complete stage reconstruction.

A next extractor pass should either establish an independently repeatable original palette/placement mechanism across multiple stages or integrate another source-qualified graphics family. Avoid speculative palette application or stage-layout completion claims.
