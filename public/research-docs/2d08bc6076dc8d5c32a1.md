# MK DOS Archive — O113 stage floor camera/palette calibration: runtime boundary

**Date:** 2026-10-11. **State:** source tests and seven-installation kit VERIFIED; live DOSBox screenshots REQUESTED. **Not 50 additional qualified research passes.** This checkpoint intentionally stops at the user's next experimental input rather than padding the pass count with redundant parameter sweeps.

## Why this experiment

O110Z confirmed gameplay floor modifications in `TOMB.GRA` and `PORTAL.GRA`. O111 recovered reversible 896-byte source-row suffix edits for seven executable-referenced stage resources. O112 simulated 320-byte viewport read/camera offsets/whole-DWORD palette-base addition. But **the live horizontal source crop, displayed source-row placement, index→RGB association and live palette-bank start are still unknown**. The Windows emulator is not runnable in this environment. These require genuinely observed gameplay.

O113 implements source-space binary rulers and a controlled index ramp, then prepares **seven independent full MK2 test folders** with the previously successful 11-byte F9 hidden-menu unlock. The source archive stores only code, evidence, docs and user screenshots, not the commercial game copies, which ship separately in the private user test kit.

## Seven experiments

| ID | Forced stage | Packed source edit | Intended observation |
|---|---|---|---|
| 20 `20_CHEAT_CONTROL` | Tomb or Portal | None | Untouched resource control, same F9 cheat EXE |
| 21 `21_TOMB_X_RULER` | Kombat Tomb | 32 binary column cells of 28 bytes | Distinct 5-cell sequence establishes source-column location if renderer shows pattern |
| 22 `22_TOMB_Y_RULER` | Kombat Tomb | 64-bit length-six de Bruijn row code | Source row identity and visible placement |
| 23 `23_TOMB_INDEX_RAMP` | Kombat Tomb | Each 4-byte source cell traverses originally observed raw byte domain 2–51 | Pixel color associations; **not** a proven RGB palette dump |
| 24 `24_PORTAL_X_RULER` | The Portal | Same source X ruler | Independent camera/layer comparison |
| 25 `25_PORTAL_Y_RULER` | The Portal | Same source Y ruler | Independent stage row layout |
| 26 `26_PORTAL_INDEX_RAMP` | The Portal | 4-byte-cell raw byte domain 3–80 | Conditional color/source relationship |

The de Bruijn column code is `00000100011001010011101011011111`, covering **exactly 32 × 28 = 896 original source bytes**, with every consecutive five-bit cyclic segment unique. All original source rows receive it. The row code is `0000001000011000101000111001001011001101001111010101110110111111` (length 64), of which Tomb uses 48 and Portal uses 40 rows. Raw index values are selected from original authenticated source minima and maxima; neither their VGA colors nor runtime palette bank are assumed. The 4-byte ramp cell aligns with the stage blitter's DWORD operations; owing to carry, its projected index output may not equal the raw source value.

## Runtime integrity controls

- Input fixture: user's canonical `mk2.zip`, 614 original game files.
- Canonical `MK2.EXE` SHA-256 `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`.
- Every test instance has the proven O110Z **11-byte-only** F9 unlock at original EXE offset `0xCCF0E`; patched EXE SHA-256 `95f925bcf343701cd92d2fc631df4df6c8c98d51b1553c62ae4918349b074928`.
- Every resource experiment modifies **only** its targeted original `TOMB.GRA` or `PORTAL.GRA` packed suffix, leaving file size, file prefix, every other original game file, and all other resource files byte-identical. Control modifies no resource.
- Full runtime-kit ZIP integrity and a **separately implemented** original-corpus verifier were run; **4,298 individual game-file entries passed** (614 × 7). All binary edits and manifest counts were checked. The kit SHA-256 is `816c7c8d8483927c5a043da1b63af24b9fba36c8cd8b921a3404f6fd0b12a20d`.
- Preserved **34 O111/O112** regression methods plus **14 new O113** methods, including a synthetic 320×200 X-ruler and negative control using the prior unrelated Tomb checker screenshot. All **48** tests passed.
- The screenshot inspector uses two dominant floor colors and permits both color/bit polarities; it reports **UNCONFIRMED_PATTERN** unless there are at least three rows with qualified, distinctive fits. It never labels a screenshot-derived offset as confirmed game camera memory.
- Original MK1/MK2/MK3 installations are never modified in place. No new DOSBox runtime test has occurred at O113.

## Prior O110Z RGB screenshot bridge

`research_outputs/MK2_O113_RUNTIME_RGB_WITNESS.json` records byte-exact screenshot SHA-256, image dimensions, bottom 45-pixel floor sample coordinates, most-frequent RGB swatches and approximate VGA6 channel values. Observations, **not proven bank or raw index-to-RGB mapping**:

- `11.png` (Tomb checker raw values `{2,51}`) predominantly `RGB(52,12,12)` and `RGB(93,36,12)`.
- `12.png` (Tomb flat raw value `41`) predominantly `RGB(142,101,85)`.
- `13.png` (Portal checker raw values `{3,80}`) predominantly `RGB(101,69,36)` and `RGB(36,4,4)`.
- `10.png` (original Portal control) has multiple original floor colors; it is not a known-index swatch.

The original user screenshots are at non-native display dimensions (`629×387` or `639×403`), so they are not perfectly aligned 320×200 frame captures. An approximate 6-bit channel estimate does not establish the VGA DAC write sequence or live bank allocation.

## User input: narrow first round

Extract `MK2_O113_Calibration/` **beside** existing `DOSBOX/` and `MK2/` folders, run `RUN_CALIBRATION.cmd`, and use the same F9 cheat-menu procedure already proven in O110Z. Choose `Background = THE PORTAL` for 20 and 24; `Background = KOMBAT TOMB` for 21. Capture active game frames preferably via DOSBox **Ctrl+F5** native PNG. Label screenshots `20`, `24`, `21`. No need to run 22/23/25/26 until the first rulers confirm visibility and geometry; the installer already contains them for follow-up without another download.

**Evidence needed**: three user gameplay screenshots (20, 24, 21), and optionally a fourth **20 control with forced Tomb** for strict same-stage Tomb comparison. Then compare observed stripes to source de Bruijn windows; validate live crop, stage floor screen placement, and whether to use row and index ramps. Do not claim palette bank start from a single visual calibration.

## Reproduce static tests

```bash
python -m unittest discover -s tools/mk2_packed_stage -p 'test_*.py' -v
python -m unittest discover -s tools/mk2_stage_runtime_calibration -p 'test_*.py' -v
python tools/mk2_stage_runtime_calibration/build_test_kit.py /path/to/mk2.zip /tmp/MK2_O113_Calibration.zip
python tools/mk2_stage_runtime_calibration/verify_test_kit.py /path/to/mk2.zip /tmp/MK2_O113_Calibration.zip
python tools/mk2_stage_runtime_calibration/inspect_screenshot.py /path/to/21.png
python tools/mk2_stage_runtime_calibration/analyze_o110z_witness.py evidence/mk2_o110z/runtime_screenshots
```

Research order remains MK2 → MK1 → MK3 → UI → extractor/compiler milestone. Long-term Authentic Enhanced runtime and bots remain deferred.
