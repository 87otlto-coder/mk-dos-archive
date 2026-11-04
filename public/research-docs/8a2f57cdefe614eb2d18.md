# O123 — Original Kombat Tomb Architectural and Sky Layer Placement Witness

**2026-10-11 | MK2 development checkpoint | Substantive targeted result, not a 50-pass batch**

## Grounded result

O122 independently decoded all 49 source sprite streams and ten conditional setup-local mosaics. O123 now aligns **two separate mosaics** against the *original unmodified Tomb gameplay screenshot* originally provided by the user for O117. This is new source-to-gameplay evidence for non-floor layers, following O122's original Portal backdrop screenshot witness.

| Layer | Object-2 setup | Original mosaic | Screenshot-relative sampled source shifts | Fit | Held-out |
|---|---|---|---|---:|---:|
| Tomb architecture (arches, skull columns, lower railing) | `0x1737C` | 850×224 | +267 columns, +57 rows | 960/960 | 2,650/2,650 |
| Tomb orange sky band | `0x173B2` | 320×80 | +2 columns, −47 rows | 1,074/1,074 | 823/823 |

Both alignments are exact RGB matches in deliberately unobstructed screenshot regions; fitting coordinates and verification coordinates are disjoint. The screenshot is 637×397 and has exact 2× nearest-neighbor pixels, with cropped edges. Sample points use **even** screenshot coordinates to avoid edge-parity ambiguity. The fitted model for each output is `sourceX=floor(screenX/2)+shiftX` and `sourceY=floor(screenY/2)+shiftY`. The two layers use *different source-local coordinates*. The offsets are **not** emulator camera-register values, and no global stage compositing model has been proved.

**Original screenshot SHA256:** `5cd8f5ed5d75a4098df714b45a24ba2d7fe6ab43881add8e9c1043aa2b8e9ec9` (`evidence/mk2_o117/TOMB_ORIGINAL_CONTROL_20261011.png`). All three original .GRA files and canonical `MK2.EXE` must match O121/O122 source hashes. Neither the screenshot nor the original game resources are modified.

## Controls and independent verification

The bounded fitter exhaustively checks screenshot-space shifts +0..530 columns/+0..100 rows for architecture, using both upper architecture and bottom railing to discriminate repeated pillars. It separately checks sky shifts −3..+7 columns/−70..0 rows. Only candidates with substantial opaque sample coverage qualify. The two alignments have the highest exact-match counts for these fixed regions.

The independent auditor **does not import the O123 fitter or O122 producer**. It reconstructs the two sprite mosaics through O121 original-file descriptors and the independent O122 indexed-stream decoder, rechecks both SHA256 RGBA buffers, and loops over screenshot pixels directly. It reproduces all **5,507 independent exact match pixels** (2,650 + 823 holdouts; 960 + 1,074 fit), and rejects **14** incorrect architecture/sky offsets. False camera claims are prohibited in the report.

O123 regression tests: **20/20**. Earlier O120/O121/O122 Python suites: **23 + 32 + 20 passed** in this run. Tests include original checksum enforcement, wrong screenshot/source rejection, corrupted evidence fields, incorrect shifts, pixel-count falsification, and forged runtime-ownership assertions. Full browser app build remains unverified; only descriptive MK2 advanced-stage-viewer copy was updated, without changing decoding logic.

## Research limits and next step

- A correct mosaic screenshot match means **those source layer pixels participated in the observed image**; it does not prove which setup pointer was live, exactly when it was selected, or full ordering against every other layer.
- The two offsets are aligned to *different* source-local mosaics and should not be interpreted as a single camera position.
- O117 retains its independent, validated 12,222-pixel Tomb *floor* match. This O123 evidence adds architecture and sky; neither invalidates the other.
- Tomb central yin-yang structure, character compositing, dynamic elements, live allocator handles/DAC start, and active setup pointer remain unproven.
- Follow the O120–O121 setup-selection path, or design an emulator trace at `0x81C53` and `0x81DDA`, to observe live setup and handle values if necessary. No new DOSBox input is required for this screenshot witness.

**Commands:** see `tools/mk2_native_stage_palettes/README.md`. Results and independently built audit are in `research_outputs/O123_*`. Main source still needs user's own original DOS game files to run decoder experiments. Long-term bot and Authentic Enhanced runtime are postponed. Research cadence is a ceiling of 50 passes per run, not a quota.
