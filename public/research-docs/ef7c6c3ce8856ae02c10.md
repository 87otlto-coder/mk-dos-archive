# MK2 O115 — User runtime Y-rulers and full conditional stage-index color ramps

**Date:** 2026-10-11. **Status:** four user-supplied gameplay captures verified against the O113 authenticated binary test-kit source and independently checked pixel analyses. **This is a targeted runtime evidence checkpoint, not 50 newly counted research passes.** The existing O111 and O112 50-pass batches remain closed.

## Source/evidence pairing

| O113 test | Uploaded image | Stage | Deliberate original-source alteration |
| --- | --- | --- | --- |
| 22 | `evidence/mk2_o115/22.png` | Kombat Tomb | Source rows 0–47 filled with B(2,6) binary ruler, low byte 2 vs high byte 51 |
| 25 | `evidence/mk2_o115/25.png` | The Portal | Source rows 0–39 filled with B(2,6) binary ruler, low byte 3 vs high byte 80 |
| 23 | `evidence/mk2_o115/23.png` | Kombat Tomb | Source byte `2 + ((source_column // 4) % 50)` |
| 26 | `evidence/mk2_o115/26.png` | The Portal | Source byte `3 + ((source_column // 4) % 78)` |

The original packaged resources in `/mnt/data/MK2_O113_Stage_Camera_Palette_Calibration_Test_Kit_2026-10-11.zip` were inspected independently: **every byte** of each target packed suffix matched the expected constructed ruler or ramp. The source package itself never redistributes those commercial MK2 resources.

## Verified Y source-row witnesses

Source ruler: `0000001000011000101000111001001011001101001111010101110110111111`. A conservative 2x screenshot model (`screen_image_y = origin + 2*source_row`) yields:

| Stage | PNG physical size | Conditional initial source-row image Y | Eligible whole-image rows | Bit match | Distant-offset competitor |
| --- | --- | ---: | ---: | ---: | ---: |
| Tomb 22 | 634×399 | **318** | 81 | **100%** | 74.40% |
| Portal 25 | 635×401 | **323** | 70 | **100%** | 86.65% |

Those are ***resized screenshot*** row positions; the corresponding `159.0` / `161.5` native-like Y values are approximate, not established VGA or game-state coordinates. They may differ because of display scaling, cropped captures, the stages' composition or floor placement, and camera/gameplay conditions. This is source-to-screen observation, not proof of a specific live `camera_y` or game variable.

## Verified source-index / screenshot RGB tables

- Tomb 23 has **50 of 50 raw-source-byte values (2–51)** with observed RGB for each. There are **48 distinct RGB colors**; some different raw values produce identical observed RGB.
- Portal 26 has **78 of 78 raw-source-byte values (3–80)** with observed RGB for each. There are **77 distinct RGB colors**.
- The screenshot ramp pattern advances **8 visible image pixels per source-index entry** (4 source bytes per step at approximately 2x output size).
- Tomb's minimum-source-index color appears at screenshot x=223 and again at x=623, exactly **400 image pixels apart** (= 50 indices × 8 pixels).
- Portal's minimum appears at x=42 and is immediately preceded by the high-end color; the 78-index period is 624 image pixels.
- Both samples reproduce the O114 independently witnessed two-color endpoints; **128 entries** are therefore associated with an RGB as observed in the specific test fights, not a proof of globally selected 128 DAC palette slots.
- The full 128-row human-readable table is `research_outputs/O115_OBSERVED_STAGE_FLOOR_RGB_TABLE.csv`. The machine-readable reports `O115_TOMB_23_RAMP.json` and `O115_PORTAL_26_RAMP.json` retain per-source-index RGB, sample counts, provenance and dominant-pixel purity.

**Conditional horizontal source alignment:** Tomb min-index anchor x=223 is compatible with source offset ≡ 89 (mod 200) under approximate 2x scaling; source starts of 89, 289, or 489 could give the same ruler-ramp modulo. Earlier X ruler around 290–291 provides a *separate-frame* cross-check for ~289, not proof of the frame's camera register. Portal anchor x=42 yields a start ≡ 291 (mod 312), with the same screenshot-size and separate-frame caveats. Neither mapping resolves the original palette allocator's stage-handle ownership.

## O115B cross-capture control reconstruction — byte-exact floor match

A further, **independent screenshot** was available from O114: `evidence/mk2_o114/20.png` shows an original, unmodified Portal floor. Using the **untouched original `PORTAL.GRA`** packed source plane (SHA-256 `cf16116e96a21fcc17dbfd841e0fb3b5b73c972b1addb5177bfc09b8d1745b82`) and the 78 source-index→RGB entries recovered from the separate O115 test 26 ramp capture, the new `verify_o115_portal_control.py` searches the conditional source-left and vertical image-origin parameters:

- Unique highest-scoring fit in the documented 2× model: **source left x=292, image Y origin=321**. On an unbiased 774-pixel central fit grid, **774/774 pixels agree exactly**; the best distant candidate matches only 161/774.
- Independent, denser held-out central-floor grid: **2,210/2,210 exact RGB matches**, covering **19 different RGB colors**; unoccluded left region **1,040/1,040 exact matches**.
- Broader stage floor including overlaid fighter silhouettes: **6,309/7,800 exact matches** (80.8846%). Lower floor region: **1,732/1,800 exact matches** (96.2222%). Mismatches are expected from characters and overlays not included in this packed-floor-only reconstruction.
- This is **cross-frame validation**: the color map derives from test 26, but the pixel-perfect unmodified floor is from the earlier test 20 control, neither the same test file nor a source-index ramp.

This strongly confirms the practical ability to render an authentic original Portal packed floor from the resource data plus the observed index colors. It does **not** identify the live MK2 palette bank, all stage layers, or camera RAM addresses. The fit-origin is conditional on the user's non-native screenshot scaling/cropping. The same technique has not yet been cross-validated on an unmodified Tomb control screenshot.

The `O115_PORTAL_CONTROL_RECONSTRUCTION.json` report preserves the exact comparison region, scores, control PNG SHA-256, original resource identity, and screenshot-ramp evidence SHA-256. Reproduce with **your original, personally supplied commercial** `mk2.zip` (not bundled):

```sh
python tools/mk2_stage_runtime_witness/verify_o115_portal_control.py \
  --original-mk2 /path/to/your/mk2.zip \
  --control evidence/mk2_o114/20.png \
  --ramp-report research_outputs/O115_PORTAL_26_RAMP.json
```

## Verification/audit

- **478 independently recomputed assertions**, including four complete original source packed-suffix patterns from the O113 user runtime test ZIP, PNG identities, 81+70 ruler rows, 50+78 index mappings and repeated Tomb phase.
- **79 Python regression methods passed**: 34 O111/O112, 14 O113, 13 O114 and 15 new O115.
- Four adversarial report edits (altered source-color record, Portal index color, Y origin and PNG fingerprint) were independently rejected; earlier O114 control and X-ruler frames rejected as false Y/ramp witnesses; wrong-stage ramp experiments also rejected.
- No original unmodified game directory was changed; source ZIP incorporates only analysis code, user evidence, CSV/JSON findings and docs.

## Important unresolved boundaries

A full observed **source byte → displayed RGB table** in a test capture does **not** establish: (a) a complete 256-entry VGA DAC palette, (b) the palette-allocator ID or palette-bank start loaded at runtime, (c) the whole-DWORD palette-base carry behavior for arbitrary byte patterns outside the tested ramp, (d) pixel compositing across other stage layers and five untested stages, (e) variation over game frames and characters, or (f) internal camera-state addresses.

The next static work should join these conditional screenshot colors to the O112 viewport projector and the original palette candidate corpus, with explicit provenance instead of silently treating this table as an authenticated native palette. For live DAC/bank assignment, a later DOSBox memory/VGA instrumentation experiment will be needed. The user **need not rerun tests 22, 23, 25 or 26**.

## Reproduce

From the top of this project source (Pillow required):

```sh
python tools/mk2_stage_runtime_witness/fit_o115_y_ramp.py evidence/mk2_o115/22.png --stage tomb --kind y
python tools/mk2_stage_runtime_witness/fit_o115_y_ramp.py evidence/mk2_o115/25.png --stage portal --kind y
python tools/mk2_stage_runtime_witness/fit_o115_y_ramp.py evidence/mk2_o115/23.png --stage tomb --kind ramp
python tools/mk2_stage_runtime_witness/fit_o115_y_ramp.py evidence/mk2_o115/26.png --stage portal --kind ramp
python tools/mk2_stage_runtime_witness/verify_o115_witness_independent.py --evidence-dir evidence/mk2_o115 --reports-dir research_outputs
# Add --test-kit /path/to/MK2_O113_Stage_Camera_Palette_Calibration_Test_Kit_2026-10-11.zip to reverify the patched binary originals.
python -m unittest discover -s tools/mk2_stage_runtime_witness -p 'test_*.py' -v
```

Research priorities remain MK2 → MK1 → MK3 → integrated extractor/compiler. Long-term bot and Authentic Enhanced runtime ideas are deferred.
