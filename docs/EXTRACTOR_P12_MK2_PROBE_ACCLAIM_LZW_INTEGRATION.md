# MK DOS Extractor — P12 interim: 31 original MK2 intro image frames

**Date:** 2026-11-05  
**Parent source:** P11 verified checkpoint `44cd1264902b8a11a9ed42ffbecddceb2ed1b94d`  
**Classification:** Reuse of independently verified O110B/O110E original-source research; interim development pass, not a full source release.

## Why this pass

P11 successfully extracts 5,053 original MK2 asset representations, including indexed character graphics, qualified sound effects, stages and source-local layers. However, earlier O110B research had already independently decoded **30 full-screen PROBE.GRA images plus one ACCLAIM.GRA image**, and O110E had already qualified their *original source DAC6 colour-word conversion*. Those 31 source frames were not available as ordinary Asset Library assets. Adding them reuses verified decoding work and provides original content without additional gameplay research or speculative scene assembly.

## Source qualifications

- Original `MK2.EXE` SHA-256: `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`.
- Original `PROBE.GRA`: 327,672 bytes, SHA-256 `4e1a30228a05103972ca3838acd76b6bafcc4c4af91e341789a1d84b9338f186`; 30 original 320×200 index planes.
- Original `ACCLAIM.GRA`: 2,036 bytes, SHA-256 `d95976f318b22266d38511285d5a623def4c3761889a230c2dd80465eef2672e`; one original 320×200 index plane.
- Each frame is independently decoded from the resource's 8-bit GIF-compatible LZW commands and native subblock structure; original source offsets and native indices are preserved for export.
- Probe's first palette source contains **four original counted records of 64+64+64+63 words** (255), with image data beginning at byte **520**. Acclaim contains **one original counted 40-word record**, with image data beginning at byte **84**. Source word lists and native source DAC6 conversions are preserved in asset metadata.
- O110E verified the original EXE DAC6 expression `R6=((w>>9)&63)|1`, `G6=((w>>4)&63)|1`, `B6=((w<<1)&63)|1`. Display RGB8 uses explicitly labelled `floor(DAC6*255/63)` expansion.
- **Index zero is not a verified runtime colour.** The conditional one-based palette preview marks index 0 (and any out-of-bank values) as **magenta UNKNOWN**, with a separately exportable `paletteKnownMask`. Source indexed pixels are not modified. This is diagnostic output, not an exact emulator screenshot.
- O110B source order **does not imply a proven original frame rate**. Probe's final LZW payload has a valid source end code without a zero-length subblock terminator; Acclaim's final frame does have the terminator. These endings are handled separately, without padding or source mutation.

## Extractor changes

1. `src/core/assets/mk2IntroLzwP12.ts`: bounded canonical-source LZW frame decoder and counted source-DAC6 palette parser; exports 31 original intro image assets with original source boundaries and provenance, source indices, full opacity mask, and palette-known mask.
2. `src/core/assets/collection.ts`: integrates 31 images and qualified availability status into the existing MK2 collection. No previous decoder or forensic workbench module is modified.
3. `src/core/assets/export.ts`: adds `paletteKnownMask` as an optional binary member of selected-asset ZIPs; all prior assets remain unaffected because they lack this field.
4. `scripts/fixtures/mk2-p12-intro-independent-parity.json`: **hashes only** of 31 original index planes, 31 diagnostic RGBA previews and 31 palette-known masks, plus original frame offsets. Derived from the separately implemented O110B and O110E original-fixture Python verifiers; **no commercial pixel data**.
5. `scripts/verify-mk2-p12-intro.cjs`: source-backed independent pixel/colour/offset parity, selected ZIP and negative controls.
6. `scripts/verify-mk2-p12-cumulative.cjs`: P11 cross-pass census/package regression with 31 P12 intro images added. Historical P11 regression scripts stay unchanged.

## Independently reproduced reference evidence

- O110B original producer plus independent Pillow/GIF verifier: **4,640,455 checks PASS**, 31×64,000 source index pixels authenticated.
- O110E original native-DAC6 palette producer and independent verifier: **3,904,275 checks PASS**, all 31 source-conditional RGB pixels/masks independently authenticated.
- New P12 TypeScript source vs both independent reference producers: **524 focused checks PASS**, including all 31 source index hashes, all 31 RGBA hashes, all 31 palette-known masks, native source offsets, source-order, and missing/mutated/ambiguous input rejection.
- P12 cumulative original MK2 scan: **5,084 unique assets / 47 checks PASS**. All prior P7–P10 asset cohorts remain present, the P8/P9/P10 original evidence-package ZIP hashes are byte-identical to P11, and a five-asset cross-pass selected ZIP contains the original indices/masks and the new palette-known mask.

## Extractor backlog, in priority order

1. **MK2 stage palette and visual composition**: use existing source-local masks/planes and original stage renderer evidence; resolve a *reusable* verified placement/palette relationship across independent stages before claiming complete scenes.
2. **MK2 held graphics and animation group qualification**: revisit VFRAME/PLAYSTA competing descriptor ownership, stage mixed-row palette ownership, and seven bounded animation identity witnesses. Preserve strict **110/124 original exact-full indexed resource** classification; intro LZW is a separately verified format class.
3. **MK2 resource families still semantically incomplete**: CAVE/FONTS/MONKS format owners and font layout; do not mistake complete source-byte partition for a verified graphic.
4. **Audio/music fidelity**: original 312 U8 WAVs and source music sequences already extract; future custom soundbanks/live hardware timing are separate from fidelity and completeness of source-domain exports.

This pass does **not** justify an inferred gameplay stage for the intros, a new stage assembly, live palette bank selection, exact sound-device timbre, or video-relative frame durations. No commercial game binary or extracted artwork belongs in GitHub.
