# MK DOS Extractor — P18 original MK2 source-ordered animation export groups

**Date:** 6 November 2026  
**Parent:** P17 `develop` `3f95961ba376f2e8a1863c13ae4bbac64866a5a5`  
**Classification:** second MK2-first interim extraction usability pass after the P16 source checkpoint. Preserve the forensic research workbench and P16 `main` source.

## Extractor improvement

The Asset Library's **57 previously decoded original background/effect sprite frames** now have a useful source-list-level representation: **eight previewable original-order contact sheets**, each with a directly downloadable ZIP containing every source frame's PNG, exact original-index plane, opacity mask and an explicit original-list manifest. All frame ZIPs are also retained in the Coverage & evidence packages.

The P18 integration reuses, without modifying, two strict original DOS source decoders: six O136/O177 source-linked stage effect lists (43 original frames), and two O220/O221 The Pit II bridge-actor lists (14 original frames). It creates **eight derived asset representations**, not 57 newly discovered sprites or new complete 320×200 stages.

| Source stage/resource | Original list | Frames | Source end/loop control |
|---|---|---:|---|
| Tomb / TOMB.GRA flying A | O136 Object-2 `0x17814` | 8 | original `1` marker, list back-reference |
| Tomb / TOMB.GRA flying B | `0x177EC` | 8 | original `1` marker, list back-reference |
| Portal / PORTAL.GRA swaying | `0x164B4` | 7 | original `1` marker, list back-reference |
| Portal / PORTAL.GRA hanging | `0x164D8` | 7 | original zero terminator |
| Portal / PORTAL.GRA electric | `0x164F8` | 6 | original zero terminator |
| Tower / TOWER.GRA source effect | `0x16490` | 7 | original `1` marker, list back-reference |
| Pit II / PIT.GRA green bridge actor | O221 Object-2 `0x18AFC` | 7 | original `1` marker, list back-reference |
| Pit II / PIT.GRA flame bridge actor | `0x18B20` | 7 | original `1` marker, list back-reference |

**Original-list order** and loop/end tokens are verified. The contact sheets have **synthetic diagnostic cell geometry**, so their horizontal arrangement is not an original DOS on-screen coordinate or native animation frame. Timing and activation are unknown, and the original effect palette or Pit palette used to *preview* a frame is not a verified live VGA DAC selection. No invented native FPS, durations, stage compositor position, world placement or inferred frame order.

## Code and export contract

- New `src/core/assets/mk2OrderedSequenceBundlesP18.ts`: consumes *verified* stage and bridge frame Asset records only, checking all 57 original frame IDs, order, original EXE list pointers, source end markers, dimensions, metadata confidence and source sidecars. Returns **UNAVAILABLE, zero exported frames/packages** on any invalid, incomplete or duplicate source group; never emits a plausible partial loop.
- Modified `src/core/assets/collection.ts`: registers the eight contact sheets and downloadable source-ordered group ZIPs **after** the existing P2 and P10 original decoders; retains all P12–P17 source registrations and the original research workbench. Adds `p18OrderedSequences` status and P18 limitations.
- Small `src/components/AssetBrowser.tsx` addition: when inspecting an original-order sheet, a clearly labelled **Export source-ordered frames ZIP** action directly downloads the verified package, rather than requiring users to find it inside the larger evidence list. Existing individual frame PNG, selected ZIP, source sprite sheet and user-controlled animation exports remain unchanged.
- Source-ordered ZIP format `mkdos_p18_original_ordered_animation_bundle_v1` includes `sequence.json`, `README.txt`, 6–8 individual `assets/*.png`, each `indexed/*_indices.bin` and `indexed/*_mask.bin`, plus the standard original-frame selection manifest. Source SHA-256 and original GRA ranges are linked to each sprite. It **does not** include an original animation clock.
- Contact-sheet assets retain source numeric indices, paint masks and an all-zero **runtime palette-known mask**, plus metadata with source frame IDs, source pointer, selected ZIP package filename and explicit unsupported interpretations.

## Verification — original DOS fixture and negative controls

- **Focused original-fixture test:** `node scripts/verify-mk2-p18-ordered-sequences.cjs <original MK2 dir>`: **379,422 assertions PASS**. All 57 underlying frames checked across eight verified source lists; every source index/mask/RGBA pixel represented correctly in the contact sheet; eight contact-sheet PNGs independently decoded and RGBA/geometry compared; each frame ZIP's PNG bytes equal the ordinary individual-frame export and every indexed plane and source offset matches its original frame. A missing, duplicated, reordered, altered-pointer, altered-loop, truncated-mask, or fabricated-timing input is rejected. The generated contacts compare **63,112 native per-frame indexed source pixels**. No original image bytes are stored in GitHub test fixtures.
- **Original-file historical compatibility:** `node scripts/verify-mk2-p18-cumulative.cjs <original MK2 dir> <report> --p11-p17-baseline` returned **5,063 unique assets, 32 checks PASS** on the preserved P11 base with P17 and P18 adapters. All original P8–P10 forensic ZIP SHA-256 identities were unchanged.
- **Full current source (P16+P17+P18) cumulative:** expected **5,118 asset representations** (`5,108 + 2 + 8`), **VALIDATION PENDING**. The complete source was not locally reconstructed in this pass; the default `scripts/verify-mk2-p18-cumulative.cjs` requires the actual P16+P17+P18 baseline and must pass before a later consolidation. The 5,063 compatibility census must not be presented as that full cumulative pass.
- **GitHub CI:** strict npm install, syntax, Vite build, TypeScript, Git-safe guard, Chrome source-offline smoke **must be reported separately after the actual committed P18 run**. Local original-fixture parity does not prove in-app Windows Chrome interaction with the new source group controls. User P11 export acceptance is not a P18 ZIP-specific browser test.

## Confidence classification

**VERIFIED** original DOS source list order, exact O136/O177 and O220/O221 source frame pixels and mask provenance, source loop/end markers, bounded original palette preview; P18 diagnostic assembly and ZIP byte parity. **UNKNOWN** live original frame timing and scheduling, runtime effect activation/visibility, original live DAC bank ownership, final camera/placement/draw order, complete scene composition. **VALIDATION PENDING** current full 5,118-asset cumulative scan and new feature in-browser clicks. **INFERRED:** none of the unresolved runtime interpretations are promoted to verified.

## Development cadence

P18 is the **second interim pass** after P16. Continue MK2-first for P19–P20, prioritizing improvements to useful source-grounded stage composition and animation/audio exports, then P21 consolidation only if full source/original-fixture gates justify it. Keep original game files, extracted commercial graphics and screenshots out of GitHub.
