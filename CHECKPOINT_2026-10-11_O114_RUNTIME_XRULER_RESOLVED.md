# MK2 O114 — First live X-ruler witnesses and stage-specific color observations

**Date:** 2026-10-11. **Status:** user-supplied DOSBox screenshots analyzed, independent image verifier passed. Next input gate is O113 Y-rulers and index ramps. **This targeted checkpoint is not claimed as an additional 50-pass batch.** The O111 and O112 50-pass research batches remain closed.

## Original user evidence

| O113 experiment | Uploaded screenshot | Image SHA-256 | Dimensions | Interpretation |
|---|---|---|---|---|
| 20 — unmodified Portal control | `evidence/mk2_o114/20.png` | `19858a54a7d9d3b09542dbcba06ff501aa29e9b9186cc07c3bbf3bdcde367f07` | 639×397 | Original-looking Portal floor; binary ruler not identified |
| 21 — Tomb X ruler | `evidence/mk2_o114/21.png` | `c3655fa02742a266f6da358d057b8293f4ca6dc24f875d87a03f1dcd6b48a19a` | 632×363 | Two-color floor displays unique 32-cell source code |
| 24 — Portal X ruler | `evidence/mk2_o114/24.png` | `d3833ca29fb2c6c042be825f6814a9f600c7ad58651f233c29401a612e458d36` | 621×399 | Two-color floor displays same source code under a different index→color mapping |

The test kit's O113 static manifest independently establishes that experiment 21 altered only the authenticated `TOMB.GRA` packed suffix, and 24 only the authenticated `PORTAL.GRA` packed suffix, with shared 11-byte F9-menu unlock in `MK2.EXE`. Their different source data does not identify a specific live palette handle.

## Correlation to authenticated 896-column source

The O113 generator used a 32-cell de Bruijn order-five sequence, each cell 28 source bytes wide: `00000100011001010011101011011111`. The O114 image inspector compares candidate source-column alignments 0..576, under **explicit x scaling to 320 apparent screen columns**, using O110Z-observed two-color floor swatches. It does not pretend that the incoming screenshots are native DOSBox 320×200 captures.

| Evidence | Qualified screenshot rows | Conditional left source offset span | Median exact-color pattern agreement | Polarity | Interpretation |
|---|---:|---:|---:|---|---|
| 21 Tomb | 41 | 290–291 | 98.188% | direct | Binary source ruler visible in gameplay floor |
| 24 Portal | 34 | 317–326 | 95.932% | inverted | Same ruler visible, row-varying alignment |
| 20 Portal control | 0 | not applicable | not applicable | not applicable | Ruler absent |

An **independent** second verifier, without importing the primary fitting algorithm, checked over **22,352 Tomb** and **18,008 Portal** swatch-classified screen pixels and confirmed 41 and 34 corresponding rows with minimum match 97.590% and 94.023%, respectively.

Absolute offsets remain **conditional** because (a) the screenshots are resized/cropped rather than native raw emulation frames, (b) the floor blitter may shift source columns by row, (c) no camera memory/address was sampled, and (d) fighters and overlaid sprites occlude parts of the floor. The values do not uniquely establish the runtime `camera_x` variable.

## Conditional two-point source index ↔ displayed RGB observations

Under these **particular test conditions only**, with the original stage's loaded palette and the O113 source-index fills:

| Test | Raw packed source byte | Observed floor RGB |
|---|---:|---|
| Tomb X ruler | `2` | `(93,36,12)` |
| Tomb X ruler | `51` | `(52,12,12)` |
| Portal X ruler | `3` | `(36,4,4)` |
| Portal X ruler | `80` | `(101,69,36)` |

The direct vs inverted correlation disambiguates which raw byte produces each observed RGB swatch; earlier checker experiments established the swatches but **not** their assignment to the high or low packed input byte. These observations **are not a complete palette mapping** and do not distinguish executable 32-bit palette-base arithmetic, DAC entries, allocation, or compositing interactions.

## Regression and falsification

- All 34 preexisting O111/O112 tests passed.
- All 14 O113 tests passed.
- All 13 new O114 tests passed: live Tomb and Portal ruler detections, control rejection, four prior unrelated O110Z captures rejected, synthetic known-position and inverted-color capture recovery, nonsense high-frequency negative control, wrong-stage and invalid-stride rejection, plus De Bruijn uniqueness.
- Primary reports reside in `research_outputs/O114_{TOMB_21_XRULER,PORTAL_24_XRULER,CONTROL_20}_REPORT.json`, with screenshot SHA-256s. Recompute with `tools/mk2_stage_runtime_witness/fit_o113_ruler.py`.
- Independent verification is implemented separately in `tools/mk2_stage_runtime_witness/verify_o114_witness_independent.py`. It operates on pixels, fixed source windows and original witnessed RGB samples; it does not trust the primary JSON reports.
- There was no native DOSBox executable testing inside the research environment; the user supplied actual runtime images.

## Next necessary user input (no new kit required)

Use the **existing** O113 seven-installation test kit and launcher `RUN_CALIBRATION.cmd`, with the proven F9 stage-selection cheat menu. Please capture gameplay as close to native 320×200 DOSBox resolution as possible, using Ctrl+F5 if it works:

1. **22 — TOMB Y RULER**, cheat Background = KOMBAT TOMB: verifies source row/screen placement.
2. **25 — PORTAL Y RULER**, Background = THE PORTAL: independent source-row placement and its variation.
3. **23 — TOMB INDEX RAMP**, Background = KOMBAT TOMB: exploratory source-index to visible RGB relationship.
4. **26 — PORTAL INDEX RAMP**, Background = THE PORTAL: corroborating/different palette relationship.

Send screenshots named `22.png`, `25.png`, `23.png`, `26.png`; if minimizing effort, start with `22` and `25`, then ramps. The current evidence cannot infer full live bank identity, untested five stage resources, or the precise true 320×200 stage placement.

**Priority unchanged:** MK2 extraction/compilation research first, followed by MK1 → MK3 → application UI; optional Authentic Enhanced game runtime and bot remain deferred.
