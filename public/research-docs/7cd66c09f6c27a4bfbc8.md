# MK2 O117 — Original Tomb Floor Independently Reconstructed in Gameplay

**Date:** 2026-10-11  | **Stage:** Kombat Tomb  | **Status:** source-grounded runtime screenshot reconstruction CONFIRMED. **Not a new 50-pass batch.**

## New original gameplay evidence

User provided a clean original-resource Kombat Tomb fight screenshot after O116 requested one. Preserved as `evidence/mk2_o117/TOMB_ORIGINAL_CONTROL_20261011.png`.

- Screenshot SHA256: `5cd8f5ed5d75a4098df714b45a24ba2d7fe6ab43881add8e9c1043aa2b8e9ec9`.
- Dimensions: 637×397 pixels, an edge-cropped **literal 2×** game image rather than a proportionally rescaled image.
- Original `TOMB.GRA` SHA256: `be4f2427e79ff50eaca2fdbfb2fb6f534d9b61fb20cc79744648401d07a9b613`.
- O115 Tomb source-index-to-RGB witness domain: bytes 2–51, 50 observed indices, original fixed-report SHA256 `3015abb40e57ffbc449d110c855b0b6c25d0074e77742988ce352dfbc2f7ebdb`.

## Alignment recovered

`floor_source_column = 291 + floor(screenshot_x / 2)`

`floor_source_row = floor((screenshot_y - 318) / 2)`

`GRA source byte = authenticated packed suffix[row * 896 + floor_source_column]`

`predicted RGB = O115-Tomb observed_rgb[GRA source byte]`

This is a **conditional alignment** in this one gameplay screenshot, not a confirmed emulator camera-state variable or raw VGA DAC allocation.

The fitting uses 310 calibration pixels in the central unobstructed floor (x259..379 at step4, y340..367 at step3). The independent validation uses entirely disjoint pixels:

| Held-out floor region | Matching / sampled pixels | Agreement |
|---|---:|---:|
| Left, x10..80 and y339..395 | 4,047 / 4,047 | 100% |
| Center-bottom, x245..394 and y370..395 | 3,900 / 3,900 | 100% |
| Right, x550..624 and y339..395 | 4,275 / 4,275 | 100% |
| **Total held out** | **12,222 / 12,222** | **100%** |

This also independently verifies the earlier 16,872 / 16,872 all-region exploratory check from the same frame; **12,222** is the cleaner disjoint-validation count.

Five negative models failed in the held-out regions: left 290 (3,955 matches), left 292 (3,959), row origin 317 (7,327), row origin 319 (7,448), and incorrectly proportionally rescaled width (7,318). These falsify weaker apparent fits and isolate the actual screenshot geometry.

## Reproduction tools and evidence

- Producer (authenticated source, fit plus disjoint hold-out): `tools/mk2_stage_runtime_witness/fit_o117_tomb_control.py`.
- Independent verifier (separately implemented pixel loops): `tools/mk2_stage_runtime_witness/verify_o117_tomb_independent.py`.
- Test suite (negative cases and falsified reports): `tools/mk2_stage_runtime_witness/test_o117_tomb_control.py`.
- Machine-readable report: `research_outputs/O117_TOMB_ORIGINAL_CONTROL_RECONSTRUCTION.json`.
- Original screenshot: `evidence/mk2_o117/TOMB_ORIGINAL_CONTROL_20261011.png`.
- Requires an original legally supplied MK2 installation/ZIP containing the exact canonical `tomb.gra`; no game resources bundled in the source research files.

## Cross-check against O115/O116

- **Portal** was previously matched 4,420/4,420 in an unoccluded region under a separate screenshot-coordinate model.
- **Tomb** is now matched 12,222/12,222 in independent, held-out unoccluded regions.
- In O116 the Tomb demo output used sourceLeft=290, derived from an earlier *different* ruler screenshot with different crop geometry. In **this** 637px screenshot, literal 2× scaling and sourceLeft=291 match. This difference is not by itself evidence of an in-game camera shift. O116 files remain unchanged; this O117 result is layered on top.
- Both screenshot-confirmed floor previews remain **floor-only and conditional**; this does not reconstruct character sprites, backdrops, foreground layers, live palette bank selection or a verified camera register.
- The other five packed-source floor resources remain unverified by gameplay color witnesses.

## Next research direction

Proceed with MK2 runtime palette-bank owner/allocator instrumentation, but do not hold up tool UI improvements that can safely consume witnessed floor-layer previews. A runtime debugger or controlled DOSBox memory trace is required to identify the live palette handles and camera variables. MK1 and MK3 follow MK2 per existing roadmap. No fighting AI or Authentic Enhanced runtime work is undertaken here.
