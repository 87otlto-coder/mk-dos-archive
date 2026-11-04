# MK DOS Archive — O216 Pit II fatality: source-authenticated intermediate textures, fighter poses and crack-placement evidence

**Predecessor:** O210. **Date:** 2026-10-17. **Status:** additive read-only research. Do not reinterpret this as a complete original game renderer, executable fatality dispatcher, game-tick scheduler, automatic animation editor or runtime DAC trace.

## 1. Reproduced and independently extended

The original O210 verifier was successfully rerun unchanged against the owner's canonical DOS MK2 ZIP and 2026-10-17 15:19:33 recording. Reproduced 61 original FALL.GRA decodes, original 250,804-byte exact stream tiling, sprite 55 rock-wall R² 0.965888, sprite 60 initial descent R² 0.620017, falling pose42 RGB R² 0.972910, and 29.8s full-frame reconstructed scene RGB MAE 3.559797. These were O210 facts, not new O216 claims.

Input SHA-256: MK2.EXE `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`; FALL.GRA `60e6c56f7720b2bda89714b818c885e41c523e978807697d0d7d8f07d37551a0`; PIT.GRA `af6c10b676011cbbd0b8ef3fe4523cf52b36ebd3be15b2dcb4190b9a34c81d96`; fatality video `198b5ecccb1cca898e4da7ba1282104fac71c2e3bc8a6009638420deb9dede48`; upper-stage video `3fecb35f35fb6786528b64ac5b6322ef65564885bf735405955cb1f11f928d94`.

## 2. Main breakthrough: original intermediate rocky background textures

O210 compared the end textures 60 and 55 but did not test the other four original lower-environment graphics as the *intermediate* scene. In O212 and O214, a small unoccluded left patch chose among ALL six original source graphics 55–60 and searched each candidate's original-dimensional 2D repeating offset. Four completely separate capture regions then evaluated that choice. All sampled 29.267–29.900s capture frames chose the same source on held-out RGB metrics, including a source-only color check.

Observed **30fps VIDEO capture-frame** sequence:

| Capture frame | Video time | Original FALL.GRA graphic | Estimated tile phase (X,Y) modulo source dimensions |
|---|---:|---:|---|
| 878–885 | 29.267–29.500s | 60 (96×96) | (48,16) |
| 886–888 | 29.533–29.600s | 59 (96×96) | (16,80) |
| 889–891 | 29.633–29.700s | 57 (64×64) | (0,0) |
| 892–893 | 29.733–29.767s | 56 (80×80) | (40,56) |
| 894 onwards | 29.800s onward | 55 (96×96) | (48,16), later (48,12) |

**Graphic 58 was NOT selected in this recording**. Its actual role elsewhere is UNKNOWN. The phase is a video-to-original-tile modulo alignment, **not** a verified executable camera transform. Frame 895 intermittently uses phase `(48,12)` and later steady post-impact frames use `(48,12)`; interleaved frame positions before the settling event differ. See per-frame output; do not replace it with a false one-shot camera rule.

O212 learned a palette only on independent 31.0s checkerboard wall pixels and then obtained **3.1–3.7 /255 per-channel error** in the original selector patch and independent hold-out areas for 29.4–29.8s. O214 then eliminated video color learning by using the *original executable-linked Pit 81-color record*. Source-color held-out errors are approximately 5–7 /255 per channel in these source-selected frames; every source winner remains stronger than competing originals by large margins. O214 output contains all competitors, coordinates, and four withheld-regions per frame. A small number of later frames have visible interference in an individual holdout patch; this is retained, not suppressed.

## 3. Original stage palette connection

The original The Pit setup's Object-2 palette pointer field at `0x18D40` resolves through the verified EXE file-image mapping (`Object-2 image base 0xA0C54`, Object-1 image base `0x61C54`) to physical EXE offset **`0x895AC`**, which begins a **81-color** record. This original source link was already established in O205 for the *upper* `PIT.GRA` stage; O214 now independently tests the record with **lower `FALL.GRA` pixels**. At the 31.0s wall image, using its original 15-bit words converted through the existing stage renderer's RGB mapping gives **5.10472/255 RGB MAE** on heldout safe pixels and RGB R² ~0.91. The neighboring independently established *Kombat Tomb* source palette at 0x893C6 gives **57.45473/255 MAE**, an intentionally incorrect stage control. A video-fitted wall palette gives ~3.2/255, as expected from calibration on that recording. This is strong evidence that lower fatality textures share the upper Pit palette relationship; it does **not** establish the exact moment the original runtime installs DAC values.

## 4. Intermediate falling poses (O215)

Matching foreground silhouettes only *after first selecting the original backdrop* yields strong pose identities at 30fps capture cadence (results include per-frame placements, multiple alternatives and F1 scores):

| Capture frames | Original FALL pose | Approx source placement |
|---|---|---|
| 878–879 | 42 | (133,63) |
| 880–882 | 44 | (126,60) |
| 883–885 | 46 | (129,69) |
| 886–888 | 43 | (129,70) |
| 889–891 | 45 | (129,63) |
| 892 | 46 | (129,69) |
| 893–894 | 42 | (133,63) |
| 895+ | 47 impact pose candidate | See O210 for 29.9–31.0 color-validation controls; silhouette alone is confounded by impact effects/title |

F1 for poses 42–46 in these selected descent frames is generally **0.93–0.95**, with second-ranked candidates substantially poorer. Video-captured repetitions do NOT prove game logic loop frames or callback intervals. The earlier 29.3/29.4/29.5 O210 classifications are not contradicted.

## 5. Original masked crack source54 — stronger, bounded evidence

O211 mask search independently returns the same post-impact placement **(104,44)** at 30.133s, 30.3s and 31.0s, with mask F1 around 0.51; this score is not a claim of exact visual alpha because other game layers occlude it. O216 goes beyond the occupancy match: it applies source sprite54's **original RGB-indexed pixels**, colored ONLY by the original exe-linked Pit palette, over original wall55; it excludes the verified source47 body silhouette, bright lettering and blood-like colors in a declared region. In post-impact captures, original sprite54 at **(104,44)** lowers regional full-image RGB MAE by ~**0.44/255**, and on its visibly scored crack pixels reduces per-pixel MAE by around **12/255** versus wall-only. Shifted candidates `[104,48]`, `[94,44]`, `[114,44]`, `[104,54]`, `[74,44]`, `[124,64]`, `[144,84]` generally **worsen** the same heldout visual mask error. Before impact, the same crack placement does NOT improve the fit.

The 30.0s input might exhibit a different vertical phase; the exact turn-on frame, blending/draw order, and runtime calls remain **UNVERIFIED**. Source54 at (104,44) is a strong visual placement candidate, not a proven state-machine callback.

## 6. Still-open Pit II work — do NOT delete

1. **Upper-stage bridge fighters:** In the authentic Pit recording two small figures animate in the distance. The six original PIT.GRA source setups from O205/O208 do not draw them. `MONKS.GRA` is out of the verified EXE filename pool, and its 608 little-endian DWORDs are *all skip-command shaped* under the normal packed-graphics decoder (0 opaque payload runs); therefore it is NOT evidence of a drawable original Pit-bridge sprite under that grammar. Other interpretations of MONKS.GRA remain unproven, and the two figures' true source, palette, animations and foreground depth are unsolved. Do not omit these background actors or substitute fabricated art in a supposedly complete Pit scene.
2. Complete exact upper-stage active mode, layer order, thin-layer X positioning and camera/parallax arithmetic. O208 measured an 8:1 near:far ratio empirically with source-linked inputs, not a full executable camera expression.
3. Game program dispatcher and finishing-move triggering preconditions. The O209 three-pass Gate 1 was a correct **NO-GO** on executable patching. O209.2's external macro is independent and was not used for O210–O216 capture.
4. Actual draw callback and animation frame schedule in DOS runtime; exact internal game clocks vs 30fps recording.
5. Full source attribution, color-bank state and layering of red blood/debris, fighter victory lettering and post-fatality text, and live sound timing.
6. Whether original sprite58 participates in a different falling camera state, stage fatality or alternate game variant. The observed O214 sequence does NOT show it in the qualified sample window.

## 7. Reproduction and preservation

No input binaries, old research scripts, legacy application components, UI, EXE patches or tested game assets were modified. New research scripts are additive in `scripts/`. Start by rerunning inherited `scripts/verify-o210-pit-fatality.py`. Then run:

```
python scripts/verify-o214-pit-original-palette-transition.py --game-zip <original-MK2-zip> --video <original-15-19-33-recording> --o210-script scripts/verify-o210-pit-fatality.py --out <new-O214-output-directory>
python scripts/verify-o215-pit-pose-timeline.py --game-zip <original-MK2-zip> --video <original-15-19-33-recording> --o210-script scripts/verify-o210-pit-fatality.py --o214-report <O214-output-directory>/O214_SOURCE_PALETTE_TRANSITION_REPORT.json --out <new-O215-output-directory>
python scripts/verify-o216-pit-crack-source.py --game-zip <original-MK2-zip> --video <original-15-19-33-recording> --o210-script scripts/verify-o210-pit-fatality.py --out <new-O216-output-directory>
```

Optional intermediate methodology scripts are preserved, including independent O211 first-pass and O212 video-calibrated holdout. These scripts are **read-only**, source inputs hash-guarded and new output directories required. Full owner-proprietary MK2 game files and complete gameplay recordings are *not included*. New report JSONs are included under `research_outputs/` for inspection. This checkpoint does not claim a new React/Vite build, a new application feature, or a complete scene playback implementation.

## Additive O217 video-only bridge animation witness

A bounded frame-aligned probe on the actual upper Pit recording sampled 25 frames from 0.5–4.5s. Every sample's static background patch matched without camera displacement (`(0,0)` shift within ±3X/±2Y candidate registration). Relative to the initial capture, the left small fighter's 17×28 screen region changed by as much as **5.07/255** RGB MAE, and the right one's 19×29 screen region by as much as **9.75/255**. Two comparator empty-sky regions varied by at most **2.89** and **2.94/255** under the same procedure. These are bounded **VIDEO-SPACE temporal observations only**, not proof of the original animation frame count, actor sprites, source resource, sprite identity or game timing. `O217_BRIDGE_ACTORS_OBSERVED_VIDEO_VARIATION.json` retains 25 observations and masks/registration details; `verify-o217-pit-bridge-video.py` reruns them with the SHA-guarded source recording.

The source of the far-bridge fighters is therefore an **explicit unresolved research dependency**; visual evidence proves they have time-varying on-screen pixels distinct from nearby static regions. In particular, do not transform MONKS.GRA's unresolved skip-looking word runs into a verified actor stream.
